---
lang: zh-CN
title: App
createTime: 2026/06/09 00:00:00
---

# App

`App` 是 SDK 的全局场景状态中心：

```ts
import { App } from '@astral3d/engine'
```

二次开发时通常直接使用这个实例，不需要自己创建 App。`Viewer` 创建后会把自己写入 `App.viewer`，后续 UI、命令、脚本和模块都围绕这份全局状态工作。

## 公开成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `scene` | `THREE.Scene` | 主场景。业务对象、模型、灯光通常都加入这里。 |
| `sceneHelpers` | `THREE.Scene` | 辅助场景。相机辅助、灯光辅助、选择框等对象放在这里。 |
| `camera` | `THREE.PerspectiveCamera` | 默认相机。初始位置为 `(0, 5, 10)`，看向原点。 |
| `viewportCamera` | `THREE.Camera` | 当前视口真正用于渲染的相机，默认等于 `camera`。 |
| `viewportShading` | `string` | 当前渲染模式。值为 `realistic` 时会触发路径追踪更新。 |
| `geometries` | `{ [uuid: string]: THREE.BufferGeometry }` | 场景几何索引。`addObject()` 遍历对象时自动收集。 |
| `materials` | `{ [uuid: string]: THREE.Material }` | 场景材质索引。受材质引用计数管理。 |
| `textures` | `{ [uuid: string]: THREE.Texture }` | 场景贴图索引。 |
| `scripts` | `ISceneJson['scripts']` | 对象脚本集合，key 为对象 uuid。 |
| `helpers` | `Record<number, THREE.Object3D>` | 辅助对象索引，key 为源对象 id。 |
| `cameras` | `{ [uuid: string]: THREE.Camera }` | 场景相机索引。 |
| `metadata` | `Record<string, any>` | 场景元数据。`fromJSON()` 时接收 JSON 的 `metadata`。 |
| `selected` | `THREE.Object3D | null` | 当前选中对象。 |
| `locked` | `THREE.Object3D | null` | 当前锁定对象。锁定后 Viewer 拾取会限制在锁定对象范围内。 |
| `log` | `typeof Logger` | SDK 日志实例。 |
| `storage` | `Storage` | localforage 存储模块。 |
| `config` | `Config` | 全局配置模块。 |
| `project` | `Project` | 工程配置与图纸状态模块。 |
| `selector` | `Selector` | 对象选择器。 |
| `history` | `History` | 命令历史。 |
| `resource` | `Resource` | 资源加载模块。 |
| `animationManager` | `AnimationManager` | 动画混合器和 action 管理器。 |
| `csm` | `CSM` | 级联阴影映射模块。 |
| `singleFrameTime` | `number` | 单帧间隔，单位秒。由 `FPS` 推导。 |
| `viewer` | `Viewer | null` | 当前 Viewer 实例。 |

`materialsRefCounter` 用于追踪材质引用次数，防止多个对象共用同一材质时误删材质索引。

## 访问器

