/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/8/22
 * @description 预览菜单操作
 */
import { useFullscreen } from "@vueuse/core";
import { IPreviewOperation, usePreviewOperationStoreWithOut } from "@/store/modules/previewOperation";
import * as THREE from "three";
import { App, Hooks, ClippedEdgesBox, Measure, MeasureMode, ModelExplode, Roaming, MiniMap } from "@astral3d/engine";
import { t } from "@/language";

const operationStore = usePreviewOperationStoreWithOut();

const { enter: enterFullscreen, exit: exitFullscreen } = useFullscreen();

let roamPdFn, pointerlockFn;

export class MenuOperation {
	// 初始化控制器状态
	static InitControlsState: string = "{}";

	// 开始漫游前的相机位置
	static lastRoadCameraPos = new THREE.Vector3();

	// 开始漫游前的相机目标位置
	static lastRoadCameraTarget = new THREE.Vector3();

	// 模型爆炸专用图层
	static explodeLayer = 10;

	// 当前爆炸的模型
	static explodeModel: THREE.Object3D | null = null;

	// 剖切盒子
	static _clippedEdgesBox: ClippedEdgesBox | null = null;

	// 测量类
	static _measure: Measure | null = null;

	// 爆炸类
	static _explode: ModelExplode | null = null;

	// 漫游类
	static _roaming: Roaming | null = null;

	// 小地图
	static _miniMap: MiniMap | null = null;

	static Init(key: string) {
		if (MenuOperation[key]) {
			MenuOperation[key]();
		} else {
			window.$message?.warning("相关模块正在开发中...");
		}
	}

	static get ClippedEdgesBox() {
		if (!MenuOperation._clippedEdgesBox) {
			MenuOperation._clippedEdgesBox = new ClippedEdgesBox(window.viewer);
		}

		return MenuOperation._clippedEdgesBox;
	}

	static get Measure(): Measure {
		if (!MenuOperation._measure) {
			MenuOperation._measure = new Measure(window.viewer, MeasureMode.Distance);

			MenuOperation._measure.addEventListener("complete", () => {
				if (!MenuOperation._measure) return;

				// 激活清除测量按钮
				if (!MenuOperation._measure.isClose && MenuOperation._measure.measureGroup.children.length > 0) {
					(<{ [key: string]: IPreviewOperation }>operationStore.menuList.measure.children).clearMeasure.disabled = false;
				}
			});
		}

		return MenuOperation._measure;
	}

	static get Explode(): ModelExplode {
		if (!MenuOperation._explode) {
			MenuOperation._explode = new ModelExplode();
		}

		return MenuOperation._explode;
	}

	static get Roaming(): Roaming {
		if (!MenuOperation._roaming) {
			MenuOperation._roaming = new Roaming(window.viewer);
		}

		return MenuOperation._roaming;
	}

	static get MiniMap(): MiniMap {
		if (!MenuOperation._miniMap) {
			MenuOperation._miniMap = new MiniMap(window.viewer, {
				mapSize: 160,
				mapRenderSize: 120,
				isShow: false,
			});
		}

		return MenuOperation._miniMap;
	}

	/**
	 * 还原视角
	 */
	static toHome() {
		if (MenuOperation.InitControlsState === "{}") {
			window.$message?.warning("缺失初始视角信息");
			return;
		}

		window.viewer.modules.controls.fromJSON(MenuOperation.InitControlsState, true);
	}

	/**
	 * 自动旋转
	 */
	static autoRotate() {
		operationStore.menuList.autoRotate.active = !operationStore.menuList.autoRotate.active;
	}

	/**
	 * 剖切
	 */
	static cutting() {
		operationStore.menuList.cutting.active = !operationStore.menuList.cutting.active;

		if (operationStore.menuList.cutting.active) {
			MenuOperation.ClippedEdgesBox.open();
		} else {
			MenuOperation.ClippedEdgesBox.close();
		}
	}

	// 测距
	static distance() {
		// 上一个测量也许未完成
		if (!MenuOperation.Measure.isCompleted) {
			MenuOperation.Measure.complete();
		}

		window.$message?.info(t("prompt['Left click to confirm the drawing point, and right click to complete the drawing.']"), {
			duration: 1500,
		});

		MenuOperation.Measure.mode = MeasureMode.Distance;
		MenuOperation.Measure.open();

		operationStore.menuList.measure.active = true;
	}

	// 测角度
	static angle() {
		if (!MenuOperation.Measure.isCompleted) {
			MenuOperation.Measure.complete();
		}

		window.$message?.info(t("prompt['Left click to confirm the drawing point, and right click to complete the drawing.']"), {
			duration: 1500,
		});

		MenuOperation.Measure.mode = MeasureMode.Angle;
		MenuOperation.Measure.open();

		operationStore.menuList.measure.active = true;
	}

	// 测面积
	static area() {
		if (!MenuOperation.Measure.isCompleted) {
			MenuOperation.Measure.complete();
		}

		window.$message?.info(t("prompt['Left click to confirm the drawing point, and right click to complete the drawing.']"), {
			duration: 1500,
		});

		MenuOperation.Measure.mode = MeasureMode.Area;
		MenuOperation.Measure.open();

		operationStore.menuList.measure.active = true;
	}

