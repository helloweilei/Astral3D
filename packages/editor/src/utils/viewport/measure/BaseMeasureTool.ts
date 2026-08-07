import * as THREE from "three";
import { App, Hooks, Utils } from "@astral3d/engine";
import type { MeasurePointInfo } from "./types";
import { applyMeasureMarkerScale, createMeasureMarker, createMeasureLine, disposeMeasureObject, setMeasureLinePoints } from "./MeasureVisuals";

/** 按下后位移超过该像素才视为拖拽，避免轻微抖动吞掉点击 */
const CLICK_MOVE_THRESHOLD = 5;

/**
 * 视口测量工具基类：统一拾取、预览点线、标记缩放与生命周期。
 * 测距 / 测面积等子类只需实现点位提交后的几何与状态。
 */
export abstract class BaseMeasureTool {
	protected active = false;
	protected picking = false;
	protected points: THREE.Vector3[] = [];
	protected group: THREE.Group | null = null;
	protected tempMarker: THREE.Mesh | null = null;
	protected tempLine: THREE.Line | null = null;
	protected pointerDown = false;
	protected dragged = false;
	protected downX = 0;
	protected downY = 0;
	protected lastClickTime = 0;
	protected rafId = 0;
	protected pendingX = 0;
	protected pendingY = 0;
	protected dirty = false;
	/** 当前按下的 pointerId，用于配对 up/move */
	private activePointerId: number | null = null;

	private readonly raycaster = new THREE.Raycaster();
	private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
	private readonly ndc = new THREE.Vector2();
	private readonly hitPoint = new THREE.Vector3();
	private readonly norm = new THREE.Vector2();

	protected get scene() {
		return window.viewer?.scene ?? null;
	}

	protected get camera() {
		return window.viewer?.camera ?? null;
	}

	protected get canvas() {
		return window.viewer?.renderer?.domElement ?? null;
	}

	/** 子类：组名，如 ViewportDistanceMeasure */
	protected abstract get groupName(): string;

	/** 子类：是否允许继续加点（测距可一直加；测面积可有上限） */
	protected abstract canAddMorePoints(): boolean;

	/** 子类：正式加点后的几何/标签更新 */
	protected abstract onPointAdded(point: THREE.Vector3): void;

	/** 子类：向 UI 派发状态 */
	protected abstract emitState(): void;

	/** 子类：清空业务图形（线段、标签、面等），基类会清 group */
	protected abstract clearBusinessVisuals(): void;

	isActive() {
		return this.active;
	}

	isPicking() {
		return this.picking;
	}

	protected beginSession() {
		if (this.active) this.endSession();

		this.active = true;
		this.points = [];
		this.pointerDown = false;
		this.dragged = false;

		this.group = new THREE.Group();
		this.group.name = this.groupName;
		(this.group as any).ignore = true;
		this.scene?.add(this.group);

		window.viewer?.addEventListener("afterAnimation", this.onAfterAnimation as any);
		this.startPicking();
		this.emitState();
	}

	protected endSession() {
		if (!this.active && !this.group) return;

		this.stopPicking();
		window.viewer?.removeEventListener("afterAnimation", this.onAfterAnimation as any);
		this.clearAllVisuals();
		this.active = false;
		this.points = [];
		this.pointerDown = false;
		this.dragged = false;
		this.dirty = false;
	}

	reset() {
		if (!this.active) return;
		this.clearAllVisuals();
		this.points = [];
		this.group = new THREE.Group();
		this.group.name = this.groupName;
		(this.group as any).ignore = true;
		this.scene?.add(this.group);
		this.startPicking();
		this.emitState();
		this.dirty = true;
	}

	/** 结束拾取但保留结果（完成测量） */
	finishPicking() {
		if (!this.picking) return;
		this.stopPicking();
		this.emitState();
		this.dirty = true;
	}

	dispose() {
		this.endSession();
	}

	protected toPointInfo(p: THREE.Vector3): MeasurePointInfo {
		const info: MeasurePointInfo = {};
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

	protected startPicking() {
		if (this.picking) return;
		this.picking = true;
		this.pointerDown = false;
		this.dragged = false;
		this.activePointerId = null;

		// 挂在 document 捕获阶段：camera-controls 会把 move/up 转到 document，
		// 仅监听 canvas 时 pointerdown 易丢失，导致 pointerDown 一直为 false。
		document.addEventListener("pointerdown", this.onPointerDown, true);
		document.addEventListener("pointermove", this.onPointerMove, true);
		document.addEventListener("pointerup", this.onPointerUp, true);
		document.addEventListener("pointercancel", this.onPointerUp, true);
		Hooks.useAddSignal("intersectionsDetected", this.onIntersectionsDetected, undefined, 1000);

		const canvas = this.canvas;
		if (canvas) canvas.style.cursor = "crosshair";
		App.selector?.deselect();
	}

	protected stopPicking() {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}
		if (!this.picking) {
			return;
		}
		this.picking = false;
		this.pointerDown = false;
		this.dragged = false;
		this.activePointerId = null;

		document.removeEventListener("pointerdown", this.onPointerDown, true);
		document.removeEventListener("pointermove", this.onPointerMove, true);
		document.removeEventListener("pointerup", this.onPointerUp, true);
		document.removeEventListener("pointercancel", this.onPointerUp, true);
		Hooks.useRemoveSignal("intersectionsDetected", this.onIntersectionsDetected);

		const canvas = this.canvas;
		if (canvas) canvas.style.cursor = "";
		this.clearTemp();
	}

	private clearAllVisuals() {
		this.clearTemp();
		this.clearBusinessVisuals();
		if (this.group) {
			disposeMeasureObject(this.group);
			this.scene?.remove(this.group);
			this.group = null;
		}
	}

