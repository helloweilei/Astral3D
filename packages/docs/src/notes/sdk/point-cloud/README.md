---
lang: zh-CN
title: 点云
createTime: 2026/06/09 00:00:00
---

# 点云

`PointCloudReconstructor` 用语义颜色和空间聚类把点云重建成三角面对象。它适合“点已经有颜色分类，希望先自动提取一批粗略实体”的场景，不适合当作完整的通用点云建模器。

```ts
import { PointCloudReconstructor } from '@astral3d/engine'

const reconstructor = new PointCloudReconstructor()
reconstructor.processGeometry(pointGeometry)
```

## 成员

| 成员 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `points` | `THREE.Vector3[]` | `[]` | 从几何体里提取出来的点。 |
| `colors` | `THREE.Color[]` | `[]` | 与 `points` 对齐的颜色。没有颜色属性时会用白色补齐。 |
| `colorGroups` | `Map<string, THREE.Vector3[]>` | 空 `Map` | 按颜色键分组后的点。 |
| `colorTolerance` | `number` | `5` | RGB 分组容差，值越大，颜色越容易被归到同一组。 |
| `distanceThreshold` | `number` | `0.3` | 空间聚类距离阈值。 |
| `minClusterSize` | `number` | `10` | 小于该点数的聚类会被丢弃。 |
| `downsampleResolution` | `number` | `0.05` | 点云抽稀网格大小。 |
| `progressCallback` | `Function \| null` | `null` | 分组和聚类阶段的进度回调引用。 |

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `processGeometry(geometry)` | `geometry: THREE.BufferGeometry` | `void` | 清空旧点和颜色，从几何体属性里提取点云数据。 |
| `downsamplePoints(points, resolution)` | `points: THREE.Vector3[]`；`resolution: number` | `THREE.Vector3[]` | 用网格去重式抽稀，每个网格只保留一个点的克隆。 |
| `groupBySemanticColor()` | 无 | `void` | 根据 `getColorKey` 生成的颜色键填充 `colorGroups`。 |
| `getColorKey(color)` | `color: THREE.Color` | `string` | 按 `colorTolerance` 量化 RGB，返回形如 `255,0,0` 的分组键。 |
| `spatialClustering(points)` | `points: THREE.Vector3[]` | `THREE.Vector3[][]` | 使用网格邻域加速做空间聚类，只返回达到 `minClusterSize` 的聚类。 |
| `getGridKey(point, gridSize)` | `point: THREE.Vector3`；`gridSize: number` | `string` | 返回空间网格键。 |
| `getNeighborCells(point, gridSize)` | `point: THREE.Vector3`；`gridSize: number` | `string[]` | 返回当前网格周围 27 个邻域键。 |
| `reconstruct(onProgress, onComplete)` | `onProgress: (progress: number, message: string) => void`；`onComplete: (group: THREE.Group, totalObjects: number) => void` | `void` | 分组、抽稀、聚类后分帧用 `ConvexGeometry` 生成网格，完成后返回一个 `THREE.Group`。 |
| `dispose()` | 无 | `void` | 清空点、颜色、分组和回调引用。 |

## 使用建议

`reconstruct` 会为每个聚类创建 `ConvexGeometry` 与 `MeshStandardMaterial`。如果你把结果加入场景，后续销毁时需要遍历 `group.children`，释放几何体和材质；`PointCloudReconstructor.dispose()` 只负责清掉重建器自己的缓存。
