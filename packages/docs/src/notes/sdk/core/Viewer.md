---
lang: zh-CN
title: Viewer
createTime: 2026/06/09 00:00:00
---

# Viewer

`Viewer` 是 SDK 的渲染运行时。实例化它以后，SDK 会把 `App.scene`、`App.camera`、`App.sceneHelpers` 接到 WebGLRenderer 上，并初始化相机控制、后处理、天气、信号监听、粒子系统、拖拽控制、CSS2D/CSS3D 渲染器和脚本运行环境。

一个页面通常只创建一个 `Viewer`。如果你需要切换场景，优先使用 `App.fromJSON()`、`App.clear()`、`Loader` 或 `viewer.package`，不要频繁销毁重建 Viewer。

## 构造函数

```ts
new Viewer(options: IViewerSetting)
```

| 参数                   | 类型             | 必填 | 说明                                                                                          |
| ---------------------- | ---------------- | ---- | --------------------------------------------------------------------------------------------- |
| `options`              | `IViewerSetting` | 是   | Viewer 配置。SDK 会先取 `ViewerOptions()` 的默认值，再用传入配置做深度合并。                  |
| `options.container`    | `HTMLElement`    | 否   | 渲染器挂载容器。不传时 SDK 会创建一个 `div`，但业务页面一般应该显式传入。                     |
| `options.hdr`          | `string`         | 否   | 默认环境贴图地址。会通过 `App.resource.loadURLTexture()` 加载，并设置为 `scene.environment`。 |
| `options.edit`         | `IViewerEdit`    | 否   | 编辑态配置。控制辅助对象和 transform gizmo。                                                  |
| `options.enableScript` | `boolean`        | 否   | 是否启用场景脚本。启用后会安装对象脚本事件。                                                  |
| `options.request`      | `IViewerRequest` | 否   | 请求配置，目前只声明 `baseUrl?: string`。                                                     |
| `options.grid`         | `IViewerGrid`    | 是   | 网格配置。                                                                                    |
| `options.control`      | `IViewerControl` | 是   | 相机控制器限制配置。                                                                          |

### IViewerEdit

| 成员      | 类型      | 说明                                                            |
| --------- | --------- | --------------------------------------------------------------- |
| `enabled` | `boolean` | 是否启用编辑态。启用后会渲染辅助场景，并可开启 transform 控件。 |
| `helpers` | `boolean` | 是否显示辅助对象。实际显示逻辑主要由编辑态和辅助场景控制。      |
| `gizmo`   | `boolean` | 是否启用 `TransformControls`。                                  |

### IViewerGrid

| 成员      | 类型      | 说明                                                                   |
| --------- | --------- | ---------------------------------------------------------------------- | ------------ |
| `enabled` | `boolean` | 是否创建地面网格。                                                     |
| `color`   | `number   | string`                                                                | 网格线颜色。 |
| `row`     | `number`  | 网格尺寸。传给 `THREE.GridHelper(size, divisions, ...)` 的第一个参数。 |
| `column`  | `number`  | 网格分段数。                                                           |

### IViewerControl

| 成员              | 类型      | 说明                 |
| ----------------- | --------- | -------------------- |
| `minAzimuthAngle` | `number`  | 水平旋转最小角。     |
| `maxAzimuthAngle` | `number`  | 水平旋转最大角。     |
| `minDistance`     | `number`  | 透视相机最小距离。   |
| `maxDistance`     | `number`  | 透视相机最大距离。   |
| `maxPolarAngle`   | `number`  | 垂直旋转最大角。     |
| `minPolarAngle`   | `number`  | 垂直旋转最小角。     |
| `maxZoom`         | `number`  | 正交相机最大缩放。   |
| `minZoom`         | `number`  | 正交相机最小缩放。   |
| `dollySpeed`      | `number`  | 滚轮缩放速度。       |
| `dollyToCursor`   | `boolean` | 是否朝鼠标位置缩放。 |

## 公开成员

