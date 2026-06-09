---
lang: zh-CN
title: ClippedEdgesBox
createTime: 2026/06/09 00:00:00
---

# ClippedEdgesBox

`ClippedEdgesBox` 是盒剖切工具。它会创建剖切盒、六个剖切平面、边线、面片和鼠标拖拽事件。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `MIN_WIDTH` | `number` | 静态最小剖切宽度。 |
| `isOpen` | `boolean` | 当前是否开启剖切。 |
| `domElement` | `get HTMLCanvasElement` | Viewer renderer 的 canvas。 |
| `sectionBox` | `THREE.Box3 \| undefined` | 当前剖切盒。 |
| `group` | `THREE.Group` | 剖切盒可视对象组。 |
| `planes` | `THREE.Plane[]` | 剖切平面集合。 |
| `vertices` | `THREE.Vector3[]` | 剖切盒顶点。 |
| `faces` | `BoxFace[]` | 剖切面集合。 |
| `lines` | `BoxLine[]` | 剖切边集合。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer` | `ClippedEdgesBox` | 绑定 Viewer。 |
| `objectSelected()` | 无 | `void` | 切换当前选中模型时更新剖切对象。 |
| `open()` | 无 | `void` | 开始剖切并绑定鼠标事件。 |
| `close()` | 无 | `void` | 关闭剖切并移除剖切盒。 |
| `reset()` | 无 | `void` | 重置剖切盒。 |
| `dispose()` | 无 | `void` | 关闭剖切、移除监听并释放临时对象。 |
