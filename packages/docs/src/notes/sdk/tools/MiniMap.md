---
lang: zh-CN
title: MiniMap
createTime: 2026/06/09 00:00:00
---

# MiniMap

`MiniMap` 是小地图工具，会创建独立 DOM 和小地图 renderer。

## 构造函数

```ts
new MiniMap(viewer: Viewer, options: IMiniMapOptions)
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `viewer` | `Viewer` | 所属 Viewer。 |
| `options.mapSize` | `number` | 小地图尺寸。 |
| `options.mapRenderSize` | `number` | 小地图渲染尺寸。 |
| `options.followTarget` | `THREE.Object3D` | 小地图跟随对象。 |
| `options.isShow` | `boolean` | 初始是否显示。 |

## 成员与方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `_miniMapCamera` | 无 | `THREE.OrthographicCamera \| THREE.PerspectiveCamera \| null` | 小地图相机。 |
| `_miniMapRenderer` | 无 | `THREE.WebGLRenderer \| null` | 小地图渲染器。 |
| `_followTarget` | 无 | `THREE.Object3D` | 跟随对象。 |
| `dom` | 无 | `HTMLDivElement` | 小地图 DOM。 |
| `isShow` | 无 | `boolean` | 是否显示。 |
| `createDomElement()` | 无 | `HTMLDivElement` | 创建小地图 DOM。 |
| `open()` | 无 | `void` | 显示小地图。 |
| `close()` | 无 | `void` | 隐藏小地图。 |
| `updateCamera()` | 无 | `void` | 同步小地图相机位置。 |
| `update()` | 无 | `void` | 渲染或刷新小地图。 |

## 使用建议

小地图会额外创建 renderer。组件卸载时要释放对应实例，避免主视口已经关闭但小地图仍在占用 GPU 资源。