| 成员             | 类型                      | 说明                                                                         |
| ---------------- | ------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `container`      | `HTMLElement`             | Viewer 容器。构造后渲染器、CSS2DRenderer、CSS3DRenderer 都会插入这里。       |
| `options`        | `IViewerSetting`          | 合并后的 Viewer 配置。                                                       |
| `renderer`       | `THREE.WebGLRenderer`     | 主 WebGL 渲染器。由 `createEngine()` 创建，也可通过 `engineCreated()` 切换。 |
| `camera`         | `THREE.PerspectiveCamera` | 默认交互相机，等同于 `App.camera`。                                          |
| `scene`          | `THREE.Scene`             | 主场景，等同于 `App.scene`。                                                 |
| `sceneHelpers`   | `THREE.Scene`             | 辅助场景，等同于 `App.sceneHelpers`。                                        |
| `grid`           | `THREE.Group              | undefined`                                                                   | 网格对象组。`options.grid.enabled` 为真时创建。 |
| `box`            | `THREE.Box3`              | 当前选择框复用的包围盒。                                                     |
| `selectionBox`   | `THREE.Box3Helper`        | 选中对象的可视包围框。                                                       |
| `raycaster`      | `THREE.Raycaster`         | 拾取用射线。配合 BVH 加速时会优先返回首个命中。                              |
| `pmremGenerator` | `THREE.PMREMGenerator     | null`                                                                        | 环境贴图预过滤器。切换 renderer 时会释放。      |
| `pathtracer`     | `ViewerPathTracer         | undefined`                                                                   | 真实感模式下的路径追踪器。                      |
| `modules`        | `ViewerModules`           | Viewer 内部模块集合。                                                        |
| `package`        | `Package`                 | 场景包打包与解包实例。                                                       |
| `css2DRenderer`  | `CSS2DRenderer`           | CSS2D 标签渲染器。                                                           |
| `css3DRenderer`  | `CSS3DRenderer`           | CSS3D 面板渲染器。                                                           |
| `timer`          | `Timer`                   | three.js Timer，用于动画 delta。                                             |
| `sceneBox3`      | `THREE.Box3`              | 整个场景的包围盒缓存。通过 `computedSceneBox3()` 更新。                      |

## ViewerModules

| 成员                    | 类型                    | 说明                                                  |
| ----------------------- | ----------------------- | ----------------------------------------------------- | ---------------------------- |
| `plugin`                | `PluginManager`         | 插件注册、运行、卸载。                                |
| `viewHelper`            | `Helper`                | 视角小助手，负责 gizmo 渲染和视角切换 UI 的底层能力。 |
| `cameraManage`          | `CameraManage`          | 前后左右顶底视图切换与交互模式设置。                  |
| `controls`              | `CameraControls`        | camera-controls 实例。                                |
| `transformControls`     | `TransformControls      | undefined`                                            | 编辑态位移、旋转、缩放控件。 |
| `effect`                | `Effect`                | 后处理管理器。                                        |
| `weather`               | `Weather`               | 雾、雨、雪效果管理器。                                |
| `registerSignal`        | `Signals`               | Viewer 与全局 signal 的绑定层。                       |
| `shaderMaterialManager` | `ShaderMaterialManager` | Shader 材质更新管理器。                               |
| `particleSystem`        | `ParticleSystem`        | three-nebula 粒子系统桥接层。                         |
| `dragControl`           | `Drag`                  | 对象拖拽控制。                                        |

## 访问器

| API            | 类型                                  | 说明                                                                                                      |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `edit`         | `get IViewerEdit` / `set IViewerEdit` | 读取或更新编辑态配置。设置 `gizmo` 时会创建或销毁 `TransformControls`，并触发一次渲染。                   |
| `enableScript` | `get boolean` / `set boolean`         | 读取或切换脚本运行状态。设为 `true` 时调用 `installScripts()`，设为 `false` 时调用 `unInstallScripts()`。 |

## 方法