	// 清除测量结果
	static clearMeasure() {
		(<{ [key: string]: IPreviewOperation }>operationStore.menuList.measure.children).clearMeasure.disabled = true;

		MenuOperation.Measure.clear();

		operationStore.menuList.measure.active = false;
	}

	// 爆炸
	static explode() {
		if (!App.selected && !MenuOperation.explodeModel) {
			window.$message?.warning(t("prompt['No object selected.']"));
			return;
		}

		operationStore.menuList.explode.active = !operationStore.menuList.explode.active;

		if (operationStore.menuList.explode.active) {
			if (!App.selected) return;

			App.selected.traverse(obj => obj.layers.set(MenuOperation.explodeLayer));
			window.viewer.camera.layers.set(MenuOperation.explodeLayer);

			MenuOperation.Explode.explodeModel(App.selected, operationStore.explodeScalar);
			MenuOperation.explodeModel = App.selected;
		} else {
			if (!MenuOperation.explodeModel) return;

			MenuOperation.explodeModel.traverse(obj => obj.layers.set(0));
			window.viewer.camera.layers.set(0);

			MenuOperation.Explode.restore();

			MenuOperation.explodeModel = null;
		}
	}

	// 漫游
	static roaming() {
		if (!MenuOperation.Roaming) return;

		operationStore.menuList.roaming.active = !operationStore.menuList.roaming.active;

		if (operationStore.menuList.roaming.active) {
			MenuOperation.enterRoaming();
		} else {
			MenuOperation.leaveRoaming();
		}
	}

	// 选点进入漫游
	static enterRoaming() {
		window.$message?.info(t("preview.Please select initial position"));

		const canvas = window.viewer.renderer.domElement;

		const handlePointerDown = (e: MouseEvent) => {
			const raycaster = new THREE.Raycaster();

			const x = e.offsetX;
			const y = e.offsetY;
			const mouse = new THREE.Vector2();
			mouse.x = (x / canvas.offsetWidth) * 2 - 1;
			mouse.y = -(y / canvas.offsetHeight) * 2 + 1;

			raycaster.setFromCamera(mouse, window.viewer.camera);
			raycaster.firstHitOnly = true;

			const intersectObjects: THREE.Object3D[] = [MenuOperation.Roaming.group];
			let intersects = raycaster.intersectObjects(intersectObjects, true) || [];
			if (intersects && intersects.length > 0) {
				const intersect = intersects[0];

				// 锁定鼠标指针
				window.viewer.modules.controls.lockPointer();

				canvas.removeEventListener("pointerdown", roamPdFn);
				roamPdFn = undefined;

				window.viewer.modules.controls.getTarget(MenuOperation.lastRoadCameraTarget);
				window.viewer.modules.controls.getPosition(MenuOperation.lastRoadCameraPos);

				const point = new THREE.Vector3(intersect.point.x, intersect.point.y + 2, intersect.point.z);
				MenuOperation.Roaming.playerInitPos.copy(point);

				MenuOperation.Roaming.startRoaming();

				// 第三人称
				window.viewer.modules.controls.maxPolarAngle = Math.PI / 2;
				window.viewer.modules.controls.minDistance = 0.8;
				window.viewer.modules.controls.maxDistance = 0.8;
				window.viewer.modules.controls.distance = 0.8;

				Hooks.useDispatchSignal("sceneGraphChanged");
			}
			return null;
		};

		pointerlockFn = () => {
			if (document.pointerLockElement) {
				// console.log("指针被锁定到：", document.pointerLockElement);
			} else {
				// console.log("指针锁定状态现已解锁");
				MenuOperation.roaming();
			}
		};
		// 监听鼠标锁定取消
		document.addEventListener("pointerlockchange", pointerlockFn);

		// 监听选取初始位置
		roamPdFn = handlePointerDown.bind(this);
		canvas.addEventListener("pointerdown", roamPdFn);
	}

	// 退出漫游
	static leaveRoaming() {
		MenuOperation.Roaming.exitRoaming(MenuOperation.lastRoadCameraPos, MenuOperation.lastRoadCameraTarget);

		if (roamPdFn) {
			window.viewer.renderer.domElement.removeEventListener("pointerdown", roamPdFn);
			roamPdFn = null;
		}

		if (pointerlockFn) {
			document.removeEventListener("pointerlockchange", pointerlockFn);
			pointerlockFn = null;
		}
	}

	// 小地图
	static miniMap() {
		if (MenuOperation.MiniMap.isShow) {
			operationStore.menuList.miniMap.active = false;
			MenuOperation.MiniMap.close();
		} else {
			operationStore.menuList.miniMap.active = true;
			MenuOperation.MiniMap.open();
		}
	}

	// 设置
	static settings() {
		operationStore.menuList.settings.active = !operationStore.menuList.settings.active;
	}

	static fullscreen() {
		operationStore.menuList.fullscreen.show = false;
		operationStore.menuList.exitFullscreen.show = true;

		enterFullscreen();
	}

	static exitFullscreen() {
		operationStore.menuList.fullscreen.show = true;
		operationStore.menuList.exitFullscreen.show = false;

		exitFullscreen();
	}
}
