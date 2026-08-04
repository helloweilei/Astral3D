import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { App, Hooks, Utils, createCircleMesh } from "@astral3d/engine";

export interface MeasurePointInfo {
	/** 地形开启时附带经纬度/高度 */
	longitude?: number;
	latitude?: number;
	height?: number;
}

export interface DistanceMeasureState {
	point1: MeasurePointInfo | null;
	point2: MeasurePointInfo | null;
	distance: number | null;
}

type StateListener = (state: DistanceMeasureState) => void;

/** 按下后位移超过该像素才视为拖拽，避免轻微抖动吞掉点击 */
const CLICK_MOVE_THRESHOLD = 5;

const LINE_MATERIAL = new THREE.LineBasicMaterial({
	color: 0xe63c17,
	linewidth: 2,
	transparent: true,
	opacity: 0.95,
	depthTest: false,
	depthWrite: false,
});

const MARKER_MATERIAL_COLOR = 0xe63c17;

/**
 * 编辑器视口两点测距工具。
 * 进入后拦截选中，点击地图依次采集点1/点2，场景中绘制标记、连线与距离标签。
 */
export class DistanceMeasureTool {
	/** 是否标记仍保留 */
	private active = false;
	/** 是否处于拾取/绘制模式 */
	private picking = false;
	private points: THREE.Vector3[] = [];
	private group: THREE.Group | null = null;
	private line: THREE.Line | null = null;
	private label: CSS2DObject | null = null;
	private tempMarker: THREE.Mesh | null = null;
	private tempLine: THREE.Line | null = null;
	private listener: StateListener | null = null;
	private pointerDown = false;
	private dragged = false;
	private downX = 0;
	private downY = 0;
	private lastClickTime = 0;
	/** 合并到下一帧再画预览，避免每 pointermove 强制 render 导致闪烁/卡顿 */
	private rafId = 0;
	private pendingX = 0;
	private pendingY = 0;
	private dirty = false;
	private readonly raycaster = new THREE.Raycaster();
	private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
	private readonly ndc = new THREE.Vector2();
	private readonly hitPoint = new THREE.Vector3();
	private readonly norm = new THREE.Vector2();

	private readonly onPointerDown = (e: PointerEvent) => {
		if (!this.picking || e.button !== 0) return;
		this.pointerDown = true;
		this.dragged = false;
		this.downX = e.clientX;
		this.downY = e.clientY;
	};

	private readonly onPointerMove = (e: PointerEvent) => {
		if (!this.picking) return;

		if (this.pointerDown) {
			const dx = e.clientX - this.downX;
			const dy = e.clientY - this.downY;
			if (dx * dx + dy * dy > CLICK_MOVE_THRESHOLD * CLICK_MOVE_THRESHOLD) {
				this.dragged = true;
			}
		}

		if (this.points.length >= 2) return;

		this.pendingX = e.clientX;
		this.pendingY = e.clientY;
		if (!this.rafId) {
			this.rafId = requestAnimationFrame(this.flushPreview);
		}
	};

	private readonly flushPreview = () => {
		this.rafId = 0;
		if (!this.picking || this.points.length >= 2) return;

		const point = this.pickPoint(this.pendingX, this.pendingY);
		if (!point) return;

		if (!this.tempMarker) {
			this.tempMarker = this.createMarker(point);
			this.scene?.add(this.tempMarker);
		} else {
			this.tempMarker.position.copy(point);
		}

		if (this.points.length === 1) {
			const p0 = this.points[0];
			if (!this.tempLine) {
				this.tempLine = this.createLine([p0, point]);
				this.scene?.add(this.tempLine);
			} else {
				this.setLinePoints(this.tempLine, [p0, point]);
			}
		}

		// 交给动画循环在 terrain.update 之后渲染，避免直接 render() 抢帧闪烁
		this.dirty = true;
	};

	private readonly onPointerUp = (e: PointerEvent) => {
		if (!this.picking || e.button !== 0 || !this.pointerDown) return;

		const wasDragged = this.dragged;
		this.pointerDown = false;
		this.dragged = false;

		if (wasDragged || this.points.length >= 2) return;

		const target = e.target as HTMLElement | null;
		if (target?.closest?.(".viewport-tools, .viewport-right-stack")) return;

		const now = Date.now();
		if (now - this.lastClickTime < 120) return;
		this.lastClickTime = now;

		const point = this.pickPoint(e.clientX, e.clientY);
		if (!point) return;

		this.addPoint(point);
	};

	/** 拾取期间吞掉选中，避免误选场景物体 */
	private readonly onIntersectionsDetected = () => {
		if (!this.picking) return;
		App.selector?.deselect();
		Hooks.useSignal().halt("intersectionsDetected");
	};

	/** 在动画循环末尾请求一帧，并按视距刷新测距点屏幕尺寸 */
	private readonly onAfterAnimation = (event: { toBeRender: (need?: boolean) => void }) => {
		if (this.active) {
			this.updateMarkerScales();
		}
		if (!this.dirty) return;
		this.dirty = false;
		event.toBeRender(true);
	};

