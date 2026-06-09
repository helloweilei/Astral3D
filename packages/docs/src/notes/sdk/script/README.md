---
lang: zh-CN
title: 脚本
createTime: 2026/06/09 00:00:00
---

# 脚本

脚本能力通过 `Script` 命名空间使用，主要包含动画动作包装、场景助手和默认脚本模板。

```ts
import { Script } from '@astral3d/engine'
```

## Script.Animation

`Script.Animation` 是给运行时脚本使用的动画动作包装类。它接收一个带动画动作的 `Object3D`，把对象上的动作整理成 `Map`，脚本里就可以按名称播放、暂停或停止动画。

### 构造参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `object` | `THREE.Object3D` | 持有动画动作的对象。动作会以 `clip.name` 建立索引。 |

### 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `object` | `THREE.Object3D` | 构造时传入的对象引用。 |
| `actionsMap` | `Map<string, THREE.AnimationAction>` | 动画名称到 `AnimationAction` 的索引。 |
| `lastPlayAction` | `THREE.AnimationAction \| undefined` | 最近一次通过 `play` 播放的动作；不传名称暂停或停止时会用它。 |
| `repetitions` | `number` | 动画重复次数，默认 `Infinity`。 |
| `ActionLoop` | `{ LoopOnce, LoopRepeat, LoopPingPong }` | 静态循环模式映射，值直接来自 three.js。 |

### 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `getActionsMap()` | 无 | `Map<string, THREE.AnimationAction>` | 重新从对象动画列表里构建动作索引。 |
| `getAction(name)` | `name: string`：动画名称。 | `THREE.AnimationAction \| undefined` | 返回底层动作实例。 |
| `actions` | 无 | `THREE.AnimationAction[]` | 访问器，返回当前 `actionsMap` 内的所有动作。 |
| `play(name, loop, timeScale)` | `name: string`；`loop: AnimationActionLoopStyles`，默认 `LoopRepeat`；`timeScale: number`，默认 `1`。 | `Animation` | 播放指定动作，并记录为 `lastPlayAction`，支持链式调用。 |
| `pause(name)` | `name: string \| undefined`：不传时暂停最近播放的动作。 | `Animation` | 暂停动作，支持链式调用。 |
| `stop(name)` | `name: string \| undefined`：不传时停止最近播放的动作。 | `Animation` | 停止动作；如果停止的是最近播放动作，会清空 `lastPlayAction`。 |

## Script.Helper

`Script.Helper` 是脚本环境里的轻量场景助手。它把部分场景操作隔离出来，避免运行时脚本直接依赖完整 `App`。

### 构造参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `scene` | `THREE.Scene` | 脚本要操作的场景。 |

### 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `scene` | `THREE.Scene` | 当前脚本助手绑定的场景。 |
| `Animation` | `typeof Script.Animation` | 暴露动画助手类，脚本里可通过 `helper.Animation` 创建动画控制器。 |

### 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `objectByUuid(uuid)` | `uuid: string` | `THREE.Object3D \| undefined` | 从场景树里查找指定对象。 |
| `moveObject(object, parent, before)` | `object: THREE.Object3D`；`parent: THREE.Object3D`；`before: THREE.Object3D` | `void` | 把对象移动到指定父级，并可调整兄弟顺序。 |
| `removeObject(object)` | `object: THREE.Object3D` | `void` | 从父级移除对象。这里不会自动释放几何体、材质、贴图；移除可销毁资源时，请配合资源释放链路处理。 |

## Script.Source

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `Source` | `string` | 默认脚本模板字符串，适合作为新建脚本的初始内容。 |

## 使用建议

脚本适合描述对象级行为。监听器、定时器、外部请求和 three.js 资源都要有清理路径，避免切换场景后旧脚本仍在运行。