| API | 类型 | 说明 |
| --- | --- | --- |
| `FPS` | `get number` / `set number` | 读取或设置渲染帧率上限。设置时会写入 `project.renderer.fps`，并更新 `singleFrameTime`。`0` 表示不设上限。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `setConfig(config)` | `config: Record<string, any>` | `void` | 设置初始配置，内部交给 `Config.setConfig()`。 |
| `setScene(scene)` | `scene: THREE.Scene` | `THREE.Scene` | 用传入场景生成当前场景。会复制场景基础属性和 uuid，再逐个 `addObject()` 加入子对象。 |
| `clipAction(object)` | `object: THREE.Object3D` | `void` | 为带动画的对象创建或复用 `AnimationMixer`，把 `AnimationClip` 转成 `AnimationAction` 并登记到 `animationManager.actionMap`。 |
| `addObject(object, parent, index)` | `object: THREE.Object3D`；`parent?: THREE.Object3D`；`index?: number` | `void` | 添加对象。会修复外部 three 实例原型链，收集动画、几何、材质、相机、辅助对象，并派发 `objectAdded`、`sceneGraphChanged`。 |
| `moveObject(object, parent, before)` | `object: THREE.Object3D`；`parent: THREE.Object3D`；`before: THREE.Object3D` | `void` | 移动对象到新父级，可插入到 `before` 前。 |
| `nameObject(object, name)` | `object: THREE.Object3D`；`name: string` | `void` | 重命名对象并派发场景变更。 |
| `removeObject(object)` | `object: THREE.Object3D` | `void` | 从场景移除对象。`object.parent === null` 或 `object.ignore` 时不会移除。会同步移除相机、辅助和材质引用。 |
| `addGeometry(geometry)` | `geometry: THREE.BufferGeometry` | `void` | 将几何写入 `geometries[uuid]`。 |
| `setGeometryName(geometry, name)` | `geometry: THREE.BufferGeometry`；`name: string` | `void` | 设置几何名称并派发场景变更。 |
| `addMaterial(material)` | `material: THREE.Material | THREE.Material[]` | `void` | 增加材质引用计数，首次出现时写入 `materials` 并接入 CSM。 |
| `addMaterialToRefCounter(material)` | `material: THREE.Material` | `void` | 单个材质引用计数增加。 |
| `removeMaterial(material)` | `material: THREE.Material | THREE.Material[]` | `void` | 减少材质引用计数，引用为 0 时从 `materials` 删除。 |
| `removeMaterialFromRefCounter(material)` | `material: THREE.Material` | `void` | 单个材质引用计数减少。 |
| `getMaterialByUuid(uuid)` | `uuid: string` | `THREE.Material` | 从 `materials` 索引读取材质。 |
| `setMaterialName(material, name)` | `material: THREE.Material`；`name: string` | `void` | 设置材质名称并派发场景变更。 |
| `addTexture(texture)` | `texture: THREE.Texture` | `void` | 将贴图写入 `textures[uuid]`。 |
| `addCamera(camera)` | `camera: THREE.Camera` | `void` | 如果对象是相机，写入 `cameras` 并派发 `cameraAdded`。 |
| `removeCamera(camera)` | `camera: THREE.Camera | THREE.Object3D` | `void` | 从 `cameras` 删除相机并派发 `cameraRemoved`。 |
| `addHelper(object, helper)` | `object: any`；`helper?: THREE.Object3D` | `void` | 为相机、灯光、骨骼等对象创建辅助对象。未传 `helper` 时按对象类型创建。 |
| `removeHelper(object)` | `object: THREE.Object3D` | `void` | 移除对象对应的辅助对象。 |
| `addScript(object, script)` | `object: THREE.Object3D`；`script: ISceneScript` | `void` | 通过 `AddScriptCommand` 添加脚本。 |
| `removeScript(object, script)` | `object: THREE.Object3D`；`script: ISceneScript` | `void` | 通过 `RemoveScriptCommand` 移除脚本。 |
| `getObjectMaterial(object, slot)` | `object: THREE.Object3D`；`slot: number` | `any` | 获取对象材质。数组材质会按 `slot` 取其中一项。 |
| `setObjectMaterial(object, slot, newMaterial)` | `object: THREE.Object3D`；`slot: number | undefined`；`newMaterial: THREE.Material` | `void` | 设置对象材质。数组材质且传入 `slot` 时只替换对应槽位。 |
| `setViewportCamera(uuid)` | `uuid: string` | `void` | 将 `viewportCamera` 切到 `cameras[uuid]`，并派发 `viewportCameraChanged`。 |
| `setViewportShading(value)` | `value: string` | `void` | 设置渲染模式，并派发 `viewportShadingChanged`。 |
| `select(object)` | `object: THREE.Object3D` | `void` | 选中对象，内部交给 `selector.select()`。 |
| `selectById(id)` | `id: number` | `void` | 按 id 选中对象。id 等于默认相机 id 时选中默认相机。 |
| `selectByUuid(uuid)` | `uuid: string` | `void` | 遍历场景并按 uuid 选中对象。 |
| `deselect()` | 无 | `void` | 取消选中。 |
| `lock(object)` | `object?: THREE.Object3D | null` | `void` | 锁定对象。不传时默认锁定当前选中对象。 |
| `unlock()` | 无 | `void` | 取消锁定。 |
| `focus(object)` | `object: THREE.Object3D` | `void` | 派发 `objectFocused`，实际聚焦由 Viewer Signals 响应。 |
| `focusById(id)` | `id: number` | `void` | 按 id 聚焦对象。 |
| `focusByUuid(uuid)` | `uuid: string` | `void` | 按 uuid 聚焦对象。传 `undefined` 时取消选中。 |
| `getObjectByUuid(uuid)` | `uuid: string` | `THREE.Object3D | undefined` | 从主场景按 uuid 查对象。 |
| `traverseMeshToArr(object)` | `object: THREE.Object3D` | `THREE.Object3D[]` | 将对象下所有 Mesh 平铺成数组。对象本身是 Mesh 时直接返回 `[object]`。 |
| `getSceneWithoutIgnore()` | 无 | `THREE.Scene` | 克隆一个不包含 `ignore` 对象的场景。用于导出或保存前过滤业务辅助对象。 |
| `createPBRMaterial(textures, properties)` | `textures?: { [type: string]: string | THREE.Texture }`；`properties?: any` | `Promise<THREE.MeshStandardMaterial>` | 创建 PBR 材质并加载贴图。支持 `baseColor`、`normal`、`bump`、`displacement`、`roughness`、`metalness`、`ao`、`emissive`、`alpha`、`env`、`light`。 |
| `clear()` | 无 | `void` | 清空场景状态。会清历史、重置相机、移除对象、清资源索引、停止动画 action、取消选中并派发 `sceneCleared`。 |
| `fromJSON(sceneJson)` | `sceneJson: ISceneJson` | `Promise<THREE.Scene>` | 从场景 JSON 恢复场景。会先 `clear()`，重置图纸状态，恢复相机、脚本和场景对象。 |
| `toJSON()` | 无 | `{ metadata, project, camera, scene, scripts }` | 将当前场景转成 JSON。会先清理失效脚本。 |
| `execute(cmd, optionalName)` | `cmd: any`；`optionalName?: string` | `void` | 执行命令并写入历史。 |
| `undo()` | 无 | `void` | 撤销上一条命令。 |
| `redo()` | 无 | `void` | 重做上一条命令。 |

