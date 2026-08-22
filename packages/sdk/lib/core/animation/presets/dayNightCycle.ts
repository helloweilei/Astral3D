import * as THREE from "three";
import App from "@/core/app/App";
import { useDispatchSignal } from "@/hooks";
import { KeyframeTrackFactory } from "@/core/animation/AnimationManager";

export interface DayNightCycleOptions {
	/** 动画时长（秒），默认 48 */
	duration?: number;
	/** 太阳距场景中心的轨道半径，默认 200 */
	radius?: number;
	/** 太阳球体半径，默认 8 */
	sunSize?: number;
}

export interface DayNightCyclePreset {
	root: THREE.Group;
	action: THREE.AnimationAction;
	clip: THREE.AnimationClip;
	orbit: THREE.Group;
	sunMesh: THREE.Mesh;
	sunLight: THREE.DirectionalLight;
	ambient: THREE.AmbientLight;
}

export const DAY_NIGHT_CLIP_NAME = "昼夜交替";
const ORBIT_NAME = "太阳轨道";
const SUN_MESH_NAME = "太阳球体";
const SUN_LIGHT_NAME = "太阳光";
const AMBIENT_NAME = "环境光";

const DEFAULT_RADIUS = 200;
const DEFAULT_SUN_SIZE = 8;
const DEFAULT_DURATION = 48;

/**
 * 从选中节点向上找到挂有动画的昼夜交替根（或任意带动画的祖先）。
 */
export function resolveAnimationRoot(object: THREE.Object3D | null | undefined): THREE.Object3D | null {
	let current: THREE.Object3D | null | undefined = object;
	while (current) {
		if (current.userData?.isDayNightCycle) return current;
		if (current.animations && current.animations.length > 0) return current;
		current = current.parent;
	}
	return object ?? null;
}

/**
 * 调节太阳轨道距离（球体与平行光同步，不改球体尺寸）。
 */
export function setDayNightCycleRadius(root: THREE.Object3D, radius: number) {
	const r = Math.max(radius, 1);
	const mesh = root.getObjectByName(SUN_MESH_NAME) as THREE.Mesh | undefined;
	const light = root.getObjectByName(SUN_LIGHT_NAME) as THREE.DirectionalLight | undefined;

	if (mesh) mesh.position.set(r, 0, 0);
	if (light) {
		light.position.set(r, 0, 0);
		light.shadow.camera.far = r * 4;
		const extent = Math.max(r * 0.6, 40);
		light.shadow.camera.left = -extent;
		light.shadow.camera.right = extent;
		light.shadow.camera.top = extent;
		light.shadow.camera.bottom = -extent;
		light.shadow.camera.updateProjectionMatrix();
	}

	root.userData.dayNightRadius = r;
}

/**
 * 调节太阳球体视觉尺寸（几何半径）。
 */
export function setDayNightCycleSunSize(root: THREE.Object3D, size: number) {
	const s = Math.max(size, 0.1);
	const mesh = root.getObjectByName(SUN_MESH_NAME) as THREE.Mesh | undefined;
	if (mesh) {
		mesh.geometry.dispose();
		mesh.geometry = new THREE.SphereGeometry(s, 32, 32);
	}
	root.userData.dayNightSunSize = s;
}

/**
 * 开始驱动昼夜场景（播放或时间轴预览时调用）。
 */
export function enterDayNightCycle(root: THREE.Object3D) {
	if (!root.userData?.isDayNightCycle) return;
	root.userData.dayNightSceneActive = true;
}

/**
 * 按太阳光强度同步场景环境 / 背景强度，使 Viewport 与物体一起明暗变化。
 */
export function syncDayNightEnvironment(root: THREE.Object3D) {
	if (!root.userData?.isDayNightCycle) return;
	if (!root.userData.dayNightSceneActive) return;

	const light = root.getObjectByName(SUN_LIGHT_NAME) as THREE.DirectionalLight | undefined;
	if (!light) return;

	const scene = App.scene;
	if (!scene) return;

	const peak = root.userData.dayNightPeakIntensity ?? 1.8;
	const baseEnv = root.userData.baseEnvironmentIntensity ?? 1;
	const baseBg = root.userData.baseBackgroundIntensity ?? 1;
	const nightEnvMin = root.userData.dayNightEnvMin ?? 0.008;
	const nightBgMin = root.userData.dayNightBgMin ?? 0.05;
	const dayFactor = THREE.MathUtils.clamp(light.intensity / peak, 0, 1);
	// 用更高次方：日落后迅速压暗，深夜接近黑场
	const factor = Math.pow(dayFactor, 2);

	scene.environmentIntensity = THREE.MathUtils.lerp(nightEnvMin, baseEnv, factor);
	scene.backgroundIntensity = THREE.MathUtils.lerp(nightBgMin, baseBg, factor);

	// 纯色背景时再压一层颜色，避免仅靠 intensity 不够明显
	const bg = scene.background;
	if (bg && (bg as THREE.Color).isColor) {
		const baseColor = root.userData.baseBackgroundColor as THREE.Color | undefined;
		if (baseColor) {
			(bg as THREE.Color).copy(baseColor).multiplyScalar(THREE.MathUtils.lerp(nightBgMin, 1, factor));
		}
	}
}

