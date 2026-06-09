---
lang: zh-CN
title: Drag
createTime: 2026/06/09 00:00:00
---

# Drag

`Drag` 负责对象拖拽控制，并在测量工具开启时避让测量交互。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `_dragObjects` | `THREE.Object3D[]` | 当前允许拖拽的对象集合。 |
| `dragControls` | `any` | 拖拽控制器实例。 |
| `viewer` | `Viewer` | 绑定的 Viewer。 |
| `measureInstance` | `Measure \| null` | 测量工具实例。 |
| `isDragging` | `boolean` | 当前是否正在拖拽。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer` | `Drag` | 初始化拖拽控制。 |
| `domElement` | `set HTMLElement` | `void` | 设置拖拽监听 DOM。 |
| `setMeasureInstance(measureInstance)` | `measureInstance: Measure` | `void` | 绑定测量工具。 |
| `setDragObjects(objects, type)` | `objects: THREE.Object3D[]`；`type?: 'eq' \| 'push' \| 'remove'` | `void` | 设置、追加或移除可拖拽对象。 |
| `dragControlsStart(e)` | `e: any` | `void` | 拖拽开始回调。 |
| `drag(e)` | `e: any` | `void` | 拖拽过程回调。 |
| `dragControlsEnd(e)` | `e: any` | `void` | 拖拽结束回调。 |
| `clickblank(e)` | `e: any` | `void` | 空白区域点击回调。 |
| `dispose()` | 无 | `void` | 释放拖拽控制器和监听。 |

## 使用建议

拖拽结束后再提交命令。拖拽过程中如果持续写历史，会导致撤销栈膨胀，也会影响交互帧率。
