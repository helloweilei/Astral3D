import * as THREE from "three";
import { TilesRenderer } from "3d-tiles-renderer";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { ecefToWgs84, getEnuMatrix, setEnuOrigin, wgs84ToEnu, type Wgs84Coord } from "@/utils/geo/GeoUtils";
import { useAddSignal, useDispatchSignal, useRemoveSignal } from "@/hooks";
import Loader from "@/core/loader/Loader";
import App from "@/core/app/App";
import type Viewer from "@/core/viewer/Viewer";

const DEFAULT_OUTLINE = {
	enabled: false,
	color: "#00e5ff",
	width: 2,
} as const;

/** 贴地描边相对影像平面的抬升（米），避免与影像深度冲突 */
const OUTLINE_GROUND_Y = 0.5;

type FootprintPoint = { x: number; z: number };

/** 闭合折线 → LineSegmentsGeometry.setPositions 所需的成对顶点 */
function ringToLinePositions(ring: FootprintPoint[], y: number): Float32Array {
	const n = ring.length;
	const out = new Float32Array(n * 6);
	for (let i = 0; i < n; i++) {
		const a = ring[i];
		const b = ring[(i + 1) % n];
		const o = i * 6;
		out[o] = a.x;
		out[o + 1] = y;
		out[o + 2] = a.z;
		out[o + 3] = b.x;
		out[o + 4] = y;
		out[o + 5] = b.z;
	}
	return out;
}

/** XZ 平面凸包（Andrew 单调链），顶点按逆时针 */
function convexHullXZ(points: FootprintPoint[]): FootprintPoint[] {
	if (points.length <= 2) return points.slice();

	const sorted = points.slice().sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));

	const cross = (o: FootprintPoint, a: FootprintPoint, b: FootprintPoint) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);

	const lower: FootprintPoint[] = [];
	for (const p of sorted) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
			lower.pop();
		}
		lower.push(p);
	}

	const upper: FootprintPoint[] = [];
	for (let i = sorted.length - 1; i >= 0; i--) {
		const p = sorted[i];
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
			upper.pop();
		}
		upper.push(p);
	}

	lower.pop();
	upper.pop();
	return lower.concat(upper);
}

function footprintsEqual(a: FootprintPoint[], b: FootprintPoint[], eps = 0.05): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (Math.abs(a[i].x - b[i].x) > eps || Math.abs(a[i].z - b[i].z) > eps) return false;
	}
	return true;
}

export type Tiles3DLoadState = "idle" | "loading" | "loaded" | "error";

export class Tiles3DLayer {
	public readonly group = new THREE.Group();
	private tilesRenderer: TilesRenderer | null = null;
	private viewer: Viewer;
	private origin: Wgs84Coord;
	private config: IAppProject.Terrain["tiles3d"];
	public loadState: Tiles3DLoadState = "idle";
	public errorMessage = "";
	/**
	 * 瓦片集自身的地理锚点（WGS84），tileset 加载完成后从包围球中心解算。
	 * 非地理参考（本地坐标）的瓦片集为 null。
	 */
	public anchor: Wgs84Coord | null = null;

	/**
	 * 视口编辑代理对象：gizmo 附着其上，TRS 与「定位点 + 偏移/旋转/缩放」对应。
	 * 挂在 sceneHelpers 下，不参与场景序列化与拾取。
	 */
	private editHandle: THREE.Object3D | null = null;
	/** objectChanged 信号回调（绑定 this），编辑期间监听手柄变换 */
	private readonly onHandleChangedBound = this.onHandleChanged.bind(this);
	/** 编辑提交防抖计时器 */
	private commitTimer: ReturnType<typeof setTimeout> | null = null;
	/** 编辑会话是否开启（信号监听是否已挂上） */
	private editSessionActive = false;

