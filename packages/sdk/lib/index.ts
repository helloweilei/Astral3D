import App from "./core/app/App";
import Viewer from "./core/viewer/Viewer";
import Preview from "./core/preview/Preview";
import Loader from './core/loader/Loader';

// export * as THREE from "three";
// export * as THREEAddons from "three/examples/jsm/Addons.js";
// 导出App&Viewer下的所有模块，可提供于前端用作类型声明
export * from "./core/app/modules";
export * from "./core/viewer/modules";
export { version } from '../package.json';
export * from "./constant";
// 导出所有工具函数
export * as Utils from "./utils";
// 导出所有基础物体
export * from "./core/built-in/assets/BasicObject3D";
// 导出所有附加物体
export * from "./core/objects";
// 导出内置粒子
export * from "./core/built-in/assets/Particles";
// 导出内置几何形状
export * from "./core/geometries";
// 导出工具类(漫游、小地图、剖切)
export * from "./core/tools";
// 导出所有hooks
export * as Hooks from './hooks';
// 导出所有命令
export * from "./core/commands/Commands";
// 导出所有shader材质
export * from "./core/shaderMaterial/modules"
// 导出动画轨道生成器
export type {ITimelineKeyframe,ITimelineRow,ITimelineModel} from "./core/animation/TimelineTrack.ts";
export {TimelineTrack} from "./core/animation/TimelineTrack.ts";
export * as Timeline from "./core/libs/astral-timeline/animation-timeline";
export { KeyframeTrackFactory } from "./core/animation/AnimationManager.ts";
export {
	buildDayNightCyclePreset,
	setDayNightCycleRadius,
	setDayNightCycleSunSize,
	resolveAnimationRoot,
	enterDayNightCycle,
	exitDayNightCycle,
	syncDayNightEnvironment,
	restoreDayNightEnvironment,
	DAY_NIGHT_CLIP_NAME,
} from "./core/animation/presets/dayNightCycle.ts";
export type {
	DayNightCycleOptions,
	DayNightCyclePreset,
} from "./core/animation/presets/dayNightCycle.ts";
// 导出粒子库
export * as Particle from './core/libs/three-nebula/index.js';
// 导出脚本相关
export * as Script from "./core/script";

// 点云相关
export * from "./core/points";

// CAD相关
export {DxfViewer} from "./dxf";
export {DxfParser} from "./dxf/parser";

// 插件声明
export type {Plugin} from "./core/plugin/plugin";

export {
    App,
    Viewer,
    Preview,
    Loader
}