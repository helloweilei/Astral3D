---
lang: zh-CN
title: SDK 总览
createTime: 2026/06/09 00:00:00
---

# SDK 总览

Astral3D SDK 面向的是二次开发：你可以把它接进自己的页面，直接拿到一个可渲染、可编辑、可扩展的 Web3D 场景，也可以只使用其中的加载、命令、粒子、时间轴、DXF 或工具函数。

这份文档按 `@astral3d/engine` 能直接使用的能力整理。你可以从导入语句出发找到 API，也可以按“核心入口、模块、对象、工具、命令、扩展”的目录顺序阅读。

## Viewer

`Viewer` 是 SDK 最主要的渲染入口。它负责创建 WebGLRenderer、相机控制器、后处理、天气、粒子系统、拾取事件、脚本事件、CSS2D/CSS3D 渲染器和渲染循环。

```ts
import { Viewer } from '@astral3d/engine'

const viewer = new Viewer({
  container: document.querySelector('#viewer') as HTMLElement,
  grid: {
    enabled: true,
    color: 0x444444,
    row: 100,
    column: 100,
  },
  control: {
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    minDistance: 0,
    maxDistance: Infinity,
    maxPolarAngle: Math.PI,
    minPolarAngle: 0,
    maxZoom: Infinity,
    minZoom: 0,
    dollySpeed: 1,
    dollyToCursor: true,
  },
})
```

常用成员先记住这几个：

| 成员 | 类型 | 用途 |
| --- | --- | --- |
| `container` | `HTMLElement` | Viewer 挂载的容器。构造时没有传入时，SDK 会创建一个 `div`。 |
| `renderer` | `THREE.WebGLRenderer` | 主 WebGL 渲染器，负责渲染 three.js 场景。 |
| `camera` | `THREE.PerspectiveCamera` | 默认交互相机，来源于 `App.camera`。 |
| `scene` | `THREE.Scene` | 主场景，来源于 `App.scene`。 |
| `modules` | `ViewerModules` | 插件、相机、后处理、天气、粒子、拖拽等模块集合。 |
| `package` | `Package` | 场景分包打包与解包能力。 |

完整 API 见 [Viewer](./core/Viewer.md)。

## App

`App` 是 SDK 的全局场景状态中心。二次开发时通常直接使用 `App`，不需要自行创建实例。它持有场景、相机、材质、贴图、脚本、选择器、历史记录、工程配置和资源加载入口。

```ts
import { App, Box, AddObjectCommand } from '@astral3d/engine'

const box = Box()

App.execute(new AddObjectCommand(box))
App.select(box)
App.focus(box)
```

常用成员先记住这几个：

| 成员 | 类型 | 用途 |
| --- | --- | --- |
| `scene` | `THREE.Scene` | 主场景。新增业务对象通常最终会进入这里。 |
| `sceneHelpers` | `THREE.Scene` | 辅助对象场景，例如选择框、相机辅助、灯光辅助。 |
| `camera` | `THREE.PerspectiveCamera` | 默认主相机。 |
| `viewportCamera` | `THREE.Camera` | 当前视口实际使用的相机。 |
| `project` | `Project` | 工程配置与图纸状态。 |
| `history` | `History` | 命令历史，支撑撤销与重做。 |
| `resource` | `Resource` | 贴图等资源加载入口。 |
| `viewer` | `Viewer | null` | 当前 Viewer 实例，创建 Viewer 后赋值。 |

完整 API 见 [App](./core/App.md)。

## API 索引

下面是 SDK 常用导入能力的完整清单。文档后续页面按这些名字组织，方便你从导入语句直接定位。