function isAnimationAction(item: THREE.AnimationAction | THREE.AnimationClip): item is THREE.AnimationAction {
	return typeof (item as THREE.AnimationAction).getClip === "function";
}

function getDayNightAction(root: THREE.Object3D): THREE.AnimationAction | undefined {
	for (let i = root.animations.length - 1; i >= 0; i--) {
		const item = root.animations[i] as THREE.AnimationAction | THREE.AnimationClip;
		if (item && isAnimationAction(item)) {
			return item;
		}
	}
	return undefined;
}

/**
 * 退出昼夜动画：恢复场景环境/背景，并将太阳轨道回到第 0 帧。
 */
export function exitDayNightCycle(root: THREE.Object3D, action?: THREE.AnimationAction | null) {
	if (!root.userData?.isDayNightCycle) return;

	const act = action ?? getDayNightAction(root);
	if (act) {
		act.stop();
		act.reset();
		act.time = 0;
		act.getMixer().update(0);
	}

	root.userData.dayNightSceneActive = false;
	restoreDayNightEnvironment(root);
	useDispatchSignal("sceneGraphChanged");
}

/**
 * 恢复创建预设前记录的环境 / 背景强度。
 */
export function restoreDayNightEnvironment(root: THREE.Object3D) {
	if (!root.userData?.isDayNightCycle) return;
	const scene = App.scene;
	if (!scene) return;
	if (typeof root.userData.baseEnvironmentIntensity === "number") {
		scene.environmentIntensity = root.userData.baseEnvironmentIntensity;
	}
	if (typeof root.userData.baseBackgroundIntensity === "number") {
		scene.backgroundIntensity = root.userData.baseBackgroundIntensity;
	}
	const bg = scene.background;
	const baseColor = root.userData.baseBackgroundColor as THREE.Color | undefined;
	if (bg && (bg as THREE.Color).isColor && baseColor) {
		(bg as THREE.Color).copy(baseColor);
	}
}

/**
 * 构建「昼夜交替」预设：远处太阳球体绕场景旋转 + 平行光/环境光明暗变化。
 * 不添加地面或其它演示物体；阴影完全依赖用户场景中物体的投射/接收配置。
 */
