---
lang: zh-CN
title: 工具类
createTime: 2026/06/09 00:00:00
---

# 工具类

工具类通常直接接入 `Viewer`，会创建 DOM、事件监听、Worker、几何或临时材质。用完要调用对应的关闭或释放方法。

## Roaming

`Roaming` 是漫游工具，使用 BVH 做碰撞检测。人物模型需要包含 `Enter`、`Idle`、`Walking`、`WalkingBackward`、`Jumping` 这些动画。

### 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `group` | `THREE.Group` | 漫游工具对象组。 |
| `person` | `THREE.Group | undefined` | 漫游人物模型。 |
| `playerInitPos` | `THREE.Vector3` | 玩家初始位置。 |
| `isRoaming` | `boolean` | 当前是否处于漫游状态。 |
| `mergeWorker` | `Worker` | 合并几何 Worker。 |
| `viewer`、`controls`、`collider`、`player`、`personStatus` 等 | 运行态引用 | 漫游运行状态，业务不应直接依赖。 |

### 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer` | `Roaming` | 绑定 Viewer 并初始化漫游状态。 |
| `keyDown(e)` | `e: KeyboardEvent` | `void` | 处理漫游按键按下。 |
| `keyUp(e)` | `e: KeyboardEvent` | `void` | 处理漫游按键抬起。 |
| `addPlayer()` | 无 | `void` | 添加玩家碰撞体或人物对象。 |
| `reloadPerson()` | 无 | `Promise<void>` | 重新加载漫游人物模型。 |
| `generateColliderEnvironment()` | 无 | `Promise<unknown>` | 生成碰撞环境。 |
| `resetPlayer()` | 无 | `void` | 重置玩家状态与位置。 |
| `startRoaming()` | 无 | `void` | 开始漫游。 |
| `exitRoaming(lastRoadCameraPos, lastRoadCameraTarget)` | `lastRoadCameraPos?: THREE.Vector3`；`lastRoadCameraTarget?: THREE.Vector3` | `void` | 退出漫游，可恢复退出前相机位置和目标。 |
| `render(delta)` | `delta: number` | `void` | 每帧更新漫游状态。 |
| `dispose()` | 无 | `void` | 停止漫游、释放 Worker 和事件监听。 |

## RoamingStatus

`RoamingStatus` 是漫游人物动画状态机。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `keyDownStatus` | `{ w, s, a, d, shift, space }` | 当前按键状态。 |
| `fadeTime` | `number` | 动画淡入淡出时间。 |
| `person` | `THREE.Group` | 人物模型。 |
| `mixer` | `THREE.AnimationMixer` | 动画混合器。 |
| `isWalkingForward` | `get boolean` | 是否前进。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(person, clips)` | `person: THREE.Group`；`clips: THREE.AnimationClip[]` | `RoamingStatus` | 绑定人物和动画剪辑。 |
| `init()` | 无 | `void` | 初始化动画 action。 |
| `setStatus(key, value)` | `key: string`；`value: boolean` | `void` | 设置某个按键状态。 |
| `fadeIn(name)` | `name: string` | `void` | 淡入指定动画。 |
| `fadeOut(name)` | `name: string` | `void` | 淡出指定动画。 |
| `stopAllAction()` | 无 | `void` | 停止全部动画。 |
| `update(delta)` | `delta: number` | `void` | 更新动画状态机。 |
| `dispose()` | 无 | `void` | 释放动画引用。 |

## MiniMap

`MiniMap` 是小地图工具，会创建独立 DOM 和小地图 renderer。

### 构造函数

```ts
new MiniMap(viewer: Viewer, options: IMiniMapOptions)
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `viewer` | `Viewer` | 所属 Viewer。 |
| `options.mapSize` | `number` | 小地图尺寸。 |
| `options.mapRenderSize` | `number` | 小地图渲染尺寸。 |
| `options.followTarget` | `THREE.Object3D` | 小地图跟随对象。 |
| `options.isShow` | `boolean` | 初始是否显示。 |

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `_miniMapCamera` | `THREE.OrthographicCamera | THREE.PerspectiveCamera | null` | 小地图相机。 |
| `_miniMapRenderer` | `THREE.WebGLRenderer | null` | 小地图渲染器。 |
| `_followTarget` | `THREE.Object3D` | 跟随对象。 |
| `dom` | `HTMLDivElement` | 小地图 DOM。 |
| `isShow` | `boolean` | 是否显示。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `createDomElement()` | 无 | `HTMLDivElement` | 创建小地图 DOM。 |
| `open()` | 无 | `void` | 显示小地图。 |
| `close()` | 无 | `void` | 隐藏小地图。 |
| `updateCamera()` | 无 | `void` | 同步小地图相机位置。 |
| `update()` | 无 | `void` | 渲染或刷新小地图。 |

## ClippedEdgesBox

