import * as THREE from "three";
import { useAddSignal, useRemoveSignal } from "@/hooks";
import App from "@/core/app/App";
import Viewer from "../Viewer";
import { ImageryLayer } from "@/core/objects/terrain/ImageryLayer";
import { Tiles3DLayer } from "@/core/objects/terrain/Tiles3DLayer";
import { enuToWgs84, getGroundBoundsFromCamera, setEnuOrigin, wgs84ToEnu, type Wgs84Coord } from "@/utils/geo/GeoUtils";

let _terrainSettingsChangedFn: (() => void) | null = null;

/** 启用地形时禁止相机绕到地平面下方（球坐标极角上限） */
const TERRAIN_MAX_POLAR_ANGLE = Math.PI / 2;
/** 相机相对地表的最小高度（米） */
const TERRAIN_MIN_CAMERA_CLEARANCE = 1;

export class Terrain {
	private viewer: Viewer;
	private imageryLayer: ImageryLayer | null = null;
	private tiles3DLayer: Tiles3DLayer | null = null;
	private savedMaxPolarAngle: number | null = null;
	private readonly _clampTarget = new THREE.Vector3();

	constructor(viewer: Viewer) {
		this.viewer = viewer;

		_terrainSettingsChangedFn = this.applySettings.bind(this);
		useAddSignal("sceneTerrainSettingsChanged", _terrainSettingsChangedFn);
	}

	init() {
		this.applySettings();
	}

	private getTerrainConfig(): IAppProject.Terrain {
		return App.project.getKey("terrain");
	}

	private getOrigin(): Wgs84Coord {
		const origin = this.getTerrainConfig().origin;
		return {
			longitude: origin.longitude,
			latitude: origin.latitude,
			height: origin.height,
		};
	}

	applySettings() {
		const config = this.getTerrainConfig();
		setEnuOrigin(this.getOrigin());

		if (!config.enabled) {
			this.disableTerrain();
			this.requestRender();
			return;
		}

		this.enableTerrain(config);
		this.updateGeoAnchoredObjects();
		this.requestRender();
	}

	private requestRender() {
		if (this.viewer.modules?.effect) {
			this.viewer.render();
		}
	}

	/**
	 * 地形是否要求隐藏场景地面。
	 *
	 * 地面（网格线或贴图平面）会遮挡贴地的影像瓦片——瓦片关闭了深度写入且
	 * renderOrder 极小，先于地面绘制，之后任何带深度写入的地面都会把它盖掉。
	 * `Viewer.initGrid()` 重建地面时需要据此决定可见性。
	 */
	isGroundHidden(): boolean {
		const config = this.getTerrainConfig();
		return config.enabled && config.hideGrid;
	}

	/** 按地形配置与地面开关同步地面可见性 */
	private syncGroundVisible() {
		if (!this.viewer.grid) return;
		this.viewer.grid.visible = this.viewer.options.grid.enabled && !this.isGroundHidden();
	}

	private enableTerrain(config: IAppProject.Terrain) {
		this.syncGroundVisible();

		this.applyTerrainCameraLimit();

		const origin = this.getOrigin();
		let imageryJustEnabled = false;

		if (config.imagery.enabled) {
			if (!this.imageryLayer) {
				this.imageryLayer = new ImageryLayer(origin, config.imagery);
				this.viewer.scene.add(this.imageryLayer.group);
				imageryJustEnabled = true;
			} else {
				this.imageryLayer.updateConfig(origin, config.imagery);
			}
			this.ensureCameraFarForImagery();
			if (imageryJustEnabled) {
				this.flyToRegion();
			}
			// 配置变更后立即规划瓦片，避免等相机再动才加载
			this.refreshImageryNow();
		} else if (this.imageryLayer) {
			this.viewer.scene.remove(this.imageryLayer.group);
			this.imageryLayer.dispose();
			this.imageryLayer = null;
		}

		if (config.tiles3d.enabled && config.tiles3d.url) {
			if (!this.tiles3DLayer) {
				this.tiles3DLayer = new Tiles3DLayer(this.viewer, origin, config.tiles3d);
				this.viewer.scene.add(this.tiles3DLayer.group);
			} else {
				this.tiles3DLayer.updateConfig(origin, config.tiles3d);
			}
		} else if (this.tiles3DLayer) {
			this.viewer.scene.remove(this.tiles3DLayer.group);
			this.tiles3DLayer.dispose();
			this.tiles3DLayer = null;
		}
	}

