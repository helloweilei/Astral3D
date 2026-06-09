---
lang: zh-CN
title: CameraManage
createTime: 2026/06/09 00:00:00
---

# CameraManage

`CameraManage` 负责常用视角切换和相机交互配置。前、后、左、右、顶、底视图都从这里进入。

## 方法与成员

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer, cameraControls)` | `viewer: Viewer`；`cameraControls: CameraControls` | `CameraManage` | 绑定 Viewer 与 controls。 |
| `options` | `{}` | `{}` | 默认交互相机参数缓存。 |
| `init()` | 无 | `void` | 初始化控制器配置。 |
| `setInteract(config)` | `config: any` | `void` | 设置相机交互模式或控制参数。 |
| `front()` | 无 | `Promise<unknown>` | 切到前视图，按 z 轴正方向。 |
| `rear()` | 无 | `Promise<unknown>` | 切到后视图。 |
| `left()` | 无 | `Promise<unknown>` | 切到左视图。 |
| `right()` | 无 | `Promise<unknown>` | 切到右视图。 |
| `top()` | 无 | `Promise<unknown>` | 切到顶视图。 |
| `bottom()` | 无 | `Promise<unknown>` | 切到底视图。 |

## 使用建议

视角切换是异步动画，业务 UI 如果要在切换结束后继续执行操作，应等待返回的 Promise。