	private get scene() {
		return window.viewer?.scene ?? null;
	}

	private get camera() {
		return window.viewer?.camera ?? null;
	}

	private get canvas() {
		return window.viewer?.renderer?.domElement ?? null;
	}

	open(listener: StateListener) {
		if (this.active) this.close();

		this.active = true;
		this.listener = listener;
		this.points = [];
		this.pointerDown = false;
		this.dragged = false;

		this.group = new THREE.Group();
		this.group.name = "ViewportDistanceMeasure";
		(this.group as any).ignore = true;
		this.scene?.add(this.group);

		window.viewer?.addEventListener("afterAnimation", this.onAfterAnimation as any);
		this.startPicking();
		this.emit();
	}

	reset() {
		if (!this.active) return;
		this.clearVisuals();
		this.points = [];
		this.group = new THREE.Group();
		this.group.name = "ViewportDistanceMeasure";
		(this.group as any).ignore = true;
		this.scene?.add(this.group);
		this.startPicking();
		this.emit();
		this.dirty = true;
	}

	close() {
		if (!this.active && !this.group) return;

		this.stopPicking();
		window.viewer?.removeEventListener("afterAnimation", this.onAfterAnimation as any);
		this.clearVisuals();
		this.active = false;
		this.points = [];
		this.listener = null;
		this.pointerDown = false;
		this.dragged = false;
		this.dirty = false;
	}

	isActive() {
		return this.active;
	}

	isPicking() {
		return this.picking;
	}

	/** 进入拾取模式：十字光标、拦截选中 */
	private startPicking() {
		if (this.picking) return;
		this.picking = true;
		this.pointerDown = false;
		this.dragged = false;

		// 挂在 canvas 上，与相机控件同一坐标系，避免相对 container 偏移
		const canvas = this.canvas;
		canvas?.addEventListener("pointerdown", this.onPointerDown);
		canvas?.addEventListener("pointermove", this.onPointerMove);
		document.addEventListener("pointerup", this.onPointerUp);
		Hooks.useAddSignal("intersectionsDetected", this.onIntersectionsDetected, undefined, 1000);

		if (canvas) canvas.style.cursor = "crosshair";
		App.selector?.deselect();
	}

	/** 退出拾取模式：恢复光标与正常选择，保留测量结果 */
	private stopPicking() {
		if (!this.picking) {
			if (this.rafId) {
				cancelAnimationFrame(this.rafId);
				this.rafId = 0;
			}
			return;
		}
		this.picking = false;
		this.pointerDown = false;
		this.dragged = false;

		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}

		const canvas = this.canvas;
		canvas?.removeEventListener("pointerdown", this.onPointerDown);
		canvas?.removeEventListener("pointermove", this.onPointerMove);
		document.removeEventListener("pointerup", this.onPointerUp);
		Hooks.useRemoveSignal("intersectionsDetected", this.onIntersectionsDetected);

