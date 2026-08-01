import * as THREE from "three";
import { buildImageryTileUrl, isGcj02ImageryUrl, type ImageryProviderId } from "@/utils/geo/ImageryProviders";
import {
	gcj02ToWgs84,
	wgs84ToGcj02,
	lonLatToMercatorMeters,
	lonLatToTile,
	setEnuOrigin,
	tileToLonLatBounds,
	expandBounds,
	getStableViewBounds,
	enuToWgs84,
	wgs84ToEnu,
	getTileSizeMeters,
	resolveImageryZoom,
	getTileRangeKey,
	parseTileKey,
	isTileInRange,
	intersectBounds,
	type Wgs84Coord,
	type GeoBounds,
} from "@/utils/geo/GeoUtils";

/** 瓦片缓存上限：超出后按 LRU 淘汰非激活瓦片 */
const MAX_TILE_CACHE = 512;
/** 单次规划允许的最大激活瓦片数，防止视域过大时请求爆炸 */
const MAX_ACTIVE_TILES = 320;
/** 每帧最多新建瓦片数，摊平创建与纹理请求峰值 */
const MAX_CREATE_PER_FRAME = 24;
/** 离开视域后延迟移除时间（毫秒），减少来回平移时的闪烁 */
const TILE_REMOVAL_DELAY_MS = 8000;
/** 延迟移除的外围缓冲（瓦片数），缓冲带内暂不进入删除队列 */
const REMOVAL_HALO_TILES = 3;

/** 单个已创建（或创建中）瓦片的运行时记录 */
interface TileRecord {
	x: number;
	y: number;
	mesh: THREE.Mesh;
	texture: THREE.Texture | null;
	/** 格式：`{zoom}/{x}/{y}` */
	key: string;
	zoom: number;
	/** 最近被视域使用的时间戳，用于 LRU 淘汰 */
	lastUsed: number;
	loading: boolean;
}

/** 待创建瓦片队列项 */
interface PendingTile {
	zoom: number;
	x: number;
	y: number;
	key: string;
}

/**
 * 影像层每帧更新时的相机上下文。
 * 由 Terrain 模块传入，避免 ImageryLayer 直接依赖 CameraControls。
 */
export interface ImageryUpdateContext {
	/** 相机到环视目标点的距离（米），用于推算 zoom */
	viewDistance: number;
	/** 相机环视目标点（ENU） */
	target: THREE.Vector3;
}

/**
 * 深拷贝影像配置，避免与 `App.project` 中对象共用引用，
 * 否则 UI 先改字段再调用 `updateConfig` 时会检测不到变更。
 */
function cloneImageryConfig(config: IAppProject.Terrain["imagery"]): IAppProject.Terrain["imagery"] {
	return {
		...config,
		bounds: { ...config.bounds },
	};
}

/**
 * 影像瓦片图层：按 OSM/XYZ 规范加载二维地图瓦片，铺到 ENU 地平面上。
 *
 * 职责概览：
 * 1. 根据固定范围 / 相机视域计算加载 bounds 与 zoom；
 * 2. 规划可见瓦片、分帧创建 mesh 并异步拉纹理；
 * 3. 延迟移除离开视域的瓦片，并用 LRU 控制缓存上限；
 * 4. 提供拾取目标与相机 far 估算，供 Terrain 模块使用。
 */
export class ImageryLayer {
	/** 所有瓦片 mesh 的根节点，挂到场景后统一管理 */
	public readonly group = new THREE.Group();
	/** key → 瓦片记录 */
	private tiles = new Map<string, TileRecord>();
	/** 当前视域内应保持的瓦片 key 集合 */
	private activeTileKeys = new Set<string>();
	/** 待延迟删除：key → 到期时间戳 */
	private pendingRemoval = new Map<string, number>();
	/** 待创建队列，由 `processCreateQueue` 分帧消化 */
	private pendingCreateQueue: PendingTile[] = [];
	/** 地形原点的墨卡托坐标，用于把瓦片中心换算到 ENU */
	private originMercator = { x: 0, y: 0 };
	private config: IAppProject.Terrain["imagery"];
	private loader = new THREE.TextureLoader();
	/** 当前展示层级；`-1` 表示尚未确定 */
	private currentZoom = -1;
	/** 上次规划时的 tile 范围指纹，用于跳过无变化帧 */
	private lastTileRangeKey = "";
	/** 异步纹理加载完成后标记，供下一帧触发渲染 */
	private dirty = false;
	private origin: Wgs84Coord;
	/** 当前瓦片源是否为 GCJ-02 坐标系（高德/腾讯），需要做加偏纠正 */
	private gcj02 = false;