	/** 3D Tiles 贴地足迹描边（屏幕像素线宽，场景世界坐标） */
	private outlineLines: LineSegments2 | null = null;
	private outlineMaterial: LineMaterial | null = null;
	private lastOutlineRing: FootprintPoint[] = [];
	private readonly outlineLocalBox = new THREE.Box3();
	private readonly outlineObbMatrix = new THREE.Matrix4();
	private readonly outlineCorner = new THREE.Vector3();
	private readonly outlineSphere = new THREE.Sphere();
	private readonly outlineSize = new THREE.Vector2();

	constructor(viewer: Viewer, origin: Wgs84Coord, config: IAppProject.Terrain["tiles3d"]) {
		this.viewer = viewer;
		this.origin = origin;
		this.config = config;
		this.group.name = "Tiles3DLayer";
		this.group.ignore = true;
	}

	/** 优先读项目实时配置，避免 UI 更新后本地 config 引用滞后 */
	private getOutlineConfig() {
		const live = App.project.getKey("terrain")?.tiles3d?.outline as IAppProject.Terrain["tiles3d"]["outline"] | undefined;
		const outline = live ?? this.config.outline;
		return {
			enabled: !!outline?.enabled,
			color: outline?.color ?? DEFAULT_OUTLINE.color,
			width: outline?.width ?? DEFAULT_OUTLINE.width,
		};
	}

	updateConfig(origin: Wgs84Coord, config: IAppProject.Terrain["tiles3d"]) {
		const urlChanged = this.config.url !== config.url;
		this.origin = origin;
		this.config = config;

		if (urlChanged || !this.tilesRenderer) {
			this.setEditEnabled(false);
			this.disposeRenderer();
			if (config.enabled && config.url) {
				this.createRenderer();
			}
		} else {
			this.applyTransform();
			// 编辑中的配置回写（或外部改数值）后同步手柄，保持 gizmo 与模型一致
			this.syncHandleFromConfig();
			if (this.tilesRenderer) {
				this.tilesRenderer.errorTarget = config.maximumScreenSpaceError;
			}
			this.syncOutline();
		}
	}