`ClippedEdgesBox` 是盒剖切工具。它会创建剖切盒、六个剖切平面、边线、面片和鼠标拖拽事件。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `MIN_WIDTH` | `number` | 静态最小剖切宽度。 |
| `isOpen` | `boolean` | 当前是否开启剖切。 |
| `domElement` | `get HTMLCanvasElement` | Viewer renderer 的 canvas。 |
| `sectionBox` | `THREE.Box3 | undefined` | 当前剖切盒。 |
| `group` | `THREE.Group` | 剖切盒可视对象组。 |
| `planes` | `THREE.Plane[]` | 剖切平面集合。 |
| `vertices` | `THREE.Vector3[]` | 剖切盒顶点。 |
| `faces` | `BoxFace[]` | 剖切面集合。 |
| `lines` | `BoxLine[]` | 剖切边集合。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer` | `ClippedEdgesBox` | 绑定 Viewer。 |
| `objectSelected()` | 无 | `void` | 切换当前选中模型时更新剖切对象。 |
| `open()` | 无 | `void` | 开始剖切并绑定鼠标事件。 |
| `close()` | 无 | `void` | 关闭剖切并移除剖切盒。 |
| `reset()` | 无 | `void` | 重置剖切盒。 |
| `dispose()` | 无 | `void` | 关闭剖切、移除监听并释放临时对象。 |

`BoxLine` 和 `BoxFace` 分别负责边线高亮和面片拖拽。业务侧通常通过 `ClippedEdgesBox` 控制剖切，不需要直接操作这两个对象。

## Measure 与 MeasureMode

`Measure` 是测量工具，支持距离、面积和角度。它继承 `THREE.EventDispatcher<MeasureEventMap>`。

### MeasureMode

| 枚举项 | 值 | 说明 |
| --- | --- | --- |
| `MeasureMode.Distance` | `Distance` | 距离测量。 |
| `MeasureMode.Area` | `Area` | 面积测量。 |
| `MeasureMode.Angle` | `Angle` | 角度测量。 |

### MeasureEventMap

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `complete` | `{ object: THREE.Group }` | 当前测量绘制完成。 |

### 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `LINE_MATERIAL` | `THREE.LineBasicMaterial` | 静态线材质。 |
| `MESH_MATERIAL` | `THREE.MeshBasicMaterial` | 静态面材质。 |
| `MARKER_TEXTURE` | `string` | 静态点标记贴图。 |
| `MAX_DISTANCE` | `number` | 最大拾取距离。 |
| `OBJ_NAME` | `string` | 测量对象名称。 |
| `LABEL_NAME` | `string` | 标签对象名称。 |
| `isCompleted` | `boolean` | 当前测量是否完成。 |
| `isClose` | `boolean` | 工具是否关闭。 |
| `mode` | `MeasureMode` | 当前测量模式。 |
| `measureGroup` | `THREE.Group` | 所有测量对象的外层组。 |
| `domElement` | `get HTMLCanvasElement` | 事件监听目标。 |
| `canvas` | `get HTMLCanvasElement` | renderer canvas。 |

### 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer, mode)` | `viewer: Viewer`；`mode = MeasureMode.Distance` | `Measure` | 创建测量工具。 |
| `addEvent()` | 无 | `void` | 绑定鼠标和键盘事件。 |
| `removeEvent()` | 无 | `void` | 移除事件监听。 |
| `open()` | 无 | `void` | 打开测量工具。 |
| `redraw(point)` | `point: THREE.Sprite` | `void` | 基于已有点重绘测量结果。 |
| `clear()` | 无 | `void` | 结束测量并清空结果。 |
| `setFromPoints(geo, points)` | `geo: THREE.BufferGeometry`；`points: THREE.Vector3[]` | `void` | 手动写入顶点属性。 |
| `initPointMarkerMaterial()` | 无 | `void` | 初始化点标记材质。 |
| `createPointMarker(position)` | `position?: THREE.Vector3` | `THREE.Sprite` | 创建测量点标记。 |
| `clearTemp()` | 无 | `void` | 清理临时线、面和标签。 |
| `complete()` | 无 | `void` | 完成当前测量并派发 `complete`。 |
| `clearCurrentLabel()` | 无 | `void` | 清理当前临时标签。 |
| `getClosestIntersection(e)` | `e: MouseEvent` | `THREE.Vector3 | null` | 获取鼠标位置最近的场景交点。 |
| `redrawMousemove(e)` | `e: MouseEvent` | `void` | 重绘鼠标移动中的临时测量结果。 |
| `redrawComplete()` | 无 | `void` | 重绘完成状态。 |
| `addOrUpdateTempLabel(label, position)` | `label: string`；`position: THREE.Vector3` | `void` | 创建或更新临时标签。 |
| `createLabel(text)` | `text: string` | `CSS2DObject` | 创建 CSS2D 文本标签。 |
| `createCurve(p0, p1, p2)` | `p0: THREE.Vector3`；`p1: THREE.Vector3`；`p2: THREE.Vector3` | `THREE.Line` | 创建角度圆弧线。 |
| `calculateArea(points)` | `points: THREE.Vector3[]` | `number` | 计算面积。复杂凹多边形场景需要业务侧重点校验结果。 |
| `calculateAngle(startPoint, middlePoint, endPoint)` | `THREE.Vector3` 三点 | `number` | 计算夹角，单位度。 |
| `getAngleBisector(startPoint, middlePoint, endPoint)` | `THREE.Vector3` 三点 | `THREE.Vector3` | 获取角平分线方向。 |
| `getBarycenter(points)` | `points: THREE.Vector3[]` | `THREE.Vector3` | 获取点集重心。 |
| `getUnitString()` | 无 | `'' | 'm' | 'm²' | '°'` | 按模式返回单位。 |
| `numberToString(num)` | `num: number` | `string` | 格式化数字。 |
| `dispose()` | 无 | `void` | 释放测量对象、事件和材质引用。 |

