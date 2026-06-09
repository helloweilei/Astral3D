---
lang: zh-CN
title: Project
createTime: 2026/06/09 00:00:00
---

# Project 与 defaultProjectInfo

`Project` 负责工程配置读写、渲染配置联动和图纸状态。`defaultProjectInfo()` 用来创建一份干净的默认工程信息。

## defaultProjectInfo()

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `defaultProjectInfo()` | 无 | `IAppProject.Info` | 创建一份默认工程信息。每次调用都返回新对象，避免多个工程共享引用。 |

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `app` | `App` | 所属 App。 |
| `info` | `IAppProject.Info` | 当前工程信息。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(app)` | `app: App` | `Project` | 绑定 App 实例。 |
| `getKey(key)` | `key: string` | `any` | 按点路径读取工程配置。 |
| `setKey(key, value, executeAction)` | `key: string`；`value: unknown`；`executeAction = true` | `void` | 写入工程配置。`executeAction` 为真时会触发对应渲染或场景处理。 |
| `setDrawingSrc(src)` | `src: string` | `void` | 设置图纸地址。 |
| `setDrawingLayerVisible(layerName, visible)` | `layerName: string`；`visible: boolean` | `void` | 设置指定图纸图层显隐。 |
| `setDrawingLayerAllVisible(visible)` | `visible: boolean` | `void` | 设置所有图纸图层显隐。 |
| `drawingMarkListChange(type, rect)` | `type: 'add' \| 'update'`；`rect: IAppProject.DrawingMark` | `void` | 新增或更新图纸标记。 |
| `resetDrawing()` | 无 | `void` | 重置图纸配置。导入新场景时会用到。 |
| `dispose()` | 无 | `void` | 释放工程模块资源。 |

## 使用建议

如果配置会影响渲染器、背景、天气、图纸或后处理，优先通过 `Project.setKey()` 修改。需要批量恢复工程信息时，先准备完整数据，再让 Viewer 统一响应变更，避免中间态污染渲染。
