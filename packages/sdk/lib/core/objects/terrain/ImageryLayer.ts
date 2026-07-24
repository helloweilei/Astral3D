import * as THREE from "three";
import {
	buildImageryTileUrl,
	type ImageryProviderId,
} from "@/utils/geo/ImageryProviders";
import {
	lonLatToMercatorMeters,
	lonLatToTile,
	setEnuOrigin,
	tileToLonLatBounds,
	mergeBounds,
	expandBounds,
	getStableViewBounds,
	enuToWgs84,
	wgs84ToEnu,
	getTileSizeMeters,
	estimateZoomFromBounds,
	resolveImageryZoom,
	getTileRangeKey,
	parseTileKey,
	isTileInRange,
	type Wgs84Coord,
	type GeoBounds,
} from "@/utils/geo/GeoUtils";

const MAX_TILE_CACHE = 512;
const MAX_ACTIVE_TILES = 320;
const MAX_CREATE_PER_FRAME = 24;
const TILE_REMOVAL_DELAY_MS = 8000;
const REMOVAL_HALO_TILES = 3;

interface TileRecord {
	mesh: THREE.Mesh;
	texture: THREE.Texture | null;
	key: string;
	zoom: number;
	lastUsed: number;
	loading: boolean;
}

interface PendingTile {
	zoom: number;
	x: number;
	y: number;
	key: string;
}

export interface ImageryUpdateContext {
	viewDistance: number;
	target: THREE.Vector3;
}

export class ImageryLayer {
	public readonly group = new THREE.Group();
	private tiles = new Map<string, TileRecord>();
	private activeTileKeys = new Set<string>();
	private pendingRemoval = new Map<string, number>();
	private pendingCreateQueue: PendingTile[] = [];
	private originMercator = { x: 0, y: 0 };
	private config: IAppProject.Terrain["imagery"];
	private loader = new THREE.TextureLoader();
	private currentZoom = -1;
	private lastTileRangeKey = "";

	constructor(origin: Wgs84Coord, config: IAppProject.Terrain["imagery"]) {
		this.config = config;
		this.group.name = "ImageryLayer";
		this.group.ignore = true;
		this.group.frustumCulled = false;
		setEnuOrigin(origin);
		this.originMercator = lonLatToMercatorMeters(origin.longitude, origin.latitude);
	}

	updateConfig(origin: Wgs84Coord, config: IAppProject.Terrain["imagery"]) {
		const needsFullReset =
			this.config.provider !== config.provider ||
			this.config.url !== config.url ||
			this.config.token !== config.token ||
			JSON.stringify(this.config.bounds) !== JSON.stringify(config.bounds);

		const needsTileRefresh =
			this.config.lockLevel !== config.lockLevel ||
			this.config.lockedLevel !== config.lockedLevel ||
			this.config.fixedBounds !== config.fixedBounds ||
			this.config.tilePadding !== config.tilePadding ||
			this.config.minZoom !== config.minZoom ||
			this.config.maxZoom !== config.maxZoom;

		this.config = config;
		setEnuOrigin(origin);
		this.originMercator = lonLatToMercatorMeters(origin.longitude, origin.latitude);

		if (needsFullReset || needsTileRefresh) {
			this.clearTiles();
			return;
		}

		this.pendingCreateQueue = [];
		this.lastTileRangeKey = "";
	}

	update(camera: THREE.Camera, origin: Wgs84Coord, context?: ImageryUpdateContext): boolean {
		if (!this.config.enabled) return false;

		const now = performance.now();
		const { zoom, loadBounds } = this.computeLoadPlan(camera, origin, context);

		if (zoom !== this.currentZoom) {
			this.purgeTilesAtOtherZoom(zoom);
			this.currentZoom = zoom;
			this.lastTileRangeKey = "";
		}

		const tileRangeKey = getTileRangeKey(loadBounds, zoom);
		let needRender = false;

		if (tileRangeKey !== this.lastTileRangeKey) {
			this.lastTileRangeKey = tileRangeKey;
			this.planVisibleTiles(zoom, loadBounds, now);
			needRender = true;
		} else {
			this.touchActiveTiles(now);
		}

		if (this.syncTileVisibility(zoom)) {
			needRender = true;
		}

		if (this.processCreateQueue()) {
			needRender = true;
		}

		if (this.flushPendingRemovals(now)) {
			needRender = true;
		}

		return needRender;
	}

