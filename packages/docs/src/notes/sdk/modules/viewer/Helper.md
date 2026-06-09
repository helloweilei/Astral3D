---
lang: zh-CN
title: Helper
createTime: 2026/06/09 00:00:00
---

# Helper

`Helper` 是视角辅助模块，负责视角 gizmo 渲染和视角切换 UI 的底层能力。

## 方法与成员

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer, controls)` | `viewer: Viewer`；`controls: CameraControls` | `Helper` | 绑定 Viewer 和相机控制器。 |
| `animating` | 无 | `boolean` | 当前视角辅助是否正在动画切换。 |
| `hidden` | `boolean` | `void` | 设置视角辅助是否隐藏。 |
| `init()` | 无 | `void` | 初始化 gizmo。 |
| `initEvent()` | 无 | `void` | 注册全局 signal 事件。 |
| `initDomEvent()` | 无 | `void` | 注册 gizmo DOM 事件。 |
| `getGizmoConfig(type)` | `type?: string` | `GizmoOptions` | 按类型获取 gizmo 配置。 |
| `setConfig()` | 无 | `void` | 根据主色和明暗主题刷新外观。 |
| `update()` | 无 | `void` | 更新 gizmo 状态。 |
| `render()` | 无 | `void` | 渲染 gizmo。 |
| `dispose()` | 无 | `void` | 释放 gizmo 和相关监听。 |

## 使用建议

通常不需要手动创建 Helper，`Viewer` 初始化时会放到 `viewer.modules.viewHelper`。如果你在运行时切换主题，确保触发配置刷新，让 gizmo 外观和站点主题保持一致。