	private disableTerrain() {
		if (this.imageryLayer) {
			this.viewer.scene.remove(this.imageryLayer.group);
			this.imageryLayer.dispose();
			this.imageryLayer = null;
		}

		if (this.tiles3DLayer) {
			this.viewer.scene.remove(this.tiles3DLayer.group);
			this.tiles3DLayer.dispose();
			this.tiles3DLayer = null;
		}

		this.syncGroundVisible();

		this.clearTerrainCameraLimit();
	}

	/**
	 * 限制极角，避免环视到地平面下方。
	 */
	private applyTerrainCameraLimit() {
		const controls = this.viewer.modules?.controls;
		if (!controls) return;

		if (this.savedMaxPolarAngle === null) {
			this.savedMaxPolarAngle = controls.maxPolarAngle;
		}
		controls.maxPolarAngle = TERRAIN_MAX_POLAR_ANGLE;
		if (controls.polarAngle > TERRAIN_MAX_POLAR_ANGLE) {
			controls.rotatePolarTo(TERRAIN_MAX_POLAR_ANGLE, false);
		}
	}

	private clearTerrainCameraLimit() {
		const controls = this.viewer.modules?.controls;
		if (!controls) return;

		if (this.savedMaxPolarAngle !== null) {
			controls.maxPolarAngle = this.savedMaxPolarAngle;
			this.savedMaxPolarAngle = null;
		} else {
			controls.maxPolarAngle = this.viewer.options.control.maxPolarAngle ?? Math.PI;
		}
	}

	/**
	 * 钳制相机与目标点高度，禁止落到地图平面下方。
	 */
	private clampCameraAboveTerrain(): boolean {
		const controls = this.viewer.modules?.controls;
		if (!controls) return false;

		// 防止导航模式切换等逻辑把极角上限改回去
		if (controls.maxPolarAngle > TERRAIN_MAX_POLAR_ANGLE) {
			controls.maxPolarAngle = TERRAIN_MAX_POLAR_ANGLE;
		}

		const camera = this.viewer.camera;
		controls.getTarget(this._clampTarget);

		let nextCamY = camera.position.y;
		let nextTargetY = this._clampTarget.y;
		let changed = false;

		if (controls.polarAngle > TERRAIN_MAX_POLAR_ANGLE + 1e-4) {
			controls.rotatePolarTo(TERRAIN_MAX_POLAR_ANGLE, false);
			changed = true;
		}

		// 仅在明显穿地时钳制，避免平移时每帧 setLookAt 与控制器打架导致缩放卡顿
		if (nextCamY < TERRAIN_MIN_CAMERA_CLEARANCE - 1e-3) {
			nextCamY = TERRAIN_MIN_CAMERA_CLEARANCE;
			changed = true;
		}
		if (nextTargetY < -1e-3) {
			nextTargetY = 0;
			changed = true;
		}

		if (!changed) return false;

		controls.setLookAt(camera.position.x, nextCamY, camera.position.z, this._clampTarget.x, nextTargetY, this._clampTarget.z, false);
		return true;
	}

	updateGeoAnchoredObjects() {
		const origin = this.getOrigin();
		setEnuOrigin(origin);

		this.viewer.scene.traverse(obj => {
			const geoAnchor = obj.userData?.geoAnchor as Wgs84Coord | undefined;
			if (!geoAnchor) return;

			const enu = wgs84ToEnu(
				{
					longitude: geoAnchor.longitude,
					latitude: geoAnchor.latitude,
					height: geoAnchor.height ?? 0,
				},
				origin
			);
			obj.position.set(enu.x, enu.y, enu.z);
		});
	}

	private ensureCameraFarForImagery(): boolean {
		if (!this.imageryLayer) return false;

		const origin = this.getOrigin();
		const target = new THREE.Vector3();
		this.viewer.modules.controls.getTarget(target);
		const viewDistance = this.viewer.camera.position.distanceTo(target);
		const requiredFar = this.imageryLayer.getRequiredCameraFar(this.viewer.camera, origin, {
			viewDistance,
			target,
		});

		if (requiredFar <= this.viewer.camera.far) return false;

		this.viewer.camera.far = requiredFar;
		this.viewer.camera.updateProjectionMatrix();
		return true;
	}

