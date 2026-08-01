# Astral3D Editor 技术文档

本目录记录编辑器 / 引擎在 **Three.js 场景中加载地形相关能力** 的实现说明，面向二次开发与问题排查。

| 文档 | 内容 |
|------|------|
| [影像瓦片加载](./imagery-loading.md) | XYZ 卫星/地图影像如何铺到 Three.js 场景、坐标系、配置与常见问题 |
| [3D Tiles 加载](./tiles3d-loading.md) | 倾斜摄影等 3D Tiles 如何加载、重锚定变换、与影像对齐、描边与常见问题 |

核心实现位于 SDK（`packages/sdk`），编辑器侧栏通过 `App.project.setKey("terrain", …)` 驱动配置变更。
