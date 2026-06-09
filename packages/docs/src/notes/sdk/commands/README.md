---
lang: zh-CN
title: 命令系统
createTime: 2026/06/09 00:00:00
---

# 命令系统

命令系统服务于编辑器操作的撤销、重做和序列化。二次开发里，只要一个操作会改变场景对象、几何、材质、脚本、位置、旋转或缩放，优先用命令并交给 `App.execute()`。

```ts
import { App, Box, AddObjectCommand, SetPositionCommand } from '@astral3d/engine'

const box = Box()

App.execute(new AddObjectCommand(box))
App.execute(new SetPositionCommand(box, box.position.set(1, 2, 3)))
```

业务侧使用具体命令类即可，不需要直接依赖命令基类。

## 通用方法约定

大多数命令都有下面这些方法：

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `execute()` | 无 | `void` | 执行命令。 |
| `undo()` | 无 | `void` | 撤销命令。 |
| `update(cmd)` | `cmd: any` | `void` | 合并同类连续命令。只有部分 Set 命令实现。 |
| `toJSON()` | 无 | `any` | 序列化命令。 |
| `fromJSON(json)` | `json: any` | `void` | 从 JSON 恢复命令。 |

## 对象命令

### AddObjectCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object)` | `object: any` | 创建添加对象命令。`object` 应是 `THREE.Object3D` 或其子类。 |
| `object` | `any` | 待添加对象。 |

执行时调用 `App.addObject(object)`，撤销时移除该对象。

### RemoveObjectCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object)` | `object: any` | 创建移除对象命令。 |
| `object` | `any` | 待移除对象。 |
| `parent` | `any` | 原父级。 |
| `index` | `any` | 原索引。 |

执行时移除对象，撤销时按原父级和索引放回。

### MoveObjectCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, newParent, newBefore)` | `object: any`；`newParent: any`；`newBefore: any` | 创建移动对象命令。 |
| `object` | `any` | 被移动对象。 |
| `oldParent` | `any` | 原父级。 |
| `oldIndex` | `any` | 原索引。 |
| `newParent` | `any` | 新父级。 |
| `newIndex` | `any` | 新索引。 |
| `newBefore` | `any` | 插入参考对象。 |

适合场景树拖拽、对象重新分组、改变对象层级。

## 脚本命令

### AddScriptCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, script)` | `object: THREE.Object3D`；`script: any` | 给对象添加脚本。 |

执行后会进入 `App.scripts[object.uuid]`，并触发脚本相关信号。

### RemoveScriptCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, script)` | `object: THREE.Object3D`；`script: any` | 从对象移除脚本。 |
| `index` | `number` | 脚本原索引，内部用于撤销恢复。 |

### SetScriptValueCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, script, attributeName, newValue)` | `object: THREE.Object3D`；`script: IScript.IStruct`；`attributeName: string`；`newValue: string` | 修改脚本字段。 |
| `update(cmd)` | `cmd: any` | 合并连续脚本字段修改。 |

常用于修改脚本名称、内容或脚本配置。

## 通用属性命令

### SetValueCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, attributeName, newValue)` | `object: any`；`attributeName: any`；`newValue: any` | 修改对象普通属性。 |
| `object` | `any` | 被修改对象。 |
| `attributeName` | `any` | 属性名。 |
| `oldValue` | `any` | 旧值。 |
| `newValue` | `any` | 新值。 |
| `update(cmd)` | `cmd: any` | 合并连续修改。 |

### SetColorCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, attributeName, newValue)` | `object: any`；`attributeName: any`；`newValue: any` | 修改对象上的颜色属性，`newValue` 通常是十六进制颜色值。 |
| `update(cmd)` | `cmd: any` | 合并连续颜色修改。 |

### SetUuidCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, newValue)` | `object: any`；`newValue: any` | 修改对象 uuid。 |
| `object` | `any` | 被修改对象。 |
| `oldValue` | `any` | 旧 uuid。 |
| `newValue` | `any` | 新 uuid。 |

修改 uuid 会影响脚本、材质、场景树和引用关系。只有导入恢复或明确需要重写 uuid 时才使用。

## Transform 命令

### SetPositionCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, newValue, optionaloldValue)` | `object: any`；`newValue: any`；`optionaloldValue?: any` | 修改对象位置。`newValue` 通常是 `THREE.Vector3`。 |
| `update(command)` | `command: any` | 合并连续位置修改。 |

### SetRotationCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, newValue, optionaloldValue)` | `object: any`；`newValue: any`；`optionaloldValue: any` | 修改对象旋转。`newValue` 通常是 `THREE.Euler`。 |
| `update(command)` | `command: any` | 合并连续旋转修改。 |

### SetScaleCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, newValue, optionaloldValue)` | `object: any`；`newValue: any`；`optionaloldValue: any` | 修改对象缩放。`newValue` 通常是 `THREE.Vector3`。 |
| `update(command)` | `command: any` | 合并连续缩放修改。 |

Viewer 的 `TransformControls` 鼠标抬起时会根据模式自动生成这三个命令。

## 几何命令

### SetGeometryCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, newGeometry)` | `object: THREE.Mesh`；`newGeometry: THREE.BufferGeometry` | 替换 Mesh 几何。 |
| `object` | `THREE.Mesh` | 被修改 Mesh。 |
| `oldGeometry` | `THREE.BufferGeometry` | 旧几何。 |
| `newGeometry` | `THREE.BufferGeometry` | 新几何。 |
| `update(cmd)` | `{ newGeometry: THREE.BufferGeometry | THREE.InstancedBufferGeometry }` | 合并连续几何替换。 |

### SetGeometryValueCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, attributeName, newValue)` | `object: any`；`attributeName: any`；`newValue: any` | 修改几何对象上的字段。 |
| `object` | `any` | 被修改对象。 |
| `attributeName` | `any` | 几何属性名。 |
| `oldValue` | `any` | 旧值。 |
| `newValue` | `any` | 新值。 |

## 材质命令

### SetMaterialCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, newMaterial, materialSlot)` | `object: any`；`newMaterial: any`；`materialSlot?: any` | 替换对象材质。数组材质可传槽位。 |
| `oldMaterial` | `any` | 旧材质。 |
| `newMaterial` | `any` | 新材质。 |

执行和撤销时会通过 `App.setObjectMaterial()` 保持数组材质槽位一致。

### SetMaterialValueCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, attributeName, newValue, materialSlot)` | `object: any`；`attributeName: any`；`newValue: any`；`materialSlot?: number` | 修改材质普通属性。 |
| `material` | `any` | 目标材质。 |
| `oldValue` | `any` | 旧值。 |
| `newValue` | `any` | 新值。 |
| `update(cmd)` | `cmd: any` | 合并连续材质属性修改。 |

### SetMaterialColorCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, attributeName, newValue, materialSlot)` | `object: any`；`attributeName: any`；`newValue: any`；`materialSlot: any` | 修改材质颜色属性。 |
| `update(cmd)` | `cmd: any` | 合并连续颜色修改。 |

### SetMaterialMapCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, mapName, newMap, materialSlot)` | `object: any`；`mapName: any`；`newMap: any`；`materialSlot: any` | 替换材质贴图。 |
| `oldMap` | `any` | 旧贴图。 |
| `newMap` | `any` | 新贴图。 |
| `mapName` | `any` | 贴图字段名，例如 `map`、`normalMap`。 |

### SetMaterialRangeCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, attributeName, newMinValue, newMaxValue, materialSlot)` | `object: any`；`attributeName: any`；`newMinValue: any`；`newMaxValue: any`；`materialSlot: any` | 修改材质范围类属性。 |
| `oldValue` | `any` | 旧范围值。 |
| `newValue` | `any` | 新范围值。 |
| `update(cmd)` | `cmd: any` | 合并连续范围修改。 |

### SetMaterialVectorCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(object, attributeName, newValue, materialSlot)` | `object: any`；`attributeName: any`；`newValue: any`；`materialSlot: any` | 修改材质向量属性。 |
| `attribute` | `get any` | 当前目标属性。 |
| `update(cmd)` | `cmd: any` | 合并连续向量修改。 |

## 场景命令

### SetSceneCommand

| API | 参数 | 说明 |
| --- | --- | --- |
| `constructor(scene)` | `scene: THREE.Scene` | 用新场景替换当前场景。 |
| `cmdArray` | `Command[]` | 拆分后的命令数组。 |

执行时会把场景内对象拆成命令执行，撤销时恢复旧状态。

## 使用建议

1. UI 控件拖动时，不要每一帧都调用 `App.execute()`；先更新对象预览，交互结束后生成一条命令。
2. 修改材质、几何和贴图时，让命令负责撤销重做，不要同时直接改对象又执行命令。
3. 命令构造参数里大量类型是 `any`，这不是鼓励随意传值。传入对象必须满足命令期望的 three.js 结构，否则撤销或序列化阶段会出问题。
