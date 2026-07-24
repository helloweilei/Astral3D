import * as THREE from "three";
import CameraControls from "camera-controls";
import Viewer from "../Viewer";

export type CameraNavigationMode = "orbit" | "roam";

export const DEFAULT_CAMERA_POSITION = { x: 10, y: 5, z: 10 };
export const DEFAULT_CAMERA_TARGET = { x: 0, y: 0, z: 0 };
export const DEFAULT_CAMERA_FOV = 45;
export const DEFAULT_CAMERA_NEAR = 0.01;
export const DEFAULT_CAMERA_FAR = 100 * 1000;

const ROAM_MIN_DISTANCE = 0.01;
const ROAM_MAX_DISTANCE = 0.01;
const DEFAULT_ORBIT_DISTANCE = new THREE.Vector3(
	DEFAULT_CAMERA_POSITION.x - DEFAULT_CAMERA_TARGET.x,
	DEFAULT_CAMERA_POSITION.y - DEFAULT_CAMERA_TARGET.y,
	DEFAULT_CAMERA_POSITION.z - DEFAULT_CAMERA_TARGET.z
).length();

/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/10/21 21:16
 * @description 场景相机管理器。 TODO: 后续应把viewport.camera也管理进来
 */
export class CameraManage {
	private readonly viewer: Viewer;
	private readonly defaultControlOptions: IViewerControl;
	private readonly controls: CameraControls;
	private navigationMode: CameraNavigationMode = "orbit";
	private roamMoveSpeed = 20;
	private savedOrbitDistance: number | null = null;
	private roamKeys = {
		forward: false,
		backward: false,
		left: false,
		right: false,
		up: false,
		down: false,
	};
	private readonly onKeyDown = (event: KeyboardEvent) => this.handleKeyDown(event);
	private readonly onKeyUp = (event: KeyboardEvent) => this.handleKeyUp(event);

	constructor(viewer: Viewer, cameraControls: CameraControls) {
		this.viewer = viewer;
		this.controls = cameraControls;
		this.defaultControlOptions = { ...viewer.options.control };
		this.navigationMode = viewer.options.control.navigationMode ?? "orbit";
		this.roamMoveSpeed = viewer.options.control.roamMoveSpeed ?? 20;

		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);