	protected clearTemp() {
		if (this.tempMarker) {
			this.scene?.remove(this.tempMarker);
			disposeMeasureObject(this.tempMarker);
			this.tempMarker = null;
		}
		if (this.tempLine) {
			this.scene?.remove(this.tempLine);
			disposeMeasureObject(this.tempLine);
			this.tempLine = null;
		}
	}

	protected addWorldPoint(point: THREE.Vector3) {
		if (!this.group || !this.canAddMorePoints()) return;

		this.points.push(point.clone());
		const marker = createMeasureMarker(point);
		this.applyMarkerScale(marker);
		this.group.add(marker);

		this.onPointAdded(point);
		this.emitState();
		this.dirty = true;
	}

	protected applyMarkerScale(marker: THREE.Object3D) {
		const cam = this.camera;
		if (!cam) return;
		applyMeasureMarkerScale(marker, cam, this.canvas?.clientHeight || 800);
	}

	protected updateMarkerScales() {
		if (this.tempMarker) this.applyMarkerScale(this.tempMarker);
		if (!this.group) return;
		for (const child of this.group.children) {
			if (child.userData.measureMarker) this.applyMarkerScale(child);
		}
	}

	/**
	 * 轻量拾取：canvas 像素 → NDC（标准设备坐标）。
	 * 优先场景物体；否则地平面交点，再贴地形高度。
	 */
	protected pickPoint(clientX: number, clientY: number): THREE.Vector3 | null {
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

	/** 事件坐标是否落在 WebGL canvas 矩形内 */
	private isInsideCanvas(clientX: number, clientY: number): boolean {
		const canvas = this.canvas;
		if (!canvas) return false;
		const rect = canvas.getBoundingClientRect();
		return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
	}

	private readonly onPointerDown = (e: PointerEvent) => {
		if (!this.picking) return;
		// 鼠标仅响应主键；触控/笔的 button 可能为 -1，用 buttons 兜底
		if (e.pointerType === "mouse" && e.button !== 0) return;
		if ((e.target as HTMLElement | null)?.closest?.(".viewport-tools, .viewport-right-stack")) return;
		if (!this.isInsideCanvas(e.clientX, e.clientY)) return;

		this.pointerDown = true;
		this.dragged = false;
		this.downX = e.clientX;
		this.downY = e.clientY;
		this.activePointerId = e.pointerId;
	};

	private readonly onPointerMove = (e: PointerEvent) => {
		if (!this.picking) return;

		// 优先用本工具记录的按下态；若 pointerdown 丢失，用 buttons 主鍵位兜底
		const primaryHeld = this.pointerDown || (e.buttons & 1) === 1;
		if (primaryHeld) {
			if (!this.pointerDown) {
				this.pointerDown = true;
				this.activePointerId = e.pointerId;
				this.downX = e.clientX;
				this.downY = e.clientY;
			}
			const dx = e.clientX - this.downX;
			const dy = e.clientY - this.downY;
			if (dx * dx + dy * dy > CLICK_MOVE_THRESHOLD * CLICK_MOVE_THRESHOLD) {
				this.dragged = true;
			}
		}

		if (!this.canAddMorePoints()) return;
		if (!this.isInsideCanvas(e.clientX, e.clientY)) return;

		this.pendingX = e.clientX;
		this.pendingY = e.clientY;
		if (!this.rafId) {
			this.rafId = requestAnimationFrame(this.flushPreview);
		}
	};

	private readonly flushPreview = () => {
		this.rafId = 0;
		if (!this.picking || !this.canAddMorePoints()) return;

		const point = this.pickPoint(this.pendingX, this.pendingY);
		if (!point) return;

		if (!this.tempMarker) {
			this.tempMarker = createMeasureMarker(point);
			this.applyMarkerScale(this.tempMarker);
			this.scene?.add(this.tempMarker);
		} else {
			this.tempMarker.position.copy(point);
		}

		if (this.points.length >= 1) {
			const last = this.points[this.points.length - 1];
			if (!this.tempLine) {
				this.tempLine = createMeasureLine([last, point]);
				this.scene?.add(this.tempLine);
			} else {
				setMeasureLinePoints(this.tempLine, [last, point]);
			}
		}

		this.dirty = true;
	};

	private readonly onPointerUp = (e: PointerEvent) => {
		if (!this.picking) return;
		if (e.pointerType === "mouse" && e.button !== 0) return;
		if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
		if (!this.pointerDown) return;

		const wasDragged = this.dragged;
		this.pointerDown = false;
		this.dragged = false;
		this.activePointerId = null;

		if (wasDragged || !this.canAddMorePoints()) return;
		if ((e.target as HTMLElement | null)?.closest?.(".viewport-tools, .viewport-right-stack")) return;
		if (!this.isInsideCanvas(e.clientX, e.clientY)) return;

		const now = Date.now();
		// 双击：结束拾取（保留已有点）
		if (now - this.lastClickTime < 280 && this.points.length >= 2) {
			this.lastClickTime = now;
			this.finishPicking();
			return;
		}
		this.lastClickTime = now;

		const point = this.pickPoint(e.clientX, e.clientY);
		if (!point) return;

		this.addWorldPoint(point);
	};

	private readonly onIntersectionsDetected = () => {
		if (!this.picking) return;
		App.selector?.deselect();
		Hooks.useSignal().halt("intersectionsDetected");
	};

	private readonly onAfterAnimation = (event: { toBeRender: (need?: boolean) => void }) => {
		if (this.active) {
			this.updateMarkerScales();
		}
		if (!this.dirty) return;
		this.dirty = false;
		event.toBeRender(true);
	};
}