	private createRenderer() {
		if (!this.config.url) return;

		this.loadState = "loading";
		this.errorMessage = "";

		try {
			const renderer = new TilesRenderer(this.config.url);

			// b3dm/i3dm 内嵌的 glTF 可能启用 Draco/KTX2 压缩（如大雁塔倾斜摄影），
			// TilesRenderer 默认的 GLTFLoader 不带解码器，会报
			// "No DRACOLoader instance provided"。这里复用全局 Loader 的解码器，
			// 解码器 wasm 随 SDK 的 libs/draco、libs/basis 分发。
			const gltfLoader = new GLTFLoader(renderer.manager);
			gltfLoader.setDRACOLoader(Loader.dracoLoader);
			gltfLoader.setKTX2Loader(Loader.ktx2Loader);
			renderer.manager.addHandler(/\.(gltf|glb)$/, gltfLoader);
			// pnts 点云的 Draco 压缩由内部按 "draco.drc" 查找原始解码器
			renderer.manager.addHandler(/\.drc$/, Loader.dracoLoader);

			renderer.setCamera(this.viewer.camera);
			renderer.setResolutionFromRenderer(this.viewer.camera, this.viewer.renderer);
			renderer.errorTarget = this.config.maximumScreenSpaceError;

			renderer.addEventListener("load-tileset", () => {
				this.loadState = "loaded";
				this.anchor = this.resolveAnchor();
				this.applyTransform();
				this.syncOutline();
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

	/** 地心距离小于该值（1000km）视为本地坐标而非 ECEF */
	private static readonly MIN_GEOREFERENCED_ECEF_LENGTH = 1_000_000;

	/**
	 * 解算瓦片集自身的地理锚点。
	 *
	 * 水平位置优先用包围球中心（更接近模型视觉重心，利于与影像贴合）；
	 * 高度优先用根节点 transform 平移（通常在模型底部，便于「定位高度」）。
	 * 两者都不具备 ECEF 量级时视为本地坐标瓦片集，返回 null。
	 */
	private resolveAnchor(): Wgs84Coord | null {
		if (!this.tilesRenderer) return null;

		const rootTransform = (this.tilesRenderer as any).root?.engineData?.transform as THREE.Matrix4 | undefined;
		let transformWgs: Wgs84Coord | null = null;
		if (rootTransform) {
			const pos = new THREE.Vector3().setFromMatrixPosition(rootTransform);
			if (pos.length() > Tiles3DLayer.MIN_GEOREFERENCED_ECEF_LENGTH) {
				transformWgs = ecefToWgs84(pos);
			}
		}

		const sphere = new THREE.Sphere();
		if (this.tilesRenderer.getBoundingSphere(sphere) && sphere.center.length() > Tiles3DLayer.MIN_GEOREFERENCED_ECEF_LENGTH) {
			const sphereWgs = ecefToWgs84(sphere.center);
			if (transformWgs) {
				return {
					longitude: sphereWgs.longitude,
					latitude: sphereWgs.latitude,
					height: transformWgs.height,
				};
			}
			return sphereWgs;
		}

		return transformWgs;
	}

	/**
	 * Web 墨卡托水平比例补偿。
	 *
	 * 影像按墨卡托米铺设，纬度 φ 处相对真实米水平拉伸 1/cos(φ)。
	 * 仅缩放 X/Z，高度保持真实米，避免立面被连带放大后与底图错位。
	 */
	private getMercatorScale(coord: Wgs84Coord): number {
		const latRad = THREE.MathUtils.degToRad(Math.min(85, Math.abs(coord.latitude)));
		return 1 / Math.cos(latRad);
	}

	/**
	 * 包围球中心相对锚点在「局部直立 + 墨卡托水平缩放」后的水平偏移。
	 * 用于把模型视觉中心（而非测绘基准点）对准定位点，消除数米级南北/东西偏差。
	 */
	private getVisualCenterOffset(anchorToLocal: THREE.Matrix4, mercatorScale: number): THREE.Vector3 {
		const offset = new THREE.Vector3();
		if (!this.tilesRenderer) return offset;

		const sphere = new THREE.Sphere();
		if (!this.tilesRenderer.getBoundingSphere(sphere)) return offset;
		if (sphere.center.length() < Tiles3DLayer.MIN_GEOREFERENCED_ECEF_LENGTH) return offset;

		const centerLocal = sphere.center.clone().applyMatrix4(anchorToLocal);
		offset.set(centerLocal.x * mercatorScale, 0, centerLocal.z * mercatorScale);
		return offset;
	}

	/**
	 * 定位坐标：启用「定位」时取配置值，否则取瓦片集自身锚点。
	 */
	private getPlacement(): Wgs84Coord | null {
		const placement = this.config.placement;
		if (placement?.enabled) {
			return { longitude: placement.longitude, latitude: placement.latitude, height: placement.height };
		}
		return this.anchor;
	}

	/**
	 * 应用整体变换（重锚定方案）。
	 *
	 * 地理参考瓦片集的几何是 ECEF 坐标，直接套「场景原点的 ECEF→局部」矩阵
	 * 只有在原点与模型完全重合时才是直立的。这里改为三段式：
	 *
	 *   group.matrix = T(定位点场景坐标) × L(偏移/旋转/缩放) × M(锚点 ECEF→局部直立)
	 *
	 * - M 把模型摆正为"就地直立"，原点在锚点处；
	 * - L 以锚点为枢轴做用户整体调整（位置/旋转/缩放）；
	 * - T 用与影像瓦片一致的墨卡托映射把模型放到定位点，
	 *   因此无论地形原点在哪里，模型都直立且落在正确的地图位置。
	 *
	 * 非地理参考（本地坐标）瓦片集只应用 L，放置在场景原点附近。
	 */
	private applyTransform() {
		if (!this.tilesRenderer) return;

		setEnuOrigin(this.origin);

		const offset = this.config.offset;
		const rotation = this.config.rotation;
		const scale = this.config.scale;

		const localMatrix = new THREE.Matrix4();
		const pos = new THREE.Vector3(offset.x, offset.y, offset.z);
		const rot = new THREE.Euler(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z), "XYZ");
		const quat = new THREE.Quaternion().setFromEuler(rot);
		const scl = new THREE.Vector3(scale, scale, scale);
		localMatrix.compose(pos, quat, scl);

		const matrix = this.tilesRenderer.group.matrix;
		const placement = this.getPlacement();

		if (this.anchor && placement) {
			const scenePos = wgs84ToEnu(placement, this.origin);
			const anchorToLocal = getEnuMatrix(this.anchor);
			const mercatorScale = this.getMercatorScale(placement);
			const visualOffset = this.getVisualCenterOffset(anchorToLocal, mercatorScale);
			matrix
				.makeTranslation(scenePos.x - visualOffset.x, scenePos.y, scenePos.z - visualOffset.z)
				.multiply(localMatrix)
				.multiply(new THREE.Matrix4().makeScale(mercatorScale, 1, mercatorScale))
				.multiply(anchorToLocal);
		} else {
			matrix.copy(localMatrix);
		}

		this.tilesRenderer.group.matrixAutoUpdate = false;
		this.tilesRenderer.group.matrixWorldNeedsUpdate = true;
		this.tilesRenderer.group.updateMatrixWorld(true);
	}

	/* ------------------------------------------------------------------ */
	/* 视口编辑：gizmo 拖拽整体调整                                          */
	/* ------------------------------------------------------------------ */

	/**
	 * 当前是否处于视口编辑状态（gizmo 附着在编辑手柄上）。
	 * 用户点选了其他物体时 gizmo 会被夺走，此时视为编辑结束。
	 */
	isEditActive(): boolean {
		return this.editSessionActive && !!this.editHandle && this.viewer.modules.transformControls?.object === this.editHandle;
	}

	/**
	 * 开启/关闭视口编辑。
	 * 开启后把编辑手柄挂到 sceneHelpers 并附着 TransformControls，
	 * 拖拽实时作用到瓦片集，松手后防抖派发 `tiles3dEditCommitted`
	 * 供编辑器把 偏移/旋转/缩放 写回项目配置。
	 */
	setEditEnabled(enabled: boolean) {
		if (enabled) {
			this.startEdit();
		} else {
			this.stopEdit();
		}
	}

	private startEdit() {
		const controls = this.viewer.modules.transformControls;
		// 需要 gizmo（编辑态）与已加载的地理参考瓦片集
		if (!controls || !this.tilesRenderer || !this.anchor) return;

		if (!this.editHandle) {
			this.editHandle = new THREE.Object3D();
			this.editHandle.name = "Tiles3DEditHandle";
			(this.editHandle as any).ignore = true;
		}

		this.syncHandleFromConfig();
		this.viewer.sceneHelpers.add(this.editHandle);

		if (!this.editSessionActive) {
			useAddSignal("objectChanged", this.onHandleChangedBound);
			this.editSessionActive = true;
		}

		controls.attach(this.editHandle);
		this.viewer.render();
	}

	private stopEdit() {
		if (this.commitTimer) {
			clearTimeout(this.commitTimer);
			this.commitTimer = null;
		}

		if (this.editSessionActive) {
			useRemoveSignal("objectChanged", this.onHandleChangedBound);
			this.editSessionActive = false;
		}

		if (this.editHandle) {
			const controls = this.viewer.modules.transformControls;
			if (controls?.object === this.editHandle) {
				controls.detach();
			}
			this.viewer.sceneHelpers.remove(this.editHandle);
			this.viewer.render();
		}
	}

	/**
	 * 依据当前配置刷新编辑手柄 TRS：
	 * `position = 定位点场景坐标 + 偏移`，rotation/scale 与配置一致。
	 * 这样手柄的 local matrix 恰好等于变换链中的 `T × L`。
	 */
	private syncHandleFromConfig() {
		if (!this.editHandle || !this.editHandle.parent) return;

		const base = this.getPlacement();
		const scenePos = base ? wgs84ToEnu(base, this.origin) : { x: 0, y: 0, z: 0 };
		const { offset, rotation, scale } = this.config;

		this.editHandle.position.set(scenePos.x + offset.x, scenePos.y + offset.y, scenePos.z + offset.z);
		this.editHandle.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z), "XYZ");
		this.editHandle.scale.setScalar(scale);
		this.editHandle.updateMatrix();
	}

	/**
	 * 手柄变换回调（TransformControls 拖拽 / 撤销重做都会触发 objectChanged）。
	 * 实时把 `handle.matrix × M(锚点)` 应用到瓦片集，并防抖提交配置。
	 */
	private onHandleChanged(object: THREE.Object3D) {
		if (!this.editHandle || object !== this.editHandle) return;
		if (!this.tilesRenderer || !this.anchor) return;

		const placement = this.getPlacement();
		const mercatorScale = placement ? this.getMercatorScale(placement) : 1;
		const anchorToLocal = getEnuMatrix(this.anchor);
		const visualOffset = this.getVisualCenterOffset(anchorToLocal, mercatorScale);

		this.editHandle.updateMatrix();
		// 与 applyTransform 一致：先抵消视觉中心水平偏移，再水平墨卡托缩放
		this.tilesRenderer.group.matrix
			.makeTranslation(-visualOffset.x, 0, -visualOffset.z)
			.multiply(this.editHandle.matrix)
			.multiply(new THREE.Matrix4().makeScale(mercatorScale, 1, mercatorScale))
			.multiply(anchorToLocal);
		this.tilesRenderer.group.matrixWorldNeedsUpdate = true;
		this.tilesRenderer.group.updateMatrixWorld(true);

		if (this.commitTimer) clearTimeout(this.commitTimer);
		this.commitTimer = setTimeout(() => {
			this.commitTimer = null;
			this.commitEdit();
		}, 300);
	}

	/**
	 * 把手柄当前 TRS 换算回 偏移/旋转/缩放 并派发提交信号。
	 */
	private commitEdit() {
		if (!this.editHandle) return;

		const base = this.getPlacement();
		if (!base) return;

		const scenePos = wgs84ToEnu(base, this.origin);
		const p = this.editHandle.position;
		const r = this.editHandle.rotation;

		useDispatchSignal("tiles3dEditCommitted", {
			offset: {
				x: Number((p.x - scenePos.x).toFixed(2)),
				y: Number((p.y - scenePos.y).toFixed(2)),
				z: Number((p.z - scenePos.z).toFixed(2)),
			},
			rotation: {
				x: Number(THREE.MathUtils.radToDeg(r.x).toFixed(2)),
				y: Number(THREE.MathUtils.radToDeg(r.y).toFixed(2)),
				z: Number(THREE.MathUtils.radToDeg(r.z).toFixed(2)),
			},
			scale: Number(this.editHandle.scale.x.toFixed(3)),
		});
	}

	update() {
		if (!this.tilesRenderer || !this.config.enabled) return false;

		this.tilesRenderer.setCamera(this.viewer.camera);
		this.tilesRenderer.setResolutionFromRenderer(this.viewer.camera, this.viewer.renderer);
		this.tilesRenderer.errorTarget = this.config.maximumScreenSpaceError;
		this.viewer.camera.updateMatrixWorld();
		this.tilesRenderer.update();
		// LOD / 配置变化后刷新描边（含关闭时清理）
		if (this.getOutlineConfig().enabled || this.outlineLines) {
			this.syncOutline();
		}
		return true;
	}

	/**
	 * 计算瓦片在影像平面（水平 XZ）上的足迹多边形。
	 * 优先用根节点 OBB 八点投影后的凸包，避免轴对齐三维盒被放大。
	 */
	private getGroundFootprintRing(): FootprintPoint[] | null {
		if (!this.tilesRenderer) return null;

		this.tilesRenderer.group.updateMatrixWorld(true);
		const matrixWorld = this.tilesRenderer.group.matrixWorld;
		const projected: FootprintPoint[] = [];

		if (this.tilesRenderer.getOrientedBoundingBox(this.outlineLocalBox, this.outlineObbMatrix)) {
			const { min, max } = this.outlineLocalBox;
			const localToWorld = this.outlineObbMatrix.clone().premultiply(matrixWorld);
			for (let ix = 0; ix <= 1; ix++) {
				for (let iy = 0; iy <= 1; iy++) {
					for (let iz = 0; iz <= 1; iz++) {
						this.outlineCorner.set(ix ? max.x : min.x, iy ? max.y : min.y, iz ? max.z : min.z).applyMatrix4(localToWorld);
						projected.push({ x: this.outlineCorner.x, z: this.outlineCorner.z });
					}
				}
			}
		} else if (this.tilesRenderer.getBoundingBox(this.outlineLocalBox) && !this.outlineLocalBox.isEmpty()) {
			const { min, max } = this.outlineLocalBox;
			for (let ix = 0; ix <= 1; ix++) {
				for (let iz = 0; iz <= 1; iz++) {
					this.outlineCorner.set(ix ? max.x : min.x, min.y, iz ? max.z : min.z).applyMatrix4(matrixWorld);
					projected.push({ x: this.outlineCorner.x, z: this.outlineCorner.z });
				}
			}
		} else if (this.tilesRenderer.getBoundingSphere(this.outlineSphere)) {
			this.outlineCorner.copy(this.outlineSphere.center).applyMatrix4(matrixWorld);
			const radius = this.outlineSphere.radius * matrixWorld.getMaxScaleOnAxis();
			const cx = this.outlineCorner.x;
			const cz = this.outlineCorner.z;
			projected.push(
				{ x: cx - radius, z: cz - radius },
				{ x: cx + radius, z: cz - radius },
				{ x: cx + radius, z: cz + radius },
				{ x: cx - radius, z: cz + radius }
			);
		} else {
			return null;
		}

		const ring = convexHullXZ(projected);
		return ring.length >= 3 ? ring : null;
	}

	/**
	 * 同步贴地足迹描边；关闭或无效时移除。
	 * 线框挂在 layer group（场景坐标）下，贴在影像平面附近。
	 */
	private syncOutline() {
		const outline = this.getOutlineConfig();
		if (!outline.enabled || !this.tilesRenderer) {
			this.clearOutline();
			return;
		}

		const ring = this.getGroundFootprintRing();
		if (!ring) {
			this.clearOutline();
			return;
		}

		const width = Math.max(0.5, outline.width);
		this.viewer.renderer.getSize(this.outlineSize);
		if (this.outlineSize.x < 1 || this.outlineSize.y < 1) {
			this.outlineSize.set(this.viewer.container.clientWidth || 1, this.viewer.container.clientHeight || 1);
		}

		const ringChanged = !this.outlineLines || !footprintsEqual(ring, this.lastOutlineRing);

		if (!this.outlineLines || !this.outlineMaterial) {
			const geometry = new LineSegmentsGeometry();
			geometry.setPositions(ringToLinePositions(ring, OUTLINE_GROUND_Y));
			this.outlineMaterial = new LineMaterial({
				color: outline.color,
				linewidth: width,
				worldUnits: false,
				transparent: true,
				depthTest: false,
				depthWrite: false,
				toneMapped: false,
			});
			this.outlineMaterial.resolution.copy(this.outlineSize);
			this.outlineLines = new LineSegments2(geometry, this.outlineMaterial);
			this.outlineLines.name = "Tiles3DOutline";
			(this.outlineLines as any).ignore = true;
			this.outlineLines.renderOrder = 999;
			this.outlineLines.frustumCulled = false;
			this.group.add(this.outlineLines);
			this.lastOutlineRing = ring;
		} else {
			if (ringChanged) {
				(this.outlineLines.geometry as LineSegmentsGeometry).setPositions(ringToLinePositions(ring, OUTLINE_GROUND_Y));
				this.lastOutlineRing = ring;
			}
			this.outlineMaterial.color.set(outline.color);
			this.outlineMaterial.linewidth = width;
			this.outlineMaterial.resolution.copy(this.outlineSize);
			this.outlineLines.visible = true;
		}
	}

	private clearOutline() {
		if (this.outlineLines) {
			this.outlineLines.parent?.remove(this.outlineLines);
			this.outlineLines.geometry.dispose();
			this.outlineLines = null;
		}
		if (this.outlineMaterial) {
			this.outlineMaterial.dispose();
			this.outlineMaterial = null;
		}
		this.lastOutlineRing = [];
	}

	/**
	 * 实测模型地表相对场景地平面（y=0）的高度偏差。
	 *
	 * 在模型足迹范围内布 N×N 采样点，从高空向下发射射线，
	 * 取所有命中点的最低 Y 作为模型地面高度——倾斜摄影的地面
	 * 是几何的低包络，取最小值可避开屋顶/树冠。
	 *
	 * 用途：「贴地」操作按返回值反向修正偏移 Y，消除斜视时
	 * 模型与影像底图之间的视差错位。
	 *
	 * @returns 模型地面的场景 Y（米）；瓦片未加载或射线全部落空时返回 null
	 */
	getGroundOffsetY(): number | null {
		if (!this.tilesRenderer) return null;

		const sphere = new THREE.Sphere();
		if (!this.tilesRenderer.getBoundingSphere(sphere)) return null;

		const targets = this.getPickTargets();
		if (targets.length === 0) return null;

		// 包围球换算到场景空间，确定采样范围
		this.tilesRenderer.group.updateMatrixWorld(true);
		const worldMatrix = this.tilesRenderer.group.matrixWorld;
		const center = sphere.center.clone().applyMatrix4(worldMatrix);
		const radius = sphere.radius * worldMatrix.getMaxScaleOnAxis();

		const raycaster = new THREE.Raycaster();
		const down = new THREE.Vector3(0, -1, 0);
		const startY = center.y + radius + 100;
		raycaster.far = radius * 2 + 200;

		// 7×7 采样网格，覆盖足迹的内接范围（半径 × 0.7）
		const samples = 7;
		const half = radius * 0.7;
		let minY: number | null = null;

		for (let i = 0; i < samples; i++) {
			for (let j = 0; j < samples; j++) {
				const x = center.x + ((i / (samples - 1)) * 2 - 1) * half;
				const z = center.z + ((j / (samples - 1)) * 2 - 1) * half;
				raycaster.set(new THREE.Vector3(x, startY, z), down);

				const hits = raycaster.intersectObjects(targets, false);
				if (hits.length > 0) {
					const y = hits[hits.length - 1].point.y;
					if (minY === null || y < minY) minY = y;
				}
			}
		}

		return minY;
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
		this.clearOutline();
		if (this.tilesRenderer) {
			this.group.remove(this.tilesRenderer.group);
			this.tilesRenderer.dispose();
			this.tilesRenderer = null;
		}
		this.anchor = null;
		this.loadState = "idle";
		this.errorMessage = "";
	}

	dispose() {
		this.setEditEnabled(false);
		this.disposeRenderer();
		this.group.clear();
	}
}