	private refreshImageryNow() {
		if (!this.imageryLayer || !this.viewer.modules?.controls) return;

		const origin = this.getOrigin();
		const target = new THREE.Vector3();
		this.viewer.modules.controls.getTarget(target);
		const viewDistance = this.viewer.camera.position.distanceTo(target);
		this.imageryLayer.update(this.viewer.camera, origin, { viewDistance, target });
	}

	update(_delta: number): boolean {
		const config = this.getTerrainConfig();
		if (!config.enabled) return false;

		let needRender = this.clampCameraAboveTerrain();
		const origin = this.getOrigin();
		const target = new THREE.Vector3();
		this.viewer.modules.controls.getTarget(target);
		const viewDistance = this.viewer.camera.position.distanceTo(target);

		if (this.imageryLayer) {
			const imageryContext = { viewDistance, target };
			if (this.ensureCameraFarForImagery()) {
				needRender = true;
			}

			needRender = this.imageryLayer.update(this.viewer.camera, origin, imageryContext) || needRender;
		}

		if (this.tiles3DLayer) {
			needRender = this.tiles3DLayer.update() || needRender;
		}

		return needRender;
	}

	getCurrentImageryLevel(): number {
		return this.imageryLayer?.getCurrentLevel() ?? -1;
	}

	flyToRegion() {
		const config = this.getTerrainConfig();
		const { bounds } = config.imagery;
		const { origin } = config;
		const centerLon = (bounds.west + bounds.east) / 2;
		const centerLat = (bounds.south + bounds.north) / 2;
		const enu = wgs84ToEnu(
			{ longitude: centerLon, latitude: centerLat, height: 0 },
			{
				longitude: origin.longitude,
				latitude: origin.latitude,
				height: origin.height,
			}
		);

		const lonSpan = Math.abs(bounds.east - bounds.west);
		const latSpan = Math.abs(bounds.north - bounds.south);
		const distance = Math.max(lonSpan, latSpan) * 111320 * 1.5;

		const controls = this.viewer.modules.controls;
		controls.setLookAt(
			enu.x + distance * 0.6,
			distance, //distance * 0.5,
			enu.z + distance * 0.6,
			enu.x,
			enu.y,
			enu.z,
			true
		);
	}

	/**
	 * 根据当前相机视锥与地平面求交，估算影像加载边界（WGS84）。
	 * 四个 NDC 角点射线打到 Y=0 地面，再包络为目标点周围的 lon/lat 范围。
	 */
	estimateBoundsFromCamera(): IAppProject.Terrain["imagery"]["bounds"] {
		const target = new THREE.Vector3();
		this.viewer.modules.controls.getTarget(target);
		const origin = this.getOrigin();
		const bounds = getGroundBoundsFromCamera(this.viewer.camera, target, origin);

		if (bounds) {
			return {
				west: Number(bounds.west.toFixed(6)),
				south: Number(bounds.south.toFixed(6)),
				east: Number(bounds.east.toFixed(6)),
				north: Number(bounds.north.toFixed(6)),
			};
		}

		// 极端情况兜底：以目标点为中心，按视距推算跨度
		const wgs84 = enuToWgs84({ x: target.x, y: target.y, z: target.z }, origin);
		const viewDistance = this.viewer.camera.position.distanceTo(target);
		const span = Math.max(viewDistance, 100) / 111320;

		return {
			west: Number((wgs84.longitude - span).toFixed(6)),
			south: Number((wgs84.latitude - span).toFixed(6)),
			east: Number((wgs84.longitude + span).toFixed(6)),
			north: Number((wgs84.latitude + span).toFixed(6)),
		};
	}