| API                                        | 参数                                                                      | 返回值                                           | 说明                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `createEngine()`                           | 无                                                                        | `THREE.WebGLRenderer`                            | 按 `App.project.renderer` 创建默认渲染器，设置色彩空间、toneMapping、阴影、XR。                                      |
| `engineCreated(newRenderer)`               | `newRenderer: THREE.WebGLRenderer`                                        | `void`                                           | 接管新渲染器。旧渲染器会停止动画循环、释放 renderer、释放 PMREM、断开 controls、移除 DOM、释放 viewHelper。          |
| `initGrid()`                               | 无                                                                        | `void`                                           | 创建或重建网格。旧网格子对象会调用 `dispose()` 后清空。                                                              |
| `initModules()`                            | 无                                                                        | `ViewerModules`                                  | 创建插件、视角辅助、相机管理、后处理、天气、信号、Shader、粒子、拖拽模块。编辑态启用时还会创建 `TransformControls`。 |
| `loadEnv(setBg, onLoad, onError)`          | `setBg = true`；`onLoad?: (texture) => void`；`onError?: (error) => void` | `void`                                           | 加载 `options.hdr`。成功后设为环境贴图，`setBg` 为真时也设为背景。                                                   |
| `initEvent()`                              | 无                                                                        | `void`                                           | 给容器绑定 pointer、touch、dblclick 事件。                                                                           |
| `installScripts(uuids, filterName)`        | `uuids?: string                                                           | string[]`；`filterName = ''`                     | `void`                                                                                                               | 安装场景脚本。传 `uuids` 时只热更新指定对象脚本；传 `filterName` 时只处理同名脚本。 |
| `uninstallScriptsByUuid(uuid, filterName)` | `uuid: string`；`filterName = ''`                                         | `void`                                           | 卸载指定对象上的脚本事件监听。                                                                                       |
| `unInstallScripts()`                       | 无                                                                        | `void`                                           | 卸载全部脚本事件，并移除全局键盘监听。                                                                               |
| `loadOfflineScene()`                       | 无                                                                        | `void`                                           | 离线场景包加载入口。接入离线包时可围绕它扩展加载流程。                                                               |
| `computedSceneBox3()`                      | 无                                                                        | `void`                                           | 用 `sceneBox3.setFromObject(this.scene)` 计算整场景包围盒。                                                          |
| `updateAspectRatio()`                      | 无                                                                        | `void`                                           | 按容器尺寸更新 `App.cameras` 内所有相机的投影矩阵，并同步相机辅助对象。                                              |
| `getIntersects(point)`                     | `point: THREE.Vector2`，坐标范围按容器归一化处理                          | `THREE.Intersection[]`                           | 对主场景、辅助 picker、粒子代理做射线拾取。若 `App.locked` 存在，只拾取锁定对象相关内容。                            |
| `handleClick()`                            | 无                                                                        | `void`                                           | 根据 pointer down/up 位置判断单击，派发 `intersectionsDetected` signal 和 `onPick` 事件。                            |
| `onPointerDown(event)`                     | `event: PointerEvent`                                                     | `void`                                           | 记录按下位置、派发 `onPointerDown`，并给 document 绑定 pointerup。                                                   |
| `onPointerUp(event)`                       | `event: PointerEvent`                                                     | `void`                                           | 记录抬起位置、触发点击处理、移除 document pointerup。                                                                |
| `onPointerMove(event)`                     | `event: PointerEvent`                                                     | `void`                                           | 派发 `onPointerMove`。                                                                                               |
| `onTouchStart(event)`                      | `event: TouchEvent`                                                       | `void`                                           | 记录触屏起点、派发 `onTouchStart`，并监听 touchend。                                                                 |
| `onTouchEnd(event)`                        | `event: TouchEvent`                                                       | `void`                                           | 记录触屏终点、触发点击处理、移除 touchend。                                                                          |
| `onDoubleClick(event)`                     | `event: PointerEvent`                                                     | `void`                                           | 双击拾取对象，派发 `objectFocused` signal 和 `onDoubleClick` 事件。                                                  |
| `animate()`                                | 无                                                                        | `void`                                           | 主动画循环。按 `App.singleFrameTime` 限帧，更新动画、相机、天气、Shader、粒子、拖拽和路径追踪。                      |
| `initPT()`                                 | 无                                                                        | `void`                                           | `App.viewportShading === 'realistic'` 时初始化路径追踪。                                                             |
| `updatePTBackground()`                     | 无                                                                        | `void`                                           | 真实感模式下更新路径追踪背景。                                                                                       |
| `updatePTEnvironment()`                    | 无                                                                        | `void`                                           | 真实感模式下更新路径追踪环境。                                                                                       |
| `updatePTMaterials()`                      | 无                                                                        | `void`                                           | 真实感模式下更新路径追踪材质。                                                                                       |
| `updatePT()`                               | 无                                                                        | `void`                                           | 真实感模式下推进路径追踪采样，并派发 `pathTracerUpdated`。                                                           |
| `render(delta)`                            | `delta?: number`                                                          | `void`                                           | 渲染一帧。会派发 `beforeRender`、`afterRender`，并通过 `sceneRendered` signal 输出帧耗时。                           |
| `dispose()`                                | 无                                                                        | `void`                                           | 销毁 Viewer。会派发 `beforeDestroy`、`afterDestroy`，解绑容器事件，调用各模块 `dispose()`，并卸载脚本。              |
| `addParticle(emitter, body, name)`         | `emitter: Particle.Emitter`；`body: THREE.Sprite                          | THREE.Mesh`；`name = 'Particles'`                | `void`                                                                                                               | 创建 `ParticleEmitter` 代理对象，注册粒子 body，并通过命令加入场景。                |
| `getViewportImage()`                       | 无                                                                        | `Promise<{image: HTMLImageElement, blob: Blob}>` | 截取当前画布。内部临时开启 `preserveDrawingBuffer`，渲染后生成图片对象。                                             |

