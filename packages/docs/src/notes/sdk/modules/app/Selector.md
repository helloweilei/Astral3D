---
lang: zh-CN
title: Selector
createTime: 2026/06/09 00:00:00
---

# Selector

`Selector` 负责对象选中与取消选中，并保留 IFC 选择相关状态。二次开发里通常直接调用 `App.select()` 和 `App.deselect()`。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `lastIsIFC` | `boolean` | 上一次选中对象是否为 IFC。 |
| `lastIFCModelID` | `number \| null` | 上一次 IFC 模型 id。 |
| `preselectMat` | `THREE.Material` | 预选材质。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `Selector` | 初始化选择器。 |
| `select(object)` | `object: THREE.Object3D \| null` | `void` | 选中对象并更新 `App.selected`。 |
| `deselect()` | 无 | `void` | 取消选中并恢复选择状态。 |

## 使用建议

不要同时维护多份“当前选中对象”。如果 UI 需要选中态，监听选择相关 signal 或读取 `App.selected`，避免 UI 状态和渲染拾取状态分叉。