export function buildDayNightCyclePreset(options: DayNightCycleOptions = {}): DayNightCyclePreset {
	const duration = options.duration ?? DEFAULT_DURATION;
	const R = Math.max(options.radius ?? DEFAULT_RADIUS, 1);
	const sunSize = Math.max(options.sunSize ?? DEFAULT_SUN_SIZE, 0.1);

	const root = new THREE.Group();
	root.name = DAY_NIGHT_CLIP_NAME;
	root.userData.dayNightRadius = R;
	root.userData.dayNightSunSize = sunSize;
	root.userData.isDayNightCycle = true;
	root.userData.dayNightPeakIntensity = 1.8;
	root.userData.dayNightEnvMin = 0.008;
	root.userData.dayNightBgMin = 0.05;
	root.userData.dayNightSceneActive = false;
	root.userData.baseEnvironmentIntensity = typeof App.scene?.environmentIntensity === "number" ? App.scene.environmentIntensity : 1;
	root.userData.baseBackgroundIntensity = typeof App.scene?.backgroundIntensity === "number" ? App.scene.backgroundIntensity : 1;
	const bg = App.scene?.background;
	if (bg && (bg as THREE.Color).isColor) {
		root.userData.baseBackgroundColor = (bg as THREE.Color).clone();
	}

	const orbit = new THREE.Group();
	orbit.name = ORBIT_NAME;

	const sunMesh = new THREE.Mesh(
		new THREE.SphereGeometry(sunSize, 32, 32),
		new THREE.MeshBasicMaterial({
			color: 0xffcc66,
			fog: false,
			toneMapped: false,
		})
	);
	sunMesh.name = SUN_MESH_NAME;
	sunMesh.position.set(R, 0, 0);
	sunMesh.castShadow = false;
	sunMesh.receiveShadow = false;

	const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.2);
	sunLight.name = SUN_LIGHT_NAME;
	sunLight.position.set(R, 0, 0);
	sunLight.userData.excludeHelper = true;
	sunLight.castShadow = true;
	sunLight.shadow.mapSize.set(2048, 2048);
	sunLight.shadow.bias = -0.0002;
	sunLight.shadow.normalBias = 0.02;
	sunLight.shadow.camera.near = 0.5;
	sunLight.shadow.camera.far = R * 4;
	const extent = Math.max(R * 0.6, 40);
	sunLight.shadow.camera.left = -extent;
	sunLight.shadow.camera.right = extent;
	sunLight.shadow.camera.top = extent;
	sunLight.shadow.camera.bottom = -extent;
	sunLight.target.position.set(0, 0, 0);
	sunLight.target.name = "太阳目标";
	sunLight.target.userData.excludeHelper = true;

	const ambient = new THREE.AmbientLight(0x6a6080, 0.12);
	ambient.name = AMBIENT_NAME;

	orbit.add(sunMesh);
	orbit.add(sunLight);
	root.add(orbit);
	root.add(sunLight.target);
	root.add(ambient);

	const times = [0, duration * 0.125, duration * 0.25, duration * 0.375, duration * 0.5, duration * 0.625, duration * 0.75, duration * 0.875, duration];

	const axis = new THREE.Vector3(0, 0, 1);
	const q = new THREE.Quaternion();
	const quatValues: number[] = [];
	times.forEach(t => {
		const angle = (t / duration) * Math.PI * 2;
		q.setFromAxisAngle(axis, angle);
		quatValues.push(q.x, q.y, q.z, q.w);
	});

	// 对比拉大：正午很亮，夜间接近熄灭（并配合 environmentIntensity 同步）
	const sunIntensities = [0.18, 0.85, 1.8, 1.05, 0.15, 0.008, 0.002, 0.03, 0.18];
	const sunColors = [
		1.0, 0.5, 0.28, 1.0, 0.82, 0.58, 1.0, 0.98, 0.94, 1.0, 0.88, 0.7, 1.0, 0.4, 0.2, 0.2, 0.25, 0.45, 0.08, 0.1, 0.22, 0.3, 0.28, 0.4, 1.0, 0.5, 0.28,
	];

	const ambientIntensities = [0.1, 0.28, 0.55, 0.32, 0.08, 0.012, 0.004, 0.03, 0.1];
	const ambientColors = [
		0.55, 0.4, 0.45, 0.65, 0.7, 0.82, 0.8, 0.85, 0.95, 0.65, 0.7, 0.82, 0.4, 0.3, 0.35, 0.08, 0.1, 0.2, 0.03, 0.04, 0.1, 0.12, 0.12, 0.2, 0.55, 0.4, 0.45,
	];

	const sunBallColors = [
		1.0, 0.5, 0.25, 1.0, 0.78, 0.42, 1.0, 0.95, 0.75, 1.0, 0.85, 0.5, 1.0, 0.38, 0.18, 0.3, 0.35, 0.55, 0.15, 0.18, 0.35, 0.55, 0.4, 0.32, 1.0, 0.5, 0.25,
	];

	const action = App.animationManager.createEmptyAnimation(DAY_NIGHT_CLIP_NAME, root);
	if (!action) {
		throw new Error("Failed to create day-night cycle animation");
	}

	const clip = action.getClip();
	clip.tracks.push(
		KeyframeTrackFactory(`${ORBIT_NAME}.quaternion`, times, quatValues),
		KeyframeTrackFactory(`${SUN_LIGHT_NAME}.intensity`, times, sunIntensities),
		KeyframeTrackFactory(`${SUN_LIGHT_NAME}.color`, times, sunColors),
		KeyframeTrackFactory(`${AMBIENT_NAME}.intensity`, times, ambientIntensities),
		KeyframeTrackFactory(`${AMBIENT_NAME}.color`, times, ambientColors),
		KeyframeTrackFactory(`${SUN_MESH_NAME}.material.color`, times, sunBallColors)
	);
	clip.resetDuration();

	const reclipped = App.animationManager.reClipAction(action, 0) as THREE.AnimationAction;
	reclipped.clampWhenFinished = false;
	reclipped.loop = THREE.LoopRepeat;

	root.userData.dayNightSceneActive = false;

	return {
		root,
		action: reclipped,
		clip: reclipped.getClip(),
		orbit,
		sunMesh,
		sunLight,
		ambient,
	};
}
