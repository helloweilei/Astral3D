---
lang: zh-CN
title: Roaming
createTime: 2026/06/09 00:00:00
---

# Roaming 与 RoamingStatus

`Roaming` 是漫游工具，使用 BVH 做碰撞检测。人物模型需要包含 `Enter`、`Idle`、`Walking`、`WalkingBackward`、`Jumping` 这些动画。

## Roaming 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `group` | `THREE.Group` | 漫游工具对象组。 |
| `person` | `THREE.Group \| undefined` | 漫游人物模型。 |
| `playerInitPos` | `THREE.Vector3` | 玩家初始位置。 |
| `isRoaming` | `boolean` | 当前是否处于漫游状态。 |
| `mergeWorker` | `Worker` | 合并几何 Worker。 |

## Roaming 方法

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

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(person, clips)` | `person: THREE.Group`；`clips: THREE.AnimationClip[]` | `RoamingStatus` | 绑定人物和动画剪辑。 |
| `keyDownStatus` | 无 | `{ w, s, a, d, shift, space }` | 当前按键状态。 |
| `fadeTime` | 无 | `number` | 动画淡入淡出时间。 |
| `person` | 无 | `THREE.Group` | 人物模型。 |
| `mixer` | 无 | `THREE.AnimationMixer` | 动画混合器。 |
| `isWalkingForward` | 无 | `boolean` | 是否前进。 |
| `init()` | 无 | `void` | 初始化动画 action。 |
| `setStatus(key, value)` | `key: string`；`value: boolean` | `void` | 设置某个按键状态。 |
| `fadeIn(name)` | `name: string` | `void` | 淡入指定动画。 |
| `fadeOut(name)` | `name: string` | `void` | 淡出指定动画。 |
| `stopAllAction()` | 无 | `void` | 停止全部动画。 |
| `update(delta)` | `delta: number` | `void` | 更新动画状态机。 |
| `dispose()` | 无 | `void` | 释放动画引用。 |