## 事件

`Viewer` 继承 `THREE.EventDispatcher<ViewerEventMap>`，可以使用 `addEventListener()` / `removeEventListener()` 监听。

| 事件名                     | 参数                                                      | 触发时机                                          |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `loaded`                   | `{}`                                                      | 场景脚本 loaded 事件，安装脚本后使用。            |
| `beforeAnimation`          | `{ delta: number }`                                       | 每轮动画更新前。                                  |
| `afterAnimation`           | `{ delta: number, toBeRender: (_need: boolean) => void }` | 每轮动画更新后。回调里可强制本轮渲染。            |
| `beforeRender`             | `{ delta: number }`                                       | 每次实际渲染前。                                  |
| `afterRender`              | `{ delta: number }`                                       | 每次实际渲染后。                                  |
| `beforeDestroy`            | `{}`                                                      | `dispose()` 开始时。                              |
| `afterDestroy`             | `{}`                                                      | `dispose()` 模块释放后。                          |
| `onPick`                   | `{ intersect, object }`                                   | 单击命中对象。`object` 会还原代理对象的真实目标。 |
| `onDoubleClick`            | `{ intersect, object }`                                   | 双击命中对象。                                    |
| `onKeyDown`                | `{ event: KeyboardEvent }`                                | 脚本启用后，全局键盘按下。                        |
| `onKeyUp`                  | `{ event: KeyboardEvent }`                                | 脚本启用后，全局键盘抬起。                        |
| `onPointerDown`            | `{ event: PointerEvent }`                                 | 容器 pointerdown。                                |
| `onPointerUp`              | `{ event: PointerEvent }`                                 | document pointerup。                              |
| `onPointerMove`            | `{ event: PointerEvent }`                                 | 容器 pointermove。                                |
| `onTouchStart`             | `{ event: TouchEvent }`                                   | 容器 touchstart。                                 |
| `onTouchEnd`               | `{ event: TouchEvent }`                                   | document touchend。                               |
| `onSceneBackgroundChange`  | `{ backgroundType, background }`                          | 场景背景变更后。                                  |
| `onSceneEnvironmentChange` | `{ environmentType, environment }`                        | 场景环境变更后。                                  |

## Viewer 模块 API

### Helper

视角辅助模块，内部使用 `three-viewport-gizmo`。