	getCurrentLevel(): number {
		return this.currentZoom;
	}

	/**
	 * 根据当前加载范围估算相机 far，避免大瓦片被默认 100km 远平面裁切。
	 */
	getRequiredCameraFar(
		camera: THREE.Camera,
		origin: Wgs84Coord,
		context?: ImageryUpdateContext
	): number {
		const { zoom, loadBounds } = this.computeLoadPlan(camera, origin, context);
		const viewDistance = context?.viewDistance ?? camera.position.length();
		const cameraPos = camera.position;
		let maxDistance = viewDistance;

		const corners: Array<[number, number]> = [
			[loadBounds.west, loadBounds.south],
			[loadBounds.east, loadBounds.south],
			[loadBounds.east, loadBounds.north],
			[loadBounds.west, loadBounds.north],
		];

		for (const [lon, lat] of corners) {
			const enu = wgs84ToEnu({ longitude: lon, latitude: lat, height: 0 }, origin);
			maxDistance = Math.max(maxDistance, cameraPos.distanceTo(new THREE.Vector3(enu.x, enu.y, enu.z)));
		}

		const tileSize = getTileSizeMeters(zoom >= 0 ? zoom : this.config.lockedLevel);
		maxDistance = Math.max(maxDistance, viewDistance + tileSize * 0.5);

		return Math.ceil(maxDistance * 1.25);
	}

	private computeLoadPlan(
		camera: THREE.Camera,
		origin: Wgs84Coord,
		context?: ImageryUpdateContext
	): { zoom: number; loadBounds: GeoBounds } {
		const { bounds, minZoom, maxZoom, lockLevel, lockedLevel, tilePadding } = this.config;
		const viewDistance = context?.viewDistance ?? camera.position.length();
		const target = context?.target;

		let zoom: number;
		if (lockLevel) {
			zoom = Math.max(minZoom, Math.min(maxZoom, lockedLevel));
		} else {
			zoom = resolveImageryZoom(this.currentZoom, viewDistance, minZoom, maxZoom);
		}

		const boundsZoomCap = estimateZoomFromBounds(bounds as GeoBounds, minZoom, maxZoom);
		zoom = Math.min(zoom, boundsZoomCap);

		let loadBounds = bounds as GeoBounds;
		const useFixedBounds = this.config.fixedBounds || lockLevel;

		if (!useFixedBounds && target) {
			const viewBounds = getStableViewBounds(camera, target, origin, viewDistance, zoom);
			loadBounds = mergeBounds(loadBounds, viewBounds);
		}

		const clampCenter = useFixedBounds
			? {
					longitude: (bounds.west + bounds.east) / 2,
					latitude: (bounds.south + bounds.north) / 2,
				}
			: target
				? enuToWgs84({ x: target.x, y: target.y, z: target.z }, origin)
				: {
						longitude: (loadBounds.west + loadBounds.east) / 2,
						latitude: (loadBounds.south + loadBounds.north) / 2,
						height: 0,
					};

		loadBounds = expandBounds(loadBounds, tilePadding ?? 2, zoom);
		loadBounds = this.clampBoundsTileCount(
			loadBounds,
			zoom,
			MAX_ACTIVE_TILES,
			clampCenter.longitude,
			clampCenter.latitude
		);

		return { zoom, loadBounds };
	}

	private touchActiveTiles(now: number) {
		for (const key of this.activeTileKeys) {
			const record = this.tiles.get(key);
			if (!record) continue;
			record.lastUsed = now;
			this.pendingRemoval.delete(key);
		}
	}