## App 模块

这些模块也会被 `App` 实例持有。常规接入更建议使用 `App.config`、`App.project` 等现成实例。

### Config

`Config` 管理全局配置，并与本地存储同步。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `storage` | `Storage` | 构造时传入的存储模块。 |
| `config` | `IAppConfig.Config` | 当前配置对象。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(storage)` | `storage: Storage` | `Config` | 绑定本地存储。 |
| `setConfig(config)` | `config: Record<string, any>` | `void` | 设置初始配置。 |
| `syncStorage()` | 无 | `void` | 与本地存储中的配置同步。 |
| `getKey(key)` | `key: string` | `any` | 按点路径读取配置，例如 `renderer.fps`。 |
| `setKey(key, value)` | `key: string`；`value: unknown` | `void` | 按点路径写入配置。 |
| `getShortcutItem(key)` | `key: string` | `any` | 获取快捷键配置项。 |
| `setShortcutItem(key, value)` | `key: string`；`value: any` | `Promise<any>` | 写入快捷键配置。 |
| `clear()` | 无 | `void` | 清空配置。 |

### Project 与 defaultProjectInfo

`defaultProjectInfo()` 返回默认工程配置。`Project` 负责工程配置读写、渲染配置联动和图纸状态。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `app` | `App` | 所属 App。 |
| `info` | `IAppProject.Info` | 当前工程信息。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `defaultProjectInfo()` | 无 | `IAppProject.Info` | 创建一份默认工程信息。每次调用返回新对象，避免共享引用。 |
| `constructor(app)` | `app: App` | `Project` | 绑定 App 实例。 |
| `getKey(key)` | `key: string` | `any` | 按点路径读取工程配置。 |
| `setKey(key, value, executeAction)` | `key: string`；`value: unknown`；`executeAction = true` | `void` | 写入工程配置。`executeAction` 为真时会触发对应渲染或场景处理。 |
| `setDrawingSrc(src)` | `src: string` | `void` | 设置图纸地址。 |
| `setDrawingLayerVisible(layerName, visible)` | `layerName: string`；`visible: boolean` | `void` | 设置指定图纸图层显隐。 |
| `setDrawingLayerAllVisible(visible)` | `visible: boolean` | `void` | 设置所有图纸图层显隐。 |
| `drawingMarkListChange(type, rect)` | `type: 'add' | 'update'`；`rect: IAppProject.DrawingMark` | `void` | 新增或更新图纸标记。 |
| `resetDrawing()` | 无 | `void` | 重置图纸配置。导入新场景时会用到。 |
| `dispose()` | 无 | `void` | 释放工程模块资源。 |

### History

`History` 管理命令撤销栈和重做栈。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `undos` | `Array<Undos>` | 可撤销命令栈。 |
| `redos` | `Array<Undos>` | 可重做命令栈。 |
| `lastCmdTime` | `number` | 最近命令执行时间。 |
| `idCounter` | `number` | 命令 id 计数器。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `History` | 初始化历史栈。 |
| `execute(cmd, optionalName)` | `cmd: any`；`optionalName: any` | `void` | 执行命令并写入撤销栈。 |
| `undo()` | 无 | `Undos | undefined` | 撤销一条命令。 |
| `redo()` | 无 | `Undos | undefined` | 重做一条命令。 |
| `toJSON()` | 无 | `{ undos?: string[], redos?: string[] }` | 序列化历史。 |
| `fromJSON(json)` | `json: any` | `void` | 从 JSON 恢复历史。 |
| `clear()` | 无 | `void` | 清空历史。 |
| `goToState(id)` | `id: number` | `void` | 跳转到指定历史状态。 |
| `enableSerialization(id)` | `id: any` | `void` | 启用指定命令序列化。 |

### Resource

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `Resource` | 创建资源模块。 |
| `loadURLTexture(url, onload, onerror)` | `url: string | THREE.Texture`；`onload?: (tex) => void`；`onerror?: (err) => void` | `THREE.Texture` | 加载 URL 或直接接收 Texture。加载成功后回调贴图。 |

### Selector

`Selector` 负责对象选中与取消选中，并保留 IFC 选择相关状态。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `lastIsIFC` | `boolean` | 上一次选中对象是否为 IFC。 |
| `lastIFCModelID` | `number | null` | 上一次 IFC 模型 id。 |
| `preselectMat` | `THREE.Material` | 预选材质。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `Selector` | 初始化选择器。 |
| `select(object)` | `object: THREE.Object3D | null` | `void` | 选中对象并更新 `App.selected`。 |
| `deselect()` | 无 | `void` | 取消选中并恢复选择状态。 |

### Storage

`Storage` 基于 localforage 管理模型、其他数据和配置数据三个库。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `dbs` | `{ modelsDB, otherDB, configDB }` | 三个 localforage 实例集合。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `Storage` | 初始化数据库。 |
| `initDB()` | 无 | `{ modelsDB, otherDB, configDB }` | 创建并返回数据库集合。 |
| `setModel(key, value)` | `key: string`；`value: any` | `void` | 写入模型缓存。 |
| `getModel(key)` | `key: string` | `Promise<unknown>` | 读取模型缓存。 |
| `removeModel(key)` | `key: string` | `Promise<void>` | 删除模型缓存。 |
| `setOtherItem(key, value)` | `key: string`；`value: any` | `void` | 写入其他缓存。 |
| `getOtherItem(key)` | `key: string` | `Promise<unknown>` | 读取其他缓存。 |
| `removeOtherItem(key)` | `key: string` | `Promise<void>` | 删除其他缓存。 |
| `setConfigItem(key, value)` | `key: string`；`value: any` | `Promise<any>` | 写入配置缓存。 |
| `getConfigItem(key)` | `key: string` | `Promise<unknown>` | 读取配置缓存。 |
| `removeConfigItem(key)` | `key: string` | `Promise<void>` | 删除配置缓存。 |

### CSM

`CSM` 是 three.js `CSM` 的包装层，用于级联阴影映射。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `instance` | `_CSM | null` | three.js CSM 实例。 |
| `enabled` | `get/set boolean` | 启用或禁用 CSM。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(options)` | `options: IAppProject.CSM` | `CSM` | 按工程 CSM 配置创建实例。 |
| `reset()` | 无 | `void` | 重置 CSM。 |
| `setupMaterial(material)` | `material: THREE.Material` | `void` | 将材质接入 CSM。`App.addMaterialToRefCounter()` 会调用。 |
| `updateProperty(key, value)` | `key: any`；`value: any` | `void` | 更新 CSM 属性。 |
| `updateLightColor(color)` | `color: string` | `void` | 更新阴影光源颜色。 |
| `updateLightIntensity(intensity)` | `intensity: number` | `void` | 更新阴影光源强度。 |
| `updateLightDirection(direction, value)` | `direction: 'x' | 'y' | 'z'`；`value: number` | `void` | 更新阴影光源方向。 |
| `updateFrustums()` | 无 | `void` | 更新 CSM 分段。 |
| `update()` | 无 | `void` | 每帧更新 CSM。Viewer 渲染前会调用。 |

## 使用建议

新增、移动、删除、改材质这类编辑操作，优先走命令系统和 `App.execute()`，这样撤销重做、场景树刷新、材质引用计数都能保持一致。只有一次性初始化或内部工具非常确定不需要历史记录时，才直接调用 `App.addObject()`、`App.removeObject()` 等方法。