		if (canvas) canvas.style.cursor = "";
		this.clearTemp();
	}

	dispose() {
		this.close();
	}

	private clearVisuals() {
		this.clearTemp();
		if (this.group) {
			this.disposeObject(this.group);
			this.scene?.remove(this.group);
			this.group = null;
		}
		this.line = null;
		this.label = null;
	}

	private clearTemp() {
		if (this.tempMarker) {
			this.scene?.remove(this.tempMarker);
			this.disposeObject(this.tempMarker);
			this.tempMarker = null;
		}
		if (this.tempLine) {
			this.scene?.remove(this.tempLine);
			this.disposeObject(this.tempLine);
			this.tempLine = null;
		}
	}

	private addPoint(point: THREE.Vector3) {
		if (!this.group) return;

		this.points.push(point.clone());
		const marker = this.createMarker(point);
		this.group.add(marker);

		if (this.points.length === 2) {
			this.line = this.createLine(this.points);
			this.group.add(this.line);

			const dist = this.points[0].distanceTo(this.points[1]);
			const mid = this.points[0].clone().add(this.points[1]).multiplyScalar(0.5);
			this.label = this.createLabel(`${this.formatDistance(dist)} m`);
			this.label.position.copy(mid);
			this.group.add(this.label);

			// 两点齐全后退出绘制/拾取模式，保留结果与弹框
			this.stopPicking();
		}

		this.emit();
		this.dirty = true;
	}

	/**
	 * 轻量拾取：用 canvas 像素算 NDC（归一化设备坐标）。
	 * 优先普通场景物体；否则取视线与地平面交点，再按地形表面高度贴地。
	 * 不再每帧对全部影像瓦片做射线检测（那会卡死主线程并导致瓦片停更、画面闪烁）。
	 */
	private pickPoint(clientX: number, clientY: number): THREE.Vector3 | null {
		const viewer = window.viewer;
		const camera = this.camera;
		const canvas = this.canvas;
		if (!viewer || !camera || !canvas) return null;

		const rect = canvas.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;

		const nx = (clientX - rect.left) / rect.width;
		const ny = (clientY - rect.top) / rect.height;
		if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;

		this.norm.set(nx, ny);
		this.ndc.set(nx * 2 - 1, -(ny * 2) + 1);
		this.raycaster.setFromCamera(this.ndc, camera);
		this.raycaster.far = 1e8;

		const sceneHits = viewer.getIntersects(this.norm);
		if (sceneHits.length > 0) {
			return sceneHits[0].point.clone();
		}

		// 射线与地平面相交
		if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.hitPoint)) {
			return null;
		}

		const point = this.hitPoint.clone();
		const surfaceY = viewer.modules?.terrain?.pickSurfaceHeight?.(point.x, point.z);
		if (surfaceY !== null && surfaceY !== undefined) {
			point.y = surfaceY;
		}
		return point;
	}

	private toPointInfo(p: THREE.Vector3): MeasurePointInfo {
		const info = {} as MeasurePointInfo;

		const terrainEnabled = !!App.project.getKey("terrain.enabled");
		if (terrainEnabled) {
			const origin = App.project.getKey("terrain.origin");
			if (origin) {
				const wgs = Utils.enuToWgs84({ x: p.x, y: p.y, z: p.z }, origin);
				info.longitude = Number(wgs.longitude.toFixed(6));
				info.latitude = Number(wgs.latitude.toFixed(6));
				info.height = Number(wgs.height.toFixed(2));
			}
		}

		return info;
	}

	private emit() {
		const point1 = this.points[0] ? this.toPointInfo(this.points[0]) : null;
		const point2 = this.points[1] ? this.toPointInfo(this.points[1]) : null;
		const distance = this.points.length === 2 ? Number(this.points[0].distanceTo(this.points[1]).toFixed(2)) : null;
		this.listener?.({ point1, point2, distance });
	}

	private createMarker(point: THREE.Vector3) {
		// 单位球，实际屏幕大小由 updateMarkerScales 按相机距离换算为约 8px
		const mesh = createCircleMesh({
			strokeColor: new THREE.Color(MARKER_MATERIAL_COLOR),
			radius: 6,
			strokeWidth: 4,
		});
		mesh.position.copy(point);
		mesh.renderOrder = 999;
		(mesh as any).ignore = true;
		mesh.frustumCulled = false;
		mesh.userData.measureMarker = true;
		this.applyMarkerScale(mesh);
		return mesh;
	}

	/** 将测距点缩放到近似固定屏幕像素，避免放大地图时点变得巨大 */
	private applyMarkerScale(marker: THREE.Object3D) {
		const cam = this.camera as THREE.PerspectiveCamera | null;
		if (!cam) return;
		const dist = cam.position.distanceTo(marker.position);
		const canvasH = this.canvas?.clientHeight || 800;
		const fov = cam.isPerspectiveCamera ? cam.fov : 50;
		const worldPerPixel = (2 * dist * Math.tan(THREE.MathUtils.degToRad(fov / 2))) / canvasH;
		const radiusPx = 10;
		marker.scale.setScalar(Math.max(0.05, worldPerPixel * radiusPx));
	}

	private updateMarkerScales() {
		if (this.tempMarker) this.applyMarkerScale(this.tempMarker);
		if (!this.group) return;
		for (const child of this.group.children) {
			if (child.userData.measureMarker) this.applyMarkerScale(child);
		}
	}

	private createLine(points: THREE.Vector3[]) {
		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(geometry, LINE_MATERIAL.clone());
		line.renderOrder = 998;
		(line as any).ignore = true;
		line.frustumCulled = false;
		return line;
	}

	private setLinePoints(line: THREE.Line, points: THREE.Vector3[]) {
		line.geometry.setFromPoints(points);
		line.geometry.attributes.position.needsUpdate = true;
	}

	private createLabel(text: string) {
		const div = document.createElement("div");
		div.className = "viewport-measure-label";
		div.textContent = text;
		div.style.cssText = [
			"padding:2px 4px",
			"border-radius:4px",
			"background:rgba(20,24,32,0.82)",
			"color:#fff",
			"font-size:10px",
			"font-weight:600",
			"white-space:nowrap",
			"border:1px solid rgba(230,60,23,0.85)",
			"pointer-events:none",
			"user-select:none",
		].join(";");

		const obj = new CSS2DObject(div);
		(obj as any).ignore = true;
		return obj;
	}

	private formatDistance(dist: number) {
		if (dist < 0.01) return dist.toFixed(4);
		if (dist < 0.1) return dist.toFixed(3);
		return dist.toFixed(2);
	}

	private disposeObject(object: THREE.Object3D) {
		object.traverse(child => {
			const mesh = child as THREE.Mesh;
			if (mesh.geometry) mesh.geometry.dispose();
			const material = mesh.material;
			if (Array.isArray(material)) {
				material.forEach(m => m.dispose());
			} else if (material) {
				material.dispose();
			}
			const css2d = child as CSS2DObject;
			if (css2d.element) {
				css2d.element.parentNode?.removeChild(css2d.element);
			}
		});
	}
}