| API                             | 参数                                         | 返回值         | 说明                           |
| ------------------------------- | -------------------------------------------- | -------------- | ------------------------------ |
| `constructor(viewer, controls)` | `viewer: Viewer`；`controls: CameraControls` | `Helper`       | 绑定 Viewer 和相机控制器。     |
| `animating`                     | 无                                           | `boolean`      | 当前视角辅助是否正在动画切换。 |
| `hidden`                        | `boolean`                                    | `void`         | 设置视角辅助是否隐藏。         |
| `init()`                        | 无                                           | `void`         | 初始化 gizmo。                 |
| `initEvent()`                   | 无                                           | `void`         | 注册全局 signal 事件。         |
| `initDomEvent()`                | 无                                           | `void`         | 注册 gizmo DOM 事件。          |
| `getGizmoConfig(type)`          | `type?: string`                              | `GizmoOptions` | 按类型获取 gizmo 配置。        |
| `setConfig()`                   | 无                                           | `void`         | 根据主色和明暗主题刷新外观。   |
| `update()`                      | 无                                           | `void`         | 更新 gizmo 状态。              |
| `render()`                      | 无                                           | `void`         | 渲染 gizmo。                   |
| `dispose()`                     | 无                                           | `void`         | 释放 gizmo 和相关监听。        |

### CameraManage

相机视角管理模块。

| API                                   | 参数                                               | 返回值             | 说明                         |
| ------------------------------------- | -------------------------------------------------- | ------------------ | ---------------------------- |
| `constructor(viewer, cameraControls)` | `viewer: Viewer`；`cameraControls: CameraControls` | `CameraManage`     | 绑定 Viewer 与 controls。    |
| `options`                             | `{}`                                               | `{}`               | 默认交互相机参数缓存。       |
| `init()`                              | 无                                                 | `void`             | 初始化控制器配置。           |
| `setInteract(config)`                 | `config: any`                                      | `void`             | 设置相机交互模式或控制参数。 |
| `front()`                             | 无                                                 | `Promise<unknown>` | 切到前视图，按 z 轴正方向。  |
| `rear()`                              | 无                                                 | `Promise<unknown>` | 切到后视图。                 |
| `left()`                              | 无                                                 | `Promise<unknown>` | 切到左视图。                 |
| `right()`                             | 无                                                 | `Promise<unknown>` | 切到右视图。                 |
| `top()`                               | 无                                                 | `Promise<unknown>` | 切到顶视图。                 |
| `bottom()`                            | 无                                                 | `Promise<unknown>` | 切到底视图。                 |

### Effect

后处理模块。它按工程配置启用或禁用各类 Pass。

| 成员          | 类型                       | 说明                         |
| ------------- | -------------------------- | ---------------------------- | --------------- |
| `composer`    | `EffectComposer            | undefined`                   | 后处理合成器。  |
| `outlinePass` | `OutlinePass               | undefined`                   | 选中描边 Pass。 |
| `PassMap`     | `Map<string, supportPass>` | 静态 Pass 缓存，按名称复用。 |
| `enabled`     | `get any`                  | 是否启用后处理。             |

| API                                    | 参数                          | 返回值                | 说明                           |
| -------------------------------------- | ----------------------------- | --------------------- | ------------------------------ | ----------------------- |
| `constructor(viewer)`                  | `viewer: Viewer`              | `Effect`              | 绑定 Viewer。                  |
| `createComposer()`                     | 无                            | `void`                | 创建后处理合成器。             |
| `FXAA`                                 | 无                            | `ShaderPass           | null`                          | 获取 FXAA 抗锯齿 Pass。 |
| `UnrealBloom`                          | 无                            | `UnrealBloomPass`     | 获取辉光 Pass。                |
| `Bokeh`                                | 无                            | `BokehPass`           | 获取背景虚化 Pass。            |
| `Pixelate`                             | 无                            | `RenderPixelatedPass` | 获取像素风 Pass。              |
| `Halftone`                             | 无                            | `HalftonePass`        | 获取半色调 Pass。              |
| `LUT`                                  | 无                            | `LUTPass`             | 获取 LUT 调色 Pass。           |
| `Afterimage`                           | 无                            | `AfterimagePass`      | 获取运动残影 Pass。            |
| `handlePassConfigChange(name, config)` | `name: string`；`config: any` | `void`                | 更新指定 Pass 配置。           |
| `getPassConfigValue(key, value)`       | `key: string`；`value: any`   | `any`                 | 将配置值转换为 Pass 可用的值。 |
| `render(deltaTime)`                    | `deltaTime: number`           | `void`                | 使用 composer 渲染。           |
| `clear()`                              | 无                            | `void`                | 清理 Pass 状态。               |
| `dispose()`                            | 无                            | `void`                | 释放 composer 与 Pass。        |

