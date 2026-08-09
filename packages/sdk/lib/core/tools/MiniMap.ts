import { OrthographicCamera, WebGLRenderer, Vector2, Vector3, Raycaster, Plane, Object3D } from "three";
import type Viewer from "@/core/viewer/Viewer";

export interface IMiniMapOptions {
	/** 正交相机视野边长（世界单位）；autoFit 开启时作为最小视野 */
	mapSize?: number;
	/** 小地图 DOM / 画布边长（px） */
	mapRenderSize?: number;
	/** 可选跟随对象；未提供时跟随 controls 目标点 */
	followTarget?: Object3D;
	/** 是否初始显示 */
	isShow?: boolean;
	/** 视野是否随主相机距离自适应，默认 true */
	autoFit?: boolean;
}

/**
 * 视口小地图：右下角俯视正交视图，跟随主相机目标，点击可跳转。
 */
class MiniMap {
	private viewer: Viewer;
	private mapSize: number;
	private mapRenderSize: number;
	private autoFit: boolean;
	private followTarget: Object3D | null;

	private _miniMapCamera: OrthographicCamera;
	private _miniMapRenderer: WebGLRenderer;

	public dom: HTMLDivElement;
	public isShow = false;

	private readonly _target = new Vector3();
	private readonly _camPos = new Vector3();
	private readonly _offset = new Vector3();
	private readonly _ndc = new Vector2();
	private readonly _hit = new Vector3();
	private readonly _raycaster = new Raycaster();
	private readonly _ground = new Plane(new Vector3(0, 1, 0), 0);

	private boundAfterRender: (() => void) | null = null;
	private boundPointerDown: ((e: PointerEvent) => void) | null = null;