		this.init();
	}

	init() {
		this.applyNavigationMode();
	}

	dispose() {
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
	}

	getNavigationMode(): CameraNavigationMode {
		return this.navigationMode;
	}

	getRoamMoveSpeed(): number {
		return this.roamMoveSpeed;
	}

	setNavigationMode(mode: CameraNavigationMode) {
		this.navigationMode = mode;
		this.viewer.options.control.navigationMode = mode;
		this.defaultControlOptions.navigationMode = mode;
		this.applyNavigationMode();
	}

	toggleNavigationMode(): CameraNavigationMode {
		this.setNavigationMode(this.navigationMode === "orbit" ? "roam" : "orbit");
		return this.navigationMode;
	}

	setRoamMoveSpeed(speed: number) {
		this.roamMoveSpeed = Math.max(1, speed);
		this.viewer.options.control.roamMoveSpeed = this.roamMoveSpeed;
		this.defaultControlOptions.roamMoveSpeed = this.roamMoveSpeed;
	}

	updateNavigation(delta: number): boolean {
		if (this.navigationMode !== "roam" || !this.controls.enabled) return false;

		const speed = this.roamMoveSpeed * delta;
		let moved = false;

		if (this.roamKeys.forward) {
			this.controls.forward(speed, false);
			moved = true;
		}
		if (this.roamKeys.backward) {
			this.controls.forward(-speed, false);
			moved = true;
		}
		if (this.roamKeys.left) {
			this.controls.truck(-speed, 0, false);
			moved = true;
		}
		if (this.roamKeys.right) {
			this.controls.truck(speed, 0, false);
			moved = true;
		}
		if (this.roamKeys.up) {
			this.controls.elevate(speed, false);
			moved = true;
		}
		if (this.roamKeys.down) {
			this.controls.elevate(-speed, false);
			moved = true;
		}

		return moved;
	}

	/**
	 * 恢复默认交互限制
	 */
	resetInteract() {
		this.setInteract({
			...this.defaultControlOptions,
			navigationMode: this.navigationMode,
			roamMoveSpeed: this.roamMoveSpeed,
		});
	}

	/**
	 * 复位相机到编辑器初始状态：环视模式、目标点回到场景原点。
	 */
	resetToDefault(enableTransition = true) {
		this.savedOrbitDistance = DEFAULT_ORBIT_DISTANCE;
		this.setNavigationMode("orbit");

		const position = DEFAULT_CAMERA_POSITION;
		const target = DEFAULT_CAMERA_TARGET;

		this.controls.setLookAt(
			position.x,
			position.y,
			position.z,
			target.x,
			target.y,
			target.z,
			enableTransition
		);
		this.controls.distance = DEFAULT_ORBIT_DISTANCE;
		this.controls.update(0.016);

		const camera = this.viewer.camera;
		camera.position.set(position.x, position.y, position.z);
		camera.lookAt(target.x, target.y, target.z);

		if (camera.isPerspectiveCamera) {
			camera.fov = DEFAULT_CAMERA_FOV;
			camera.near = DEFAULT_CAMERA_NEAR;
			camera.far = DEFAULT_CAMERA_FAR;
			camera.updateProjectionMatrix();
		}

		this.viewer.render();
	}

	/**
	 * 设置交互模式
	 */
	setInteract(config: Partial<IViewerControl>) {
		const opt = Object.assign({}, this.defaultControlOptions, config);

		if (opt.navigationMode !== undefined) {
			this.navigationMode = opt.navigationMode;
			this.viewer.options.control.navigationMode = opt.navigationMode;
		}
		if (opt.roamMoveSpeed !== undefined) {
			this.roamMoveSpeed = Math.max(1, opt.roamMoveSpeed);
			this.viewer.options.control.roamMoveSpeed = this.roamMoveSpeed;
		}

		Object.keys(opt).forEach(key => {
			if (key === "navigationMode" || key === "roamMoveSpeed") return;
			if ((this.controls as unknown as Record<string, unknown>)[key] !== undefined) {
				(this.controls as unknown as Record<string, unknown>)[key] = opt[key as keyof IViewerControl];
			}
		});

		this.applyNavigationMode();
	}

	private applyNavigationMode() {
		const opt = this.defaultControlOptions;

		if (this.navigationMode === "roam") {
			this.saveOrbitDistance();
			this.controls.minDistance = ROAM_MIN_DISTANCE;
			this.controls.maxDistance = ROAM_MAX_DISTANCE;
			this.controls.minZoom = 0.01;
			this.controls.maxZoom = Infinity;
			this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
			this.controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
			this.controls.mouseButtons.middle = CameraControls.ACTION.NONE;
			this.controls.mouseButtons.wheel = CameraControls.ACTION.NONE;
			this.syncRoamLookTarget();
			return;
		}

		this.controls.minDistance = opt.minDistance;
		this.controls.maxDistance = opt.maxDistance;
		this.controls.minZoom = opt.minZoom;
		this.controls.maxZoom = opt.maxZoom;
		this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
		this.controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
		this.controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
		this.controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
		this.restoreOrbitDistance(opt);
		this.clearRoamKeys();
	}

	private saveOrbitDistance() {
		const distance = this.controls.distance;
		if (distance > ROAM_MAX_DISTANCE) {
			this.savedOrbitDistance = distance;
		}
	}

	private restoreOrbitDistance(opt: IViewerControl) {
		const minDistance = Math.max(opt.minDistance, 0.01);
		let distance = this.savedOrbitDistance ?? DEFAULT_ORBIT_DISTANCE;

		if (this.controls.distance <= ROAM_MAX_DISTANCE * 2) {
			distance = Math.max(distance, DEFAULT_ORBIT_DISTANCE);
		}

		distance = Math.max(distance, minDistance);
		this.controls.setTarget(DEFAULT_CAMERA_TARGET.x, DEFAULT_CAMERA_TARGET.y, DEFAULT_CAMERA_TARGET.z, false);
		this.controls.distance = distance;
		this.savedOrbitDistance = distance;
		this.controls.update(0.016);
	}

	private syncRoamLookTarget() {
		const camera = this.viewer.camera;
		const direction = new THREE.Vector3();
		camera.getWorldDirection(direction);
		const target = camera.position.clone().add(direction);
		this.controls.setLookAt(
			camera.position.x,
			camera.position.y,
			camera.position.z,
			target.x,
			target.y,
			target.z,
			false
		);
	}

	private clearRoamKeys() {
		this.roamKeys.forward = false;
		this.roamKeys.backward = false;
		this.roamKeys.left = false;
		this.roamKeys.right = false;
		this.roamKeys.up = false;
		this.roamKeys.down = false;
	}

	private shouldIgnoreKeyboard(event: KeyboardEvent): boolean {
		if (this.navigationMode !== "roam") return true;
		if (!this.controls.enabled) return true;
		if (event.repeat) return true;

		const target = event.target as HTMLElement | null;
		if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName.toUpperCase())) {
			return true;
		}

		return false;
	}

	private handleKeyDown(event: KeyboardEvent) {
		if (this.shouldIgnoreKeyboard(event)) return;

		switch (event.code) {
			case "KeyW":
			case "ArrowUp":
				this.roamKeys.forward = true;
				event.preventDefault();
				break;
			case "KeyS":
			case "ArrowDown":
				this.roamKeys.backward = true;
				event.preventDefault();
				break;
			case "KeyA":
			case "ArrowLeft":
				this.roamKeys.left = true;
				event.preventDefault();
				break;
			case "KeyD":
			case "ArrowRight":
				this.roamKeys.right = true;
				event.preventDefault();
				break;
			case "KeyQ":
				this.roamKeys.down = true;
				event.preventDefault();
				break;
			case "KeyE":
				this.roamKeys.up = true;
				event.preventDefault();
				break;
		}
	}

	private handleKeyUp(event: KeyboardEvent) {
		if (this.navigationMode !== "roam") return;

		switch (event.code) {
			case "KeyW":
			case "ArrowUp":
				this.roamKeys.forward = false;
				break;
			case "KeyS":
			case "ArrowDown":
				this.roamKeys.backward = false;
				break;
			case "KeyA":
			case "ArrowLeft":
				this.roamKeys.left = false;
				break;
			case "KeyD":
			case "ArrowRight":
				this.roamKeys.right = false;
				break;
			case "KeyQ":
				this.roamKeys.down = false;
				break;
			case "KeyE":
				this.roamKeys.up = false;
				break;
		}
	}

	private switchView(rotate: () => Promise<void>): Promise<THREE.PerspectiveCamera | THREE.OrthographicCamera> {
		return rotate()
			.then(() => {
				this.applyNavigationMode();
				return this.viewer.camera;
			})
			.catch(error => {
				this.applyNavigationMode();
				throw error;
			});
	}

	front() {
		return this.switchView(() => this.controls.rotateTo(0, Math.PI / 2, true));
	}

	rear() {
		return this.switchView(() => this.controls.rotateTo(Math.PI, Math.PI / 2, true));
	}

	left() {
		return this.switchView(() => this.controls.rotateTo(Math.PI / 2, Math.PI / 2, true));
	}

	right() {
		return this.switchView(() => this.controls.rotateTo(-Math.PI / 2, Math.PI / 2, true));
	}

	top() {
		return this.switchView(() => this.controls.rotatePolarTo(Math.PI, true));
	}

	bottom() {
		return this.switchView(() => this.controls.rotatePolarTo(0, true));
	}
}
