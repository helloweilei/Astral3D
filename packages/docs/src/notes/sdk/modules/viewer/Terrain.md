---
lang: zh-CN
title: Terrain
createTime: 2026/07/24 00:00:00
---

# Terrain

`Terrain` 是 Viewer 中的地形总控模块，负责影像底图（`ImageryLayer`）、3D Tiles（`Tiles3DLayer`）、地理锚点同步与场景拾取。

## 相关源码

| 模块 | 路径 | 职责 |
| --- | --- | --- |
| Terrain | `packages/sdk/lib/core/viewer/modules/Terrain.ts` | 配置应用、相机 far 自适应、每帧更新 |
| ImageryLayer | `packages/sdk/lib/core/objects/terrain/ImageryLayer.ts` | 影像瓦片加载、卸载与渲染 |
| GeoUtils | `packages/sdk/lib/utils/geo/GeoUtils.ts` | 坐标转换、视域范围、Level 迟滞 |
| ImageryProviders | `packages/sdk/lib/utils/geo/ImageryProviders.ts` | 瓦片 URL 模板与默认地址 |

## 工程配置

地形配置位于 `IAppProject.terrain`，主要字段：

| 字段 | 说明 |
| --- | --- |
| `enabled` | 是否启用地形 |
| `origin` | ENU 原点（WGS84 经纬高） |
| `imagery.enabled` | 是否加载影像底图 |
| `imagery.provider` | `osm` / `custom` / `tianditu_img` / `tianditu_vec` |
| `imagery.url` | OSM / 自定义 URL 模板，支持 `{x}` `{y}` `{z}` / `{zoom}` |
| `imagery.fixedBounds` | 固定范围：仅加载 bounds，忽略相机视锥 |
| `imagery.lockLevel` | 锁定瓦片 Level，不动态切换 |
| `imagery.lockedLevel` | 锁定的 Level 值 |
| `imagery.tilePadding` | 瓦片扩展圈数 |
| `imagery.bounds` | 西/南/东/北 加载范围 |
| `tiles3d` | 3D Tiles 相关配置 |

## 主要 API

| API | 说明 |
| --- | --- |
| `init()` | 应用当前工程地形配置 |
| `update(delta)` | 每帧更新影像与 3D Tiles，返回是否需要重绘 |
| `flyToRegion()` | 飞到影像 bounds 区域 |
| `estimateBoundsFromCamera()` | 从当前相机估算 bounds |
| `pickSurfaceHeight(x, z)` | 射线拾取地表高度 |
| `getCurrentImageryLevel()` | 当前影像 Level |

## 影像加载问题修复

影像瓦片在开发过程中出现过闪烁、整图消失、双 Level 叠加等问题，已在 SDK 中系统性修复。

详细的问题现象、根因分析与修复策略见：

**[影像瓦片加载问题修复](./影像瓦片加载问题修复.md)**

## 使用建议

**数字孪生固定区域**

- 开启 **固定范围** + **锁定 Level**
- bounds 覆盖业务区域，`minZoom` / `maxZoom` 与 `lockedLevel` 匹配实际精度需求

**动态漫游**

- 关闭固定范围，由 `getStableViewBounds` 按视距与 FOV 估算加载范围
- 相机 far 会随瓦片范围自动扩展，无需手动调大

**自定义 URL**

- 切换 provider 时会通过 `resolveImageryUrlForProvider` 填入对应默认值
- 自定义默认：`http://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}`