| 分类 | API |
| --- | --- |
| 核心入口 | `Viewer`、`App`、`Preview`、`Loader`、`version` |
| App 模块 | `Config`、`CSM`、`History`、`Project`、`defaultProjectInfo`、`Resource`、`Selector`、`Storage` |
| Viewer 模块 | `Helper`、`CameraManage`、`Effect`、`LUTEffectMap`、`Weather`、`Terrain`、`Signals`、`ParticleSystem`、`Drag` |
| 常量 | `TYPED_ARRAYS`、`BASE64_TYPES`、`TEXTURE_MAPPING`、`TEXTURE_WRAPPING`、`TEXTURE_FILTER`、`POSITION`、`FPS_OPTIONS`、`ROAMING_CHARACTERS` |
| Utils 命名空间 | `Utils.deepAssign`、`Utils.deepEqual`、`Utils.debounce`、`Utils.throttle`、`Utils.getNestedProperty`、`Utils.escapeRegExp`、`Utils.getOsTheme`、`Utils.remToPxNumber`、`Utils.downloadBlob`、`Utils.saveArrayBuffer`、`Utils.saveString`、`Utils.IS_MAC`、`Utils.isNil`、`Utils.isEmptyObject`、`Utils.createDivContainer`、`Utils.parseMaterialZip`、`Utils.Stats`、`Utils.focusObject`、`Utils.focusObjectByDistance`、`Utils.getParentPath`、`Utils.getMousePosition`、`Utils.getMeshByInstancedMesh`、`Utils.isGroup`、`Utils.isParticleObject`、`Utils.isBillboardObject`、`Utils.isHtmlPanelObject`、`Utils.getAnimations`、`Utils.getAnimationClips`、`Utils.fetchController`、`Utils.injectWasm`、`Utils.ASTRAL_ZIP_READY_TIMEOUT`、`Utils.ASTRAL_ZIP_READY_INTERVAL`、`Utils.ASTRAL_ZIP_MAX_WORKERS`、`Utils.getAstralZipConstructor`、`Utils.waitAstralZipConstructor`、`Utils.getAstralZipWorkers`、`Utils.getAstralZipFile`、`Utils.readAstralZipText`、`Utils.readAstralZipArrayBuffer`、`Utils.readAstralZipBlob`、`Utils.SignalsRegister`、`Utils.SignalsRegisterFn`、`Utils.logger`、`Utils.ILog` |
| Hooks 命名空间 | `Hooks.useSignal`、`Hooks.useAddSignal`、`Hooks.useAddOnceSignal`、`Hooks.useDispatchSignal`、`Hooks.useRemoveSignal`、`Hooks.useSetSignalActive` |
| 内置基础对象 | `Group`、`Box`、`Capsule`、`Circle`、`Cylinder`、`Dodecahedron`、`Icosahedron`、`DoubleCone`、`Octahedron`、`Plane`、`Ring`、`Sphere`、`Sprite`、`Tetrahedron`、`Torus`、`TorusKnot`、`Tube`、`Teapot`、`AmbientLight`、`DirectionalLight`、`HemisphereLight`、`PointLight`、`Spotlight`、`OrthographicCamera`、`PerspectiveCamera` |
| 扩展对象 | `Billboard`、`getDefaultBillboardOptions`、`HtmlPanelConverter`、`HtmlPanel`、`HtmlSprite`、`ParticleEmitter`、`getDefaultParticleConfig`、`Particles` |
| 几何与材质 | `TeapotGeometry`、`CircleGridShaderMaterial`、`DynamicCheckerboardShaderMaterial`、`FlickerShaderMaterial`、`SlowSmokeShaderMaterial`、`SnowingShaderMaterial`、`StreamerWallShaderMaterial` |
| 工具类 | `Roaming`、`RoamingStatus`、`MiniMap`、`ClippedEdgesBox`、`Measure`、`MeasureMode`、`Export`、`ModelExplode` |
| 命令系统 | `AddObjectCommand`、`AddScriptCommand`、`MoveObjectCommand`、`RemoveObjectCommand`、`RemoveScriptCommand`、`SetColorCommand`、`SetGeometryCommand`、`SetGeometryValueCommand`、`SetMaterialColorCommand`、`SetMaterialCommand`、`SetMaterialMapCommand`、`SetMaterialRangeCommand`、`SetMaterialValueCommand`、`SetMaterialVectorCommand`、`SetPositionCommand`、`SetRotationCommand`、`SetScaleCommand`、`SetSceneCommand`、`SetScriptValueCommand`、`SetUuidCommand`、`SetValueCommand` |
| 时间轴 | `TimelineTrack`、`ITimelineKeyframe`、`ITimelineRow`、`ITimelineModel`、`Timeline.*` |
| 粒子库 | `Particle.*` |
| 脚本 | `Script.Animation`、`Script.Helper`、`Script.Source` |
| 点云 | `PointCloudReconstructor` |
| DXF | `DxfViewer`、`DxfParser`；解析结果结构见 DXF 章节 |
| 插件 | `Plugin` |

## 建议阅读顺序

1. 先读 [Viewer](./core/Viewer.md) 和 [App](./core/App.md)。这两个类决定 SDK 的数据流和生命周期。
2. 接着读 [Preview](./core/Preview.md)、[Loader](./core/Loader.md) 和 [Package](./core/Package.md)。它们负责资源预览、模型加载、场景包打包解包。
3. 常量和通用函数放在 [常量](./constants/)、[Utils 与 Hooks](./utils/)，写集成代码时会经常查。
4. 如果你要做编辑器能力，读 [命令系统](./commands/)、[工具类](./tools/)、[Timeline](./timeline/)。
5. 如果你要扩展对象或特效，读 [对象与内置资源](./objects/)、[材质与几何](./materials/)、[Particle](./particle/)。
6. 最后按需查 [脚本](./script/)、[DXF](./dxf/)、[点云](./point-cloud/) 和 [插件](./plugin/)。