`LUTEffectMap` 是 SDK 内置 LUT 资源名映射，包含 `Bourbon 64.CUBE`、`Chemical 168.CUBE`、`Clayton 33.CUBE`、`Cubicle 99.CUBE`、`Remy 24.CUBE`、`Presetpro-Cinematic.3dl`、`NeutralLUT.png`、`B&WLUT.png`、`NightLUT.png`。

### Weather

天气模块负责雾、雨、雪和积雪材质替换。

| 成员                 | 类型           | 说明                       |
| -------------------- | -------------- | -------------------------- | -------------- |
| `rain`               | `Rain          | null`                      | 下雨效果对象。 |
| `snow`               | `Snow          | null`                      | 下雪效果对象。 |
| `snowingMaterialObj` | `THREE.Mesh[]` | 已替换积雪材质的网格列表。 |

| API                          | 参数             | 返回值    | 说明                                       |
| ---------------------------- | ---------------- | --------- | ------------------------------------------ |
| `constructor(viewer)`        | `viewer: Viewer` | `Weather` | 绑定 Viewer。                              |
| `objectAdded(object)`        | `object: any`    | `void`    | 新对象加入场景时，必要时参与积雪材质处理。 |
| `sceneFogSettingsChanged()`  | 无               | `void`    | 按工程配置更新雾效。                       |
| `sceneRainSettingsChanged()` | 无               | `void`    | 按工程配置创建、更新或关闭雨效。           |
| `replaceSnowMaterial(obj)`   | `obj: any`       | `void`    | 替换对象材质，使其支持雪堆积。             |
| `initSnowMap()`              | 无               | `void`    | 初始化全场景积雪贴图替换。                 |
| `removeSnowMap()`            | 无               | `void`    | 关闭雪效并还原材质。                       |
| `sceneSnowSettingsChanged()` | 无               | `void`    | 按工程配置更新雪效。                       |
| `update(deltaTime)`          | `deltaTime: any` | `boolean` | 更新天气，返回本帧是否需要重新渲染。       |
| `dispose()`                  | 无               | `void`    | 释放雨雪对象和材质替换状态。               |

### Signals

Signals 是 Viewer 对全局 signal 的响应层。业务代码更常通过 `Hooks` 派发信号，但理解这些方法有助于判断 UI 改配置后会发生什么。

