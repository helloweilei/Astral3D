---
lang: zh-CN
title: ModelExplode
createTime: 2026/06/09 00:00:00
---

# ModelExplode

`ModelExplode` 用于计算模型按中心向外展开的数据，并在不同展开系数下更新位置。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `meshExplodeData` | `Map<string, Map<string, IModelExplodeData>>` | 每个模型、每个 mesh 的爆炸展开数据。 |
| `unrestoredModel` | `THREE.Object3D[]` | 尚未还原的模型列表。 |

## IModelExplodeData

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `worldDir` | `THREE.Vector3` | mesh 从爆炸中心指向自身中心的世界方向。 |
| `worldDistance` | `THREE.Vector3` | 爆炸偏移距离。 |
| `originPosition` | `THREE.Vector3` | mesh 原始位置。 |
| `meshCenter` | `THREE.Vector3` | mesh 中心。 |
| `explodeCenter` | `THREE.Vector3` | 爆炸中心。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `ModelExplode` | 创建模型爆炸工具。 |
| `computedExplodeData(model)` | `model: THREE.Object3D` | `void` | 计算模型内 mesh 的展开数据。 |
| `getWorldCenterPosition(box, scalar)` | `box: THREE.Box3`；`scalar?: number` | `THREE.Vector3` | 获取包围盒世界中心，可传缩放系数。 |
| `explodeModel(model, scalar)` | `model: THREE.Object3D`；`scalar?: number` | `void` | 按系数展开模型。 |
| `restore()` | 无 | `void` | 还原所有展开过的模型。 |
| `clear()` | 无 | `void` | 清空缓存数据。 |