	/**
	 * @param origin 地形 ENU 原点（WGS84）
	 * @param config 影像配置快照（内部会拷贝一份）
	 */
	constructor(origin: Wgs84Coord, config: IAppProject.Terrain["imagery"]) {
		this.config = cloneImageryConfig(config);
		this.gcj02 = isGcj02ImageryUrl(config.url);
		this.group.name = "ImageryLayer";
		this.group.ignore = true;
		this.group.frustumCulled = false;
		setEnuOrigin(origin);
		this.origin = origin;
		this.originMercator = lonLatToMercatorMeters(origin.longitude, origin.latitude);
	}

	/**
	 * 应用最新影像配置。
	 *
	 * - provider / url / token / bounds 变化：清空全部瓦片并重建；
	 * - lockLevel、fixedBounds、zoom 区间、padding 变化：同样清空后重规划；
	 * - 仅 opacity 变化：就地更新材质，不重建几何。
	 *
	 * @param origin 当前地形原点
	 * @param config 来自项目配置的影像段
	 */
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

		const opacityChanged = this.config.opacity !== config.opacity;

		this.config = cloneImageryConfig(config);
		this.gcj02 = isGcj02ImageryUrl(config.url);
		setEnuOrigin(origin);
		this.origin = origin;
		this.originMercator = lonLatToMercatorMeters(origin.longitude, origin.latitude);

		if (needsFullReset || needsTileRefresh) {
			this.clearTiles();
			this.dirty = true;
			return;
		}

		if (opacityChanged) {
			this.applyOpacityToTiles();
			this.dirty = true;
		}