| API                                                                           | 参数                                                                                                                                                  | 返回值       | 说明                                   |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------- | ------------------------------------------------------------------ | ------ | ------------------ |
| `constructor(viewer)`                                                         | `viewer: Viewer`                                                                                                                                      | `Signals`    | 绑定 Viewer。                          |
| `init()`                                                                      | 无                                                                                                                                                    | `void`       | 注册 signal 监听。                     |
| `objectIsCanPick(object)`                                                     | `object: THREE.Object3D                                                                                                                               | null`        | `boolean`                              | 判断对象是否允许被射线拾取。                                       |
| `sceneCleared()`                                                              | 无                                                                                                                                                    | `void`       | 场景清空后的渲染状态复位。             |
| `transformModeChanged(mode)`                                                  | `mode: any`                                                                                                                                           | `void`       | 切换 transform 控件模式。              |
| `snapChanged(dist)`                                                           | `dist: number`                                                                                                                                        | `void`       | 修改 transform 吸附距离。              |
| `spaceChanged(space)`                                                         | `space: 'world'                                                                                                                                       | 'local'`     | `void`                                 | 修改 transform 坐标系。                                            |
| `effectEnabledChange(enabled)`                                                | `enabled: boolean`                                                                                                                                    | `void`       | 启用或禁用后处理。                     |
| `rendererUpdated()`                                                           | 无                                                                                                                                                    | `void`       | 渲染器更新后的处理。                   |
| `rendererCreated(newRenderer)`                                                | `newRenderer: THREE.WebGLRenderer`                                                                                                                    | `void`       | 渲染器创建完成后的处理。               |
| `rendererConfigUpdate()`                                                      | 无                                                                                                                                                    | `void`       | 按工程配置刷新 renderer。              |
| `rendererDetectKTX2Support(ktx2Loader)`                                       | `ktx2Loader: any`                                                                                                                                     | `void`       | 让 KTX2Loader 检测当前 renderer 支持。 |
| `sceneBackgroundChanged(...)`                                                 | `backgroundType, backgroundColor, backgroundTexture, backgroundEquirectangularTexture, backgroundBlurriness, backgroundIntensity, backgroundRotation` | `void`       | 更新场景背景。                         |
| `sceneEnvironmentChanged(environmentType, environmentEquirectangularTexture)` | `environmentType: ''                                                                                                                                  | 'Background' | 'Equirectangular'                      | 'ModelViewer'`；`environmentEquirectangularTexture: THREE.Texture` | `void` | 更新场景环境贴图。 |
| `sceneGraphChanged()`                                                         | 无                                                                                                                                                    | `void`       | 手动触发场景渲染。                     |
| `cameraChanged()`                                                             | 无                                                                                                                                                    | `void`       | 相机控制器更新后的处理。               |
| `viewportCameraChanged()`                                                     | 无                                                                                                                                                    | `void`       | 当前视口相机切换后的处理。             |
| `viewportShadingChanged()`                                                    | 无                                                                                                                                                    | `void`       | 切换渲染模式。                         |
| `objectSelected(object)`                                                      | `object: any`                                                                                                                                         | `void`       | 对象选中后的处理。                     |
| `objectFocused(object)`                                                       | `object: any`                                                                                                                                         | `void`       | 对象聚焦后的处理。                     |
| `objectAdded()`                                                               | 无                                                                                                                                                    | `void`       | 对象新增后的处理。                     |
| `objectChanged(object)`                                                       | `object: any`                                                                                                                                         | `void`       | 对象属性变更后的处理。                 |
| `objectRemoved(object)`                                                       | `object: any`                                                                                                                                         | `void`       | 对象移除后的处理。                     |
| `geometryChanged(object)`                                                     | `object: any`                                                                                                                                         | `void`       | 几何变更后的处理。                     |
| `materialChanged()`                                                           | 无                                                                                                                                                    | `void`       | 材质变更后的处理。                     |
| `sceneResize()`                                                               | 无                                                                                                                                                    | `void`       | 容器尺寸变化后的处理。                 |
| `showGridChanged(showGrid)`                                                   | `showGrid: boolean`                                                                                                                                   | `void`       | 显示或隐藏网格。                       |
| `scriptAdded(object, script)`                                                 | `object: THREE.Object3D`；`script: ISceneScript`                                                                                                      | `void`       | 对象脚本新增后的热更新。               |
| `scriptRemoved(object, script)`                                               | `object: THREE.Object3D`；`script: ISceneScript`                                                                                                      | `void`       | 对象脚本删除后的热更新。               |
| `scriptChanged(attributeName, object, script)`                                | `attributeName: string`；`object: THREE.Object3D`；`script: ISceneScript`                                                                             | `void`       | 对象脚本属性变更后的热更新。           |
| `render()`                                                                    | 无                                                                                                                                                    | `void`       | 触发 Viewer 渲染。                     |

### ParticleSystem

| 成员             | 类型                      | 说明                           |
| ---------------- | ------------------------- | ------------------------------ | ----------------------------------------------- |
| `particlesGroup` | `THREE.Group`             | 粒子代理对象统一挂载组。       |
| `spriteRenderer` | `Particle.SpriteRenderer` | Sprite 粒子渲染器。            |
| `meshRenderer`   | `Particle.MeshRenderer`   | Mesh 粒子渲染器。              |
| `spriteSystem`   | `Particle.System`         | Sprite 粒子系统。              |
| `meshSystem`     | `Particle.System`         | Mesh 粒子系统。                |
| `PointBody`      | `THREE.Points`            | 静态 Point 粒子 body。         |
| `Body3DMap`      | `Map<string, THREE.Sprite | THREE.Mesh>`                   | 静态 body 映射，key 是 `ParticleEmitter.uuid`。 |
| `needsUpdate`    | `boolean`                 | 本帧粒子是否要求 Viewer 渲染。 |

