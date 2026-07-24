import * as THREE from "three";
import CameraControls from "camera-controls";
import Viewer from "../Viewer";

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

	constructor(viewer: Viewer, cameraControls: CameraControls) {
		this.viewer = viewer;
		this.controls = cameraControls;
		this.defaultControlOptions = { ...viewer.options.control };

		this.init();
	}

	init() {
		this.resetInteract();
	}

	/**
	 * 恢复默认交互限制
	 */
	resetInteract() {
		this.setInteract(this.defaultControlOptions);
	}

	/**
	 * 设置交互模式
	 */
	setInteract(config: Partial<IViewerControl>) {
		const opt = Object.assign({}, this.defaultControlOptions, config);

		Object.keys(opt).forEach(key => {
			if ((this.controls as unknown as Record<string, unknown>)[key] !== undefined) {
				(this.controls as unknown as Record<string, unknown>)[key] = opt[key as keyof IViewerControl];
			}
		});
	}

	private switchView(rotate: () => Promise<void>): Promise<THREE.PerspectiveCamera> {
		return rotate()
			.then(() => {
				this.resetInteract();
				return this.viewer.camera;
			})
			.catch(error => {
				this.resetInteract();
				throw error;
			});
	}

	/**
	 * 前视图
	 * @description 以z轴方向为正前方
	 */
	front() {
		return this.switchView(() => this.controls.rotateTo(0, Math.PI / 2, true));
	}

	/**
	 * 后视图
	 * @description -z方向
	 */
	rear() {
		return this.switchView(() => this.controls.rotateTo(Math.PI, Math.PI / 2, true));
	}

	/**
	 * 左视图
	 * @description -x方向
	 */
	left() {
		return this.switchView(() => this.controls.rotateTo(Math.PI / 2, Math.PI / 2, true));
	}

	/**
	 * 右视图
	 * @description x方向
	 */
	right() {
		return this.switchView(() => this.controls.rotateTo(-Math.PI / 2, Math.PI / 2, true));
	}

	/**
	 * 顶视图
	 * @description y方向
	 */
	top() {
		return this.switchView(() => this.controls.rotatePolarTo(Math.PI, true));
	}

	/**
	 * 底视图
	 * @description -y方向
	 */
	bottom() {
		return this.switchView(() => this.controls.rotatePolarTo(0, true));
	}
}
