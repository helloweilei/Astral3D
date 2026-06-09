---
lang: zh-CN
title: Measure
createTime: 2026/06/09 00:00:00
---

# Measure 与 MeasureMode

`Measure` 是测量工具，支持距离、面积和角度。它继承 `THREE.EventDispatcher<MeasureEventMap>`。

## MeasureMode

| 枚举项 | 值 | 说明 |
| --- | --- | --- |
| `MeasureMode.Distance` | `Distance` | 距离测量。 |
| `MeasureMode.Area` | `Area` | 面积测量。 |
| `MeasureMode.Angle` | `Angle` | 角度测量。 |

## 成员

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

## 方法

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
| `getClosestIntersection(e)` | `e: MouseEvent` | `THREE.Vector3 \| null` | 获取鼠标位置最近的场景交点。 |
| `redrawMousemove(e)` | `e: MouseEvent` | `void` | 重绘鼠标移动中的临时测量结果。 |
| `redrawComplete()` | 无 | `void` | 重绘完成状态。 |
| `addOrUpdateTempLabel(label, position)` | `label: string`；`position: THREE.Vector3` | `void` | 创建或更新临时标签。 |
| `createLabel(text)` | `text: string` | `CSS2DObject` | 创建 CSS2D 文本标签。 |
| `createCurve(p0, p1, p2)` | `p0: THREE.Vector3`；`p1: THREE.Vector3`；`p2: THREE.Vector3` | `THREE.Line` | 创建角度圆弧线。 |
| `calculateArea(points)` | `points: THREE.Vector3[]` | `number` | 计算面积；复杂凹多边形场景需要业务侧重点校验结果。 |
| `calculateAngle(startPoint, middlePoint, endPoint)` | `THREE.Vector3` 三点 | `number` | 计算夹角，单位度。 |
| `getAngleBisector(startPoint, middlePoint, endPoint)` | `THREE.Vector3` 三点 | `THREE.Vector3` | 获取角平分线方向。 |
| `getBarycenter(points)` | `points: THREE.Vector3[]` | `THREE.Vector3` | 获取点集重心。 |
| `getUnitString()` | 无 | `'' \| 'm' \| 'm²' \| '°'` | 按模式返回单位。 |
| `numberToString(num)` | `num: number` | `string` | 格式化数字。 |
| `dispose()` | 无 | `void` | 释放测量对象、事件和材质引用。 |

## 事件

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `complete` | `{ object: THREE.Group }` | 当前测量绘制完成。 |