	constructor(viewer: Viewer, options: IMiniMapOptions = {}) {
		this.viewer = viewer;
		this.mapSize = options.mapSize ?? 200;
		this.mapRenderSize = options.mapRenderSize ?? 160;
		this.autoFit = options.autoFit !== false;
		this.followTarget = options.followTarget ?? null;
		this.isShow = !!options.isShow;

		if (!viewer?.scene) {
			throw new Error("MiniMap: viewer.scene 不能为空");
		}

		const half = this.mapSize / 2;
		this._miniMapCamera = new OrthographicCamera(-half, half, half, -half, 0.5, 1e6);
		this._miniMapCamera.layers.enableAll();

		this._miniMapRenderer = new WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: "low-power",
		});
		this._miniMapRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		this._miniMapRenderer.setSize(this.mapRenderSize, this.mapRenderSize);
		this._miniMapRenderer.setClearColor(0x000000, 0.35);
		this._miniMapRenderer.autoClear = true;

		this.dom = this.createDomElement();
		this.dom.appendChild(this._miniMapRenderer.domElement);
		viewer.container.appendChild(this.dom);

		this.boundPointerDown = this.onPointerDown.bind(this);
		this.dom.addEventListener("pointerdown", this.boundPointerDown);

		this.boundAfterRender = () => {
			if (this.isShow) this.update();
		};
		viewer.addEventListener("afterRender", this.boundAfterRender as any);

		this.updateCamera();
		if (this.isShow) {
			this.open();
		} else {
			this.close();
		}
	}

	updateOptions(options: Pick<IMiniMapOptions, "mapSize" | "mapRenderSize">) {
		this.mapSize = options.mapSize ?? this.mapSize;
		this.mapRenderSize = options.mapRenderSize ?? this.mapRenderSize;
		this._miniMapRenderer.setSize(this.mapRenderSize, this.mapRenderSize);
		this.updateCamera();
		this.dom.style.width = `${this.mapRenderSize}px`;
		this.dom.style.height = `${this.mapRenderSize}px`;
	}

	private createDomElement() {
		const pDiv = document.createElement("div");
		pDiv.id = "es-3d-mini-map";
		pDiv.style.cssText = [
			"position:absolute",
			"right:12px",
			"bottom:12px",
			`width:${this.mapRenderSize}px`,
			`height:${this.mapRenderSize}px`,
			"z-index:11",
			"border:1px solid rgba(255,255,255,0.55)",
			"border-radius:8px",
			"background:rgba(0,0,0,0.45)",
			"overflow:hidden",
			"box-shadow:0 2px 10px rgba(0,0,0,0.35)",
			"pointer-events:auto",
			"user-select:none",
		].join(";");

		const canvas = this._miniMapRenderer.domElement;
		canvas.style.cssText = "display:block;width:100%;height:100%;";

		const cross = document.createElement("div");
		cross.style.cssText = [
			"position:absolute",
			"left:50%",
			"top:50%",
			"width:10px",
			"height:10px",
			"margin:-5px 0 0 -5px",
			"pointer-events:none",
			"z-index:1",
		].join(";");
		cross.innerHTML =
			'<div style="position:absolute;left:4px;top:0;width:2px;height:10px;background:#e63c17;"></div>' +
			'<div style="position:absolute;left:0;top:4px;width:10px;height:2px;background:#e63c17;"></div>';
		pDiv.appendChild(cross);

		return pDiv;
	}

	open() {
		this.dom.style.display = "block";
		this.isShow = true;
		this.update();
	}

	close() {
		this.dom.style.display = "none";
		this.isShow = false;
	}

	private resolveFocus(): Vector3 {
		const controls = this.viewer.modules?.controls;
		if (controls) {
			controls.getTarget(this._target);
			return this._target;
		}
		if (this.followTarget) {
			return this._target.copy(this.followTarget.position);
		}
		return this._target.copy(this.viewer.camera.position);
	}

	private resolveMapHalfSize(): number {
		if (!this.autoFit) return this.mapSize / 2;

		const controls = this.viewer.modules?.controls;
		const distance = controls?.distance ?? this.mapSize;
		return Math.max(this.mapSize / 2, distance * 0.85);
	}

	updateCamera() {
		const focus = this.resolveFocus();
		const half = this.resolveMapHalfSize();
		const cam = this._miniMapCamera;

		cam.left = -half;
		cam.right = half;
		cam.top = half;
		cam.bottom = -half;
		cam.updateProjectionMatrix();

		const height = Math.max(half * 2, 50);
		cam.position.set(focus.x, focus.y + height, focus.z);

		const azimuth = this.viewer.modules?.controls?.azimuthAngle ?? 0;
		cam.up.set(-Math.sin(azimuth), 0, Math.cos(azimuth));
		cam.lookAt(focus.x, focus.y, focus.z);
	}

	update() {
		if (!this.isShow || !this._miniMapRenderer) return;

		this.updateCamera();

		const renderer = this._miniMapRenderer;
		const camera = this._miniMapCamera;

		renderer.setRenderTarget(null);
		renderer.clear();
		renderer.render(this.viewer.scene, camera);
	}

	private onPointerDown(e: PointerEvent) {
		if (!this.isShow) return;
		e.preventDefault();
		e.stopPropagation();

		const rect = this.dom.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;

		this._ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);

		this._raycaster.setFromCamera(this._ndc, this._miniMapCamera);

		const focus = this.resolveFocus();
		this._ground.constant = -focus.y;

		let point: Vector3 | null = null;
		const hits = this._raycaster.intersectObject(this.viewer.scene, true);
		if (hits.length > 0) {
			point = hits[0].point;
		} else if (this._raycaster.ray.intersectPlane(this._ground, this._hit)) {
			point = this._hit;
		}
		if (!point) return;

		const controls = this.viewer.modules?.controls;
		if (!controls) return;

		controls.getTarget(this._target);
		this.viewer.camera.getWorldPosition(this._camPos);
		this._offset.copy(this._camPos).sub(this._target);

		controls.setLookAt(point.x + this._offset.x, point.y + this._offset.y, point.z + this._offset.z, point.x, point.y, point.z, true);
	}

	dispose() {
		if (this.boundAfterRender) {
			this.viewer.removeEventListener("afterRender", this.boundAfterRender as any);
			this.boundAfterRender = null;
		}
		if (this.boundPointerDown) {
			this.dom.removeEventListener("pointerdown", this.boundPointerDown);
			this.boundPointerDown = null;
		}

		this._miniMapRenderer.dispose();
		this.dom.remove();
	}
}

export { MiniMap };