	private purgeTilesAtOtherZoom(zoom: number) {
		for (const [key, record] of this.tiles) {
			if (record.zoom !== zoom) {
				this.removeTile(key, record);
			}
		}
		this.pendingCreateQueue = this.pendingCreateQueue.filter(p => p.zoom === zoom);
	}

	private syncTileVisibility(zoom: number): boolean {
		let changed = false;

		for (const record of this.tiles.values()) {
			const shouldShow = record.zoom === zoom && !record.loading && record.texture !== null;
			if (record.mesh.visible !== shouldShow) {
				record.mesh.visible = shouldShow;
				changed = true;
			}
		}

		return changed;
	}

	private clampBoundsTileCount(
		bounds: GeoBounds,
		zoom: number,
		maxTiles: number,
		centerLon: number,
		centerLat: number
	): GeoBounds {
		const minTile = lonLatToTile(bounds.west, bounds.north, zoom);
		const maxTile = lonLatToTile(bounds.east, bounds.south, zoom);
		const countX = maxTile.x - minTile.x + 1;
		const countY = maxTile.y - minTile.y + 1;
		const total = countX * countY;

		if (total <= maxTiles) return bounds;

		const ratio = Math.sqrt(maxTiles / total);
		const spanLon = (bounds.east - bounds.west) * ratio;
		const spanLat = (bounds.north - bounds.south) * ratio;

		return {
			west: centerLon - spanLon / 2,
			east: centerLon + spanLon / 2,
			south: centerLat - spanLat / 2,
			north: centerLat + spanLat / 2,
		};
	}

	private planVisibleTiles(zoom: number, bounds: GeoBounds, now: number) {
		const minTile = lonLatToTile(bounds.west, bounds.north, zoom);
		const maxTile = lonLatToTile(bounds.east, bounds.south, zoom);
		const nextActiveKeys = new Set<string>();
		const nextQueue: PendingTile[] = [];

		for (let x = minTile.x; x <= maxTile.x; x++) {
			for (let y = minTile.y; y <= maxTile.y; y++) {
				const key = `${zoom}/${x}/${y}`;
				nextActiveKeys.add(key);

				if (this.tiles.has(key)) {
					const record = this.tiles.get(key)!;
					record.lastUsed = now;
					this.pendingRemoval.delete(key);
				} else {
					nextQueue.push({ zoom, x, y, key });
				}
			}
		}

		const removalBounds = expandBounds(bounds, REMOVAL_HALO_TILES, zoom);
		const staleZoomKeys: string[] = [];

		for (const key of this.tiles.keys()) {
			if (nextActiveKeys.has(key)) continue;

			const record = this.tiles.get(key)!;
			const parsed = parseTileKey(key);
			if (!parsed) continue;

			if (parsed.zoom !== zoom) {
				staleZoomKeys.push(key);
				continue;
			}

			if (isTileInRange(parsed.zoom, parsed.x, parsed.y, removalBounds)) {
				record.lastUsed = now;
				this.pendingRemoval.delete(key);
				continue;
			}

			if (!this.pendingRemoval.has(key)) {
				this.pendingRemoval.set(key, now + TILE_REMOVAL_DELAY_MS);
			}
		}

		for (const key of staleZoomKeys) {
			const record = this.tiles.get(key);
			if (record) this.removeTile(key, record);
		}

		this.activeTileKeys = nextActiveKeys;
		this.pendingCreateQueue = nextQueue;
		this.evictInactiveTiles();
	}

	private processCreateQueue(): boolean {
		if (this.pendingCreateQueue.length === 0) return false;

		let created = 0;
		while (this.pendingCreateQueue.length > 0 && created < MAX_CREATE_PER_FRAME) {
			const pending = this.pendingCreateQueue.shift();
			if (!pending || this.tiles.has(pending.key)) continue;

			this.createTile(pending.zoom, pending.x, pending.y, pending.key);
			created++;
		}

		return created > 0;
	}