	/**
	 * 返回当前可拾取的地形表面 mesh（影像瓦片 + 3D Tiles）。
	 * 这些对象通常带 `ignore`，不会进入 Viewer 默认选中射线，
	 * 测距等工具需单独向它们发射射线。
	 */
	getPickTargets(): THREE.Object3D[] {
		const targets: THREE.Object3D[] = [];
		if (this.imageryLayer) {
			targets.push(...this.imageryLayer.getPickTargets());
		}
		if (this.tiles3DLayer) {
			targets.push(...this.tiles3DLayer.getPickTargets());
		}
		return targets;
	}

	/**
	 * 在指定 ENU 水平位置拾取地形/影像表面高度（Y）。
	 *
	 * 实现方式：从 `(x, 10000, z)` 竖直向下发射射线，依次检测
	 * 影像瓦片（`ImageryLayer`）与 3D Tiles（`Tiles3DLayer`）的可拾取 mesh，
	 * 取最近交点的 `point.y` 作为表面高度。
	 *
	 * 典型用途：
	 * - 对象属性面板「拾取高度」：把选中物体放到地表；
	 * - 地理锚点等需要贴地的场景。
	 *
	 * @param x ENU 东向坐标（米）
	 * @param z ENU 北向取反后的场景 Z（与瓦片铺设坐标系一致）
	 * @returns
	 * - `null`：地形未启用，无法拾取；
	 * - `number`：命中表面时的 Y 高度；未命中任何 mesh 时返回 `0`（视为地平面）
	 */
	pickSurfaceHeight(x: number, z: number): number | null {
		const config = this.getTerrainConfig();
		if (!config.enabled) return null;

		const raycaster = new THREE.Raycaster();
		const origin = new THREE.Vector3(x, 10000, z);
		const direction = new THREE.Vector3(0, -1, 0);
		raycaster.set(origin, direction);

		const targets: THREE.Object3D[] = [];
		if (this.imageryLayer) {
			targets.push(...this.imageryLayer.getPickTargets(x, z));
		}
		if (this.tiles3DLayer) {
			targets.push(...this.tiles3DLayer.getPickTargets());
		}

		const hits = raycaster.intersectObjects(targets, true);
		if (hits.length > 0) {
			return hits[0].point.y;
		}

		return 0;
	}

	get tiles3dLoadState() {
		return this.tiles3DLayer?.loadState ?? "idle";
	}

	get tiles3dErrorMessage() {
		return this.tiles3DLayer?.errorMessage ?? "";
	}

	/**
	 * 获取当前 3D Tiles 瓦片集自身的地理锚点（WGS84）。
	 * 未加载或非地理参考的瓦片集返回 null。
	 * 供「同步地形原点」「定位」等 UI 操作读取。
	 */
	getTiles3DAnchor(): Wgs84Coord | null {
		return this.tiles3DLayer?.anchor ? { ...this.tiles3DLayer.anchor } : null;
	}

	/**
	 * 实测 3D Tiles 模型地表相对场景地平面（y=0）的高度。
	 * 供「贴地」操作使用；未加载或射线落空时返回 null。
	 */
	getTiles3DGroundOffsetY(): number | null {
		return this.tiles3DLayer?.getGroundOffsetY() ?? null;
	}

	/**
	 * 开启/关闭 3D Tiles 视口编辑（gizmo 拖拽整体调整）。
	 * 拖拽结束后通过 `tiles3dEditCommitted` 信号提交 偏移/旋转/缩放。
	 */
	setTiles3DEditEnabled(enabled: boolean) {
		this.tiles3DLayer?.setEditEnabled(enabled);
	}

	/**
	 * 3D Tiles 是否处于视口编辑状态。
	 * 用户点选其他物体夺走 gizmo 后返回 false，UI 可据此同步开关状态。
	 */
	isTiles3DEditActive(): boolean {
		return this.tiles3DLayer?.isEditActive() ?? false;
	}

	setObjectGeoAnchor(object: THREE.Object3D, anchor: Wgs84Coord | null) {
		if (anchor) {
			object.userData.geoAnchor = { ...anchor };
			const enu = wgs84ToEnu(anchor, this.getOrigin());
			object.position.set(enu.x, enu.y, enu.z);
		} else {
			delete object.userData.geoAnchor;
		}
	}

	dispose() {
		if (_terrainSettingsChangedFn) {
			useRemoveSignal("sceneTerrainSettingsChanged", _terrainSettingsChangedFn);
		}
		this.disableTerrain();
	}
}