| API                                                               | 参数                                                               | 返回值   | 说明                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ | -------- | ---------------------------------------------------------------- | ------------------------ | ---------------------------------------- |
| `constructor(viewer)`                                             | `viewer: Viewer                                                    | Preview` | `ParticleSystem`                                                 | 绑定 Viewer 或 Preview。 |
| `initEvent()`                                                     | 无                                                                 | `void`   | 注册粒子相关 signal。                                            |
| `handleAddEmitter(emitter)`                                       | `emitter: Particle.Emitter`                                        | `void`   | 添加 emitter 到系统。                                            |
| `handleObjectRemoved(object)`                                     | `object: any`                                                      | `void`   | 对象移除时清理粒子引用。                                         |
| `handleObjectAdded(object)`                                       | `object: any`                                                      | `void`   | redo 或导入对象时恢复粒子系统关系。                              |
| `handleParticleBodyChanged(data, object3D, isObjectChange, done)` | `data: IParticle.Config['init']['body']`；`object3D: THREE.Texture | string   | THREE.Mesh`；`isObjectChange?: boolean`；`done?: (data) => void` | `void`                   | 替换粒子 body，可以是贴图、URL 或 Mesh。 |
| `handleEmitterAdd(emitter, system)`                               | `emitter: Particle.Emitter`；`system?: string`                     | `void`   | 将 emitter 加入指定粒子系统。                                    |
| `update(delta)`                                                   | `delta: number`                                                    | `void`   | 更新粒子系统。                                                   |
| `dispose()`                                                       | 无                                                                 | `void`   | 释放粒子系统和渲染器。                                           |

### Drag

| 成员              | 类型               | 说明                     |
| ----------------- | ------------------ | ------------------------ | ------------------------------------ |
| `_dragObjects`    | `THREE.Object3D[]` | 当前允许拖拽的对象集合。 |
| `dragControls`    | `any`              | 拖拽控制器实例。         |
| `viewer`          | `Viewer`           | 绑定的 Viewer。          |
| `measureInstance` | `Measure           | null`                    | 测量工具实例，拖拽时会避让测量交互。 |
| `isDragging`      | `boolean`          | 当前是否正在拖拽。       |

| API                                   | 参数                                      | 返回值 | 说明                   |
| ------------------------------------- | ----------------------------------------- | ------ | ---------------------- | ------ | ---------------------------- |
| `constructor(viewer)`                 | `viewer: Viewer`                          | `Drag` | 初始化拖拽控制。       |
| `domElement`                          | `set HTMLElement`                         | `void` | 设置拖拽监听 DOM。     |
| `setMeasureInstance(measureInstance)` | `measureInstance: Measure`                | `void` | 绑定测量工具。         |
| `setDragObjects(objects, type)`       | `objects: THREE.Object3D[]`；`type?: 'eq' | 'push' | 'remove'`              | `void` | 设置、追加或移除可拖拽对象。 |
| `dragControlsStart(e)`                | `e: any`                                  | `void` | 拖拽开始回调。         |
| `drag(e)`                             | `e: any`                                  | `void` | 拖拽过程回调。         |
| `dragControlsEnd(e)`                  | `e: any`                                  | `void` | 拖拽结束回调。         |
| `clickblank(e)`                       | `e: any`                                  | `void` | 空白区域点击回调。     |
| `dispose()`                           | 无                                        | `void` | 释放拖拽控制器和监听。 |

## 生命周期建议

`Viewer.dispose()` 只释放 Viewer 自己持有的事件、模块和渲染器关系，不等价于清空 `App.scene`。如果你是关闭页面或卸载组件，先调用 `viewer.dispose()`，再根据业务需要调用 `App.clear()` 释放场景状态。不要在渲染循环里创建材质、几何、贴图或 Pass；这些都应该在加载或配置变更时创建，在对应 `dispose()` 或场景清理路径释放。