		// 强制下一帧重新规划可见瓦片
		this.pendingCreateQueue = [];
		this.lastTileRangeKey = "";
		this.dirty = true;
	}

	/**
	 * 每帧更新入口：规划视域瓦片、创建、显隐同步与延迟删除。
	 *
	 * @returns 是否需要触发一次场景渲染（有新建/显隐/删除/异步贴图完成）
	 */
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
		let needRender = this.dirty;
		this.dirty = false;

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

	/**
	 * 当前正在展示的影像 Level（zoom）。
	 * 未开始加载时返回 `-1`。
	 */
	getCurrentLevel(): number {
		return this.currentZoom;
	}

	/**
	 * 根据当前加载范围估算相机 `far`。
	 * 大 Level / 大范围瓦片若仍用默认约 100km 远平面，会被裁切成空白。
	 *
	 * @returns 建议的 far 值（米），已含 1.25 安全系数
	 */
	getRequiredCameraFar(camera: THREE.Camera, origin: Wgs84Coord, context?: ImageryUpdateContext): number {
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

	/**
	 * 计算本帧应加载的 zoom 与地理范围。
	 *
	 * 策略：
	 * - `lockLevel`：使用配置的 `lockedLevel`，加载配置 bounds；
	 * - 否则按视距做带滞回的 zoom 切换（`resolveImageryZoom`）；
	 * - 动态模式按相机稳定视域加载；若开启 `fixedBounds`，再与配置 bounds 求交，
	 *   **不再**用整片固定范围压低 zoom（否则近景永远只能铺低清大瓦片）。
	 */
	private computeLoadPlan(camera: THREE.Camera, origin: Wgs84Coord, context?: ImageryUpdateContext): { zoom: number; loadBounds: GeoBounds } {
		const { bounds, minZoom, maxZoom, lockLevel, lockedLevel, tilePadding, fixedBounds } = this.config;
		const viewDistance = context?.viewDistance ?? camera.position.length();
		const target = context?.target;

		let zoom: number;
		if (lockLevel) {
			zoom = Math.max(minZoom, Math.min(maxZoom, lockedLevel));
		} else {
			zoom = resolveImageryZoom(this.currentZoom, viewDistance, minZoom, maxZoom);
		}

		let loadBounds: GeoBounds;
		if (lockLevel) {
			loadBounds = { ...bounds } as GeoBounds;
		} else if (target) {
			loadBounds = getStableViewBounds(camera, target, origin, viewDistance, zoom);
			if (fixedBounds) {
				const clipped = intersectBounds(loadBounds, bounds as GeoBounds);
				if (clipped) {
					loadBounds = clipped;
				} else {
					const lon = (bounds.west + bounds.east) / 2;
					const lat = (bounds.south + bounds.north) / 2;
					loadBounds = { west: lon, east: lon, south: lat, north: lat };
				}
			}
		} else {
			loadBounds = { ...bounds } as GeoBounds;
		}

		const clampCenter =
			lockLevel || (fixedBounds && !target)
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
		loadBounds = this.clampBoundsTileCount(loadBounds, zoom, MAX_ACTIVE_TILES, clampCenter.longitude, clampCenter.latitude);

		return { zoom, loadBounds };
	}

	/**
	 * 视域未变化时刷新激活瓦片的 `lastUsed`，并取消其延迟删除。
	 */
	private touchActiveTiles(now: number) {
		for (const key of this.activeTileKeys) {
			const record = this.tiles.get(key);
			if (!record) continue;
			record.lastUsed = now;
			this.pendingRemoval.delete(key);
		}
	}

	/**
	 * 切换 zoom 时立即清除其他层级的瓦片与待创建项，避免多 Level 叠绘闪烁。
	 */
	private purgeTilesAtOtherZoom(zoom: number) {
		for (const [key, record] of this.tiles) {
			if (record.zoom !== zoom) {
				this.removeTile(key, record);
			}
		}
		this.pendingCreateQueue = this.pendingCreateQueue.filter(p => p.zoom === zoom);
	}

	/**
	 * 同步 mesh 可见性：仅当前 zoom、且纹理已加载完成的瓦片显示。
	 *
	 * @returns 是否有可见性变更（需要渲染）
	 */
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

	/**
	 * WGS84 bounds → 瓦片源坐标系 bounds。
	 * GCJ-02 源（高德/腾讯）做正向加偏，其余源原样返回。
	 * 所有「经纬度 → 瓦片索引」的换算都必须先经过这里，
	 * 否则选出的瓦片会相对场景（WGS84）偏移约 100~700 米。
	 */
	private toTileDatumBounds(bounds: GeoBounds): GeoBounds {
		if (!this.gcj02) return bounds;

		const sw = wgs84ToGcj02(bounds.west, bounds.south);
		const ne = wgs84ToGcj02(bounds.east, bounds.north);
		return { west: sw.lon, south: sw.lat, east: ne.lon, north: ne.lat };
	}

	/**
	 * 若 bounds 对应瓦片数超过 `maxTiles`，以中心点等比缩小范围。
	 * 用于兜底保护，避免极端视距下一次请求过多瓦片。
	 */
	private clampBoundsTileCount(bounds: GeoBounds, zoom: number, maxTiles: number, centerLon: number, centerLat: number): GeoBounds {
		const tileDatumBounds = this.toTileDatumBounds(bounds);
		const minTile = lonLatToTile(tileDatumBounds.west, tileDatumBounds.north, zoom);
		const maxTile = lonLatToTile(tileDatumBounds.east, tileDatumBounds.south, zoom);
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

	/**
	 * 根据 loadBounds 规划本帧激活瓦片集合：
	 * - 已存在的标记为活跃并取消删除；
	 * - 缺失的推入创建队列；
	 * - 离开视域但仍在 halo 缓冲带内的保留；
	 * - 缓冲带外的进入延迟删除；
	 * - 错误 zoom 的立即删除；最后做 LRU 淘汰。
	 */
	private planVisibleTiles(zoom: number, bounds: GeoBounds, now: number) {
		// 换算到瓦片源坐标系（GCJ-02 源需加偏），保证选出的瓦片覆盖场景中的 WGS84 范围
		const tileDatumBounds = this.toTileDatumBounds(bounds);
		const minTile = lonLatToTile(tileDatumBounds.west, tileDatumBounds.north, zoom);
		const maxTile = lonLatToTile(tileDatumBounds.east, tileDatumBounds.south, zoom);
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

		const removalBounds = expandBounds(tileDatumBounds, REMOVAL_HALO_TILES, zoom);
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

			// 外围缓冲带：先留着，避免来回轻微平移时频繁销毁/重建
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

	/**
	 * 分帧创建待建瓦片，限制每帧创建数量以稳住帧率。
	 *
	 * @returns 本帧是否创建了新瓦片
	 */
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

	/**
	 * 执行到期的延迟删除；若瓦片已重新变为激活则取消删除。
	 *
	 * @returns 本帧是否实际移除了瓦片
	 */
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

	/**
	 * 创建单张瓦片 mesh，并异步加载纹理。
	 *
	 * 几何：墨卡托范围转平面尺寸，绕 X 放平到 XZ 地平面；
	 * 位置：相对地形原点的 ENU（注意 Z 与墨卡托 Y 取反）；
	 * 材质：关闭 depthTest/Write，保证贴地影像不被其它物体错误遮挡。
	 * 加载失败时用占位色块，避免整片空白难以排查。
	 */
	private createTile(z: number, x: number, y: number, key: string) {
		// 瓦片范围（瓦片源自身坐标系，GCJ-02 源即为加偏后的经纬度）
		const tileBounds = tileToLonLatBounds(x, y, z);
		const sw = lonLatToMercatorMeters(tileBounds.west, tileBounds.south);
		const ne = lonLatToMercatorMeters(tileBounds.east, tileBounds.north);

		const sizeX = ne.x - sw.x;
		const sizeY = ne.y - sw.y;

		// 瓦片中心换算回 WGS84 再定位：GCJ-02 源必须反向解偏，
		// 否则底图相对地理参考模型（3D Tiles、地理锚点）偏移约 100~700 米
		let centerLon = (tileBounds.west + tileBounds.east) / 2;
		let centerLat = (tileBounds.south + tileBounds.north) / 2;
		if (this.gcj02) {
			const wgs = gcj02ToWgs84(centerLon, centerLat);
			centerLon = wgs.lon;
			centerLat = wgs.lat;
		}
		const centerMercator = lonLatToMercatorMeters(centerLon, centerLat);
		// 瓦片中心相对原点的场景坐标
		const centerX = centerMercator.x - this.originMercator.x;
		const centerY = centerMercator.y - this.originMercator.y;

		const geometry = new THREE.PlaneGeometry(sizeX, sizeY);
		// 绕 X 轴旋转 90 度，将瓦片平铺到 XZ 地平面
		geometry.rotateX(-Math.PI / 2);

		const material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: this.config.opacity < 1,
			opacity: this.config.opacity,
			// 关闭深度写入和深度测试，保证贴地影像不被其它物体错误遮挡
			depthWrite: false,
			depthTest: false,
		});

		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(centerX, 0, -centerY);
		// 忽略碰撞检测
		mesh.ignore = true;
		mesh.userData.terrainPick = true;
		mesh.renderOrder = -1000;
		// 不进行视锥裁剪，避免因相机远近导致瓦片可见性异常
		mesh.frustumCulled = false;
		// 初始不可见
		mesh.visible = false;

		this.group.add(mesh);

		const record: TileRecord = {
			mesh,
			texture: null,
			x,
			y,
			key,
			zoom: z,
			lastUsed: performance.now(),
			loading: true,
		};
		this.tiles.set(key, record);

		const url = buildImageryTileUrl(this.config.provider as ImageryProviderId, z, x, y, { url: this.config.url, token: this.config.token });

		this.loader.load(
			url,
			texture => {
				// 加载完成前瓦片可能已被清除（切换 provider / zoom）
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
				this.dirty = true;
			},
			undefined,
			() => {
				record.loading = false;
				mesh.visible = record.zoom === this.currentZoom;
				(material as THREE.MeshBasicMaterial).color.setHex(0x334455);
				this.dirty = true;
			}
		);
	}

	/**
	 * 将当前配置的透明度应用到所有已存在瓦片材质（不重建几何）。
	 */
	private applyOpacityToTiles() {
		for (const record of this.tiles.values()) {
			const material = record.mesh.material as THREE.MeshBasicMaterial;
			material.transparent = this.config.opacity < 1;
			material.opacity = this.config.opacity;
			material.needsUpdate = true;
		}
	}

	/**
	 * LRU 淘汰：缓存超过上限时，优先删除最久未使用的非激活瓦片。
	 */
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

	/**
	 * 从场景移除瓦片并释放 geometry / material / texture。
	 */
	private removeTile(key: string, record: TileRecord) {
		this.group.remove(record.mesh);
		record.mesh.geometry.dispose();
		(record.mesh.material as THREE.Material).dispose();
		record.texture?.dispose();
		this.tiles.delete(key);
		this.pendingRemoval.delete(key);
	}

	/**
	 * 清空全部瓦片与规划状态，通常在切换数据源或强制重建时调用。
	 */
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

	/**
	 * 返回当前可见瓦片 mesh，供地形高度拾取等射线检测使用。
	 */
	getPickTargets(x?: number, z?: number): THREE.Object3D[] {
		return Array.from(this.tiles.values())
			.filter(r => r.mesh.visible && (x === undefined || z === undefined || this.isPointInTile([x, z], r)))
			.map(r => r.mesh);
	}

	/**
	 * 销毁图层：释放全部瓦片资源并清空 group。
	 */
	dispose() {
		this.clearTiles();
		this.group.clear();
	}
	isPointInTile(point: [number, number], record: TileRecord): boolean {
		const enu = new THREE.Vector3(point[0], 0, point[1]);
		const wgs84 = enuToWgs84(enu, this.origin);
		// 瓦片 bounds 在瓦片源坐标系下，GCJ-02 源需把场景点加偏后再比较
		let lon = wgs84.longitude;
		let lat = wgs84.latitude;
		if (this.gcj02) {
			const gcj = wgs84ToGcj02(lon, lat);
			lon = gcj.lon;
			lat = gcj.lat;
		}
		const tileBounds = tileToLonLatBounds(record.x, record.y, record.zoom);
		return lon >= tileBounds.west && lon <= tileBounds.east && lat >= tileBounds.south && lat <= tileBounds.north;
	}
}