`mousedown`、`mousemove`、`mouseup`、`onMouseClicked`、`keydown` 是实例上的事件处理函数，类型分别对应鼠标或键盘事件。业务通常通过 `open()`、`clear()`、`dispose()` 控制，不直接调用这些处理器。

## Export

`Export` 导出当前选中对象或整个场景。方法没有参数，内部会读取 `App.selected` 或 `App.scene`，并触发文件下载。

| API | 返回值 | 说明 |
| --- | --- | --- |
| `exportObjectToJSON()` | `void` | 导出选中对象 JSON。 |
| `exportObjectToGlb()` | `Promise<void>` | 导出选中对象 GLB。 |
| `exportObjectToGltf()` | `Promise<void>` | 导出选中对象 GLTF。 |
| `exportObjectToObj()` | `Promise<void>` | 导出选中对象 OBJ。 |
| `exportObjectToPly()` | `Promise<void>` | 导出选中对象 PLY。 |
| `exportObjectToPlyBinary()` | `Promise<void>` | 导出选中对象二进制 PLY。 |
| `exportObjectToStl()` | `Promise<void>` | 导出选中对象 STL。 |
| `exportObjectToStlBinary()` | `Promise<void>` | 导出选中对象二进制 STL。 |
| `exportObjectToUSDZ()` | `Promise<void>` | 导出选中对象 USDZ。 |
| `exportSceneToJSON()` | `void` | 导出场景 JSON。 |
| `exportSceneToGlb()` | `Promise<void>` | 导出场景 GLB。 |
| `exportSceneToGltf()` | `Promise<void>` | 导出场景 GLTF。 |
| `exportSceneToObj()` | `Promise<void>` | 导出场景 OBJ。 |
| `exportSceneToPly()` | `Promise<void>` | 导出场景 PLY。 |
| `exportSceneToPlyBinary()` | `Promise<void>` | 导出场景二进制 PLY。 |
| `exportSceneToStl()` | `Promise<void>` | 导出场景 STL。 |
| `exportSceneToStlBinary()` | `Promise<void>` | 导出场景二进制 STL。 |
| `exportSceneToUSDZ()` | `Promise<void>` | 导出场景 USDZ。 |

## ModelExplode

`ModelExplode` 用于计算模型按中心向外展开的数据，并在不同展开系数下更新位置。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `meshExplodeData` | `Map<string, Map<string, IModelExplodeData>>` | 每个模型、每个 mesh 的爆炸展开数据。 |
| `unrestoredModel` | `THREE.Object3D[]` | 尚未还原的模型列表。 |

`IModelExplodeData` 包含：

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `worldDir` | `THREE.Vector3` | mesh 从爆炸中心指向自身中心的世界方向。 |
| `worldDistance` | `THREE.Vector3` | 爆炸偏移距离。 |
| `originPosition` | `THREE.Vector3` | mesh 原始位置。 |
| `meshCenter` | `THREE.Vector3` | mesh 中心。 |
| `explodeCenter` | `THREE.Vector3` | 爆炸中心。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `ModelExplode` | 创建模型爆炸工具。 |
| `computedExplodeData(model)` | `model: THREE.Object3D` | `void` | 计算模型内 mesh 的展开数据。 |
| `getWorldCenterPosition(box, scalar)` | `box: THREE.Box3`；`scalar?: number` | `THREE.Vector3` | 获取包围盒世界中心，可传缩放系数。 |
| `explodeModel(model, scalar)` | `model: THREE.Object3D`；`scalar?: number` | `void` | 按系数展开模型。 |
| `restore()` | 无 | `void` | 还原所有展开过的模型。 |
| `clear()` | 无 | `void` | 清空缓存数据。 |

## 使用建议

这些工具都不是一次性纯函数。创建后要明确关闭路径：`Roaming.dispose()`、`ClippedEdgesBox.close()` / `dispose()`、`Measure.clear()` / `dispose()`、`ModelExplode.restore()` / `clear()`。如果组件卸载时遗漏释放，最常见的问题是残留事件监听、Worker 继续运行、临时材质或几何无法释放。
