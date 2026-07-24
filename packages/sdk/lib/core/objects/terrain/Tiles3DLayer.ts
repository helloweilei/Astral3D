import * as THREE from "three";
import { TilesRenderer } from "3d-tiles-renderer";
import { getEnuMatrix, setEnuOrigin, type Wgs84Coord } from "@/utils/geo/GeoUtils";
import type Viewer from "@/core/viewer/Viewer";

export type Tiles3DLoadState = "idle" | "loading" | "loaded" | "error";

export class Tiles3DLayer {
	public readonly group = new THREE.Group();
	private tilesRenderer: TilesRenderer | null = null;
	private viewer: Viewer;
	private origin: Wgs84Coord;
	private config: IAppProject.Terrain["tiles3d"];
	public loadState: Tiles3DLoadState = "idle";
	public errorMessage = "";

	constructor(viewer: Viewer, origin: Wgs84Coord, config: IAppProject.Terrain["tiles3d"]) {
		this.viewer = viewer;
		this.origin = origin;
		this.config = config;
		this.group.name = "Tiles3DLayer";
		this.group.ignore = true;
	}

	updateConfig(origin: Wgs84Coord, config: IAppProject.Terrain["tiles3d"]) {
		const urlChanged = this.config.url !== config.url;
		this.origin = origin;
		this.config = config;

		if (urlChanged || !this.tilesRenderer) {
			this.disposeRenderer();
			if (config.enabled && config.url) {
				this.createRenderer();
			}
		} else {
			this.applyTransform();
			if (this.tilesRenderer) {
				this.tilesRenderer.errorTarget = config.maximumScreenSpaceError;
			}
		}
	}

	private createRenderer() {
		if (!this.config.url) return;

		this.loadState = "loading";
		this.errorMessage = "";

		try {
			const renderer = new TilesRenderer(this.config.url);
			renderer.setCamera(this.viewer.camera);
			renderer.setResolutionFromRenderer(this.viewer.camera, this.viewer.renderer);
			renderer.errorTarget = this.config.maximumScreenSpaceError;

			renderer.addEventListener("load-tileset", () => {
				this.loadState = "loaded";
				this.applyTransform();
			});

			renderer.addEventListener("load-model", ({ scene }: { scene: THREE.Object3D }) => {
				scene.traverse(child => {
					(child as any).ignore = true;
					child.userData.terrainPick = true;
				});
			});

			renderer.addEventListener("load-error", ({ error }: { error: Error }) => {
				this.loadState = "error";
				this.errorMessage = error?.message || "Failed to load 3D Tiles";
			});

			this.tilesRenderer = renderer;
			this.group.add(renderer.group);
			renderer.group.ignore = true;
		} catch (e) {
			this.loadState = "error";
			this.errorMessage = e instanceof Error ? e.message : "Failed to initialize 3D Tiles";
		}
	}

	private applyTransform() {
		if (!this.tilesRenderer) return;

		setEnuOrigin(this.origin);
		const enuMatrix = getEnuMatrix(this.origin);
		const offset = this.config.offset;
		const rotation = this.config.rotation;
		const scale = this.config.scale;

		const localMatrix = new THREE.Matrix4();
		const pos = new THREE.Vector3(offset.x, offset.y, offset.z);
		const rot = new THREE.Euler(
			THREE.MathUtils.degToRad(rotation.x),
			THREE.MathUtils.degToRad(rotation.y),
			THREE.MathUtils.degToRad(rotation.z),
			"XYZ"
		);
		const quat = new THREE.Quaternion().setFromEuler(rot);
		const scl = new THREE.Vector3(scale, scale, scale);
		localMatrix.compose(pos, quat, scl);

		this.tilesRenderer.group.matrix.copy(enuMatrix).multiply(localMatrix);
		this.tilesRenderer.group.matrixAutoUpdate = false;
		this.tilesRenderer.group.matrixWorldNeedsUpdate = true;
		this.tilesRenderer.group.updateMatrixWorld(true);
	}

	update() {
		if (!this.tilesRenderer || !this.config.enabled) return false;

		this.tilesRenderer.setCamera(this.viewer.camera);
		this.tilesRenderer.setResolutionFromRenderer(this.viewer.camera, this.viewer.renderer);
		this.tilesRenderer.errorTarget = this.config.maximumScreenSpaceError;
		this.viewer.camera.updateMatrixWorld();
		this.tilesRenderer.update();
		return true;
	}

	getPickTargets(): THREE.Object3D[] {
		if (!this.tilesRenderer) return [];
		const targets: THREE.Object3D[] = [];
		this.tilesRenderer.group.traverse(child => {
			if ((child as THREE.Mesh).isMesh) {
				targets.push(child);
			}
		});
		return targets;
	}

	private disposeRenderer() {
		if (this.tilesRenderer) {
			this.group.remove(this.tilesRenderer.group);
			this.tilesRenderer.dispose();
			this.tilesRenderer = null;
		}
		this.loadState = "idle";
		this.errorMessage = "";
	}

	dispose() {
		this.disposeRenderer();
		this.group.clear();
	}
}