	private flushPendingRemovals(now: number): boolean {
		let removed = false;

		for (const [key, removeAt] of this.pendingRemoval) {
			if (removeAt > now) continue;
			if (this.activeTileKeys.has(key)) {
				this.pendingRemoval.delete(key);
				continue;
			}

			const record = this.tiles.get(key);
			if (record) {
				this.removeTile(key, record);
				removed = true;
			}
			this.pendingRemoval.delete(key);
		}

		return removed;
	}

	private createTile(z: number, x: number, y: number, key: string) {
		const tileBounds = tileToLonLatBounds(x, y, z);
		const sw = lonLatToMercatorMeters(tileBounds.west, tileBounds.south);
		const ne = lonLatToMercatorMeters(tileBounds.east, tileBounds.north);

		const sizeX = ne.x - sw.x;
		const sizeY = ne.y - sw.y;
		const centerX = (sw.x + ne.x) / 2 - this.originMercator.x;
		const centerY = (sw.y + ne.y) / 2 - this.originMercator.y;

		const geometry = new THREE.PlaneGeometry(sizeX, sizeY);
		geometry.rotateX(-Math.PI / 2);

		const material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: this.config.opacity < 1,
			opacity: this.config.opacity,
			depthWrite: false,
			depthTest: false,
		});

		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(centerX, 0, -centerY);
		mesh.ignore = true;
		mesh.userData.terrainPick = true;
		mesh.renderOrder = -1000;
		mesh.frustumCulled = false;
		mesh.visible = false;

		this.group.add(mesh);

		const record: TileRecord = {
			mesh,
			texture: null,
			key,
			zoom: z,
			lastUsed: performance.now(),
			loading: true,
		};
		this.tiles.set(key, record);

		const url = buildImageryTileUrl(
			this.config.provider as ImageryProviderId,
			z,
			x,
			y,
			{ url: this.config.url, token: this.config.token }
		);

		this.loader.load(
			url,
			texture => {
				if (!this.tiles.has(key)) {
					texture.dispose();
					return;
				}

				texture.colorSpace = THREE.SRGBColorSpace;
				texture.minFilter = THREE.LinearFilter;
				texture.magFilter = THREE.LinearFilter;
				record.texture = texture;
				record.loading = false;
				(material as THREE.MeshBasicMaterial).map = texture;
				material.needsUpdate = true;
				mesh.visible = record.zoom === this.currentZoom;
			},
			undefined,
			() => {
				record.loading = false;
				mesh.visible = record.zoom === this.currentZoom;
				(material as THREE.MeshBasicMaterial).color.setHex(0x334455);
			}
		);
	}

	private evictInactiveTiles() {
		if (this.tiles.size <= MAX_TILE_CACHE) return;

		const candidates = Array.from(this.tiles.entries())
			.filter(([key]) => !this.activeTileKeys.has(key))
			.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

		for (const [key, record] of candidates) {
			if (this.tiles.size <= MAX_TILE_CACHE) break;
			this.pendingRemoval.delete(key);
			this.removeTile(key, record);
		}
	}

	private removeTile(key: string, record: TileRecord) {
		this.group.remove(record.mesh);
		record.mesh.geometry.dispose();
		(record.mesh.material as THREE.Material).dispose();
		record.texture?.dispose();
		this.tiles.delete(key);
		this.pendingRemoval.delete(key);
	}

	private clearTiles() {
		this.pendingCreateQueue = [];

		for (const [key, record] of this.tiles) {
			this.removeTile(key, record);
		}
		this.activeTileKeys.clear();
		this.pendingRemoval.clear();
		this.currentZoom = -1;
		this.lastTileRangeKey = "";
	}

	getPickTargets(): THREE.Object3D[] {
		return Array.from(this.tiles.values())
			.filter(r => r.mesh.visible)
			.map(r => r.mesh);
	}

	dispose() {
		this.clearTiles();
		this.group.clear();
	}
}
