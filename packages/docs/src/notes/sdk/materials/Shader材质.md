---
lang: zh-CN
title: Shader 材质
createTime: 2026/06/09 00:00:00
---

# Shader 材质

以下类都是静态工厂，不需要 `new`。它们共同暴露 `Material`、`PreviewMaterial`、`InstanceShaderMaterial()`、`Init()`、`Update()`、`UpdatePreview()`。

| API | 效果 | 说明 |
| --- | --- | --- |
| `CircleGridShaderMaterial` | 圆形网格 | 适合做地面网格、扫描网格或科技感面片。 |
| `DynamicCheckerboardShaderMaterial` | 动态棋盘格 | 适合做规则流动背景或材质预览。 |
| `FlickerShaderMaterial` | 闪烁 | 适合做告警、发光提示或闪烁面。 |
| `SlowSmokeShaderMaterial` | 慢速烟雾 | 使用分辨率 uniform，适合屏幕或面片烟雾效果。 |
| `SnowingShaderMaterial` | 下雪 | 使用分辨率 uniform，适合天气雪效面片。 |
| `StreamerWallShaderMaterial` | 流光墙 | 适合围栏、墙面、区域边界流光。 |

## 通用成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `_ShaderMaterial` | `THREE.ShaderMaterial` | 静态缓存的材质实例。业务不建议直接替换。 |
| `Name` | `string` | 材质名称。通常用于材质管理器识别。 |
| `Material` | `get/set THREE.ShaderMaterial` | 读取或替换主材质实例。 |
| `PreviewMaterial` | `get THREE.ShaderMaterial` | 读取预览用材质实例。 |
| `Resolution` | `get/set THREE.Vector2` | `SlowSmokeShaderMaterial` 和 `SnowingShaderMaterial` 的分辨率 uniform 封装。 |

## 通用方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `InstanceShaderMaterial()` | 无 | `THREE.ShaderMaterial` | 创建一个新的 ShaderMaterial 实例。需要独立 uniform 状态时用这个。 |
| `Init()` | 无 | `THREE.ShaderMaterial` | 初始化并返回静态主材质。 |
| `Update()` | 无 | `void` | 更新静态主材质的时间、uniform 或状态。 |
| `UpdatePreview(previewMaterial)` | `previewMaterial: THREE.ShaderMaterial` | `void` | 更新某个预览材质。 |

## 使用建议

如果多个对象共享 `Material`，它们会共享 uniform 状态；如果希望每个对象的时间、颜色、速度互不影响，用 `InstanceShaderMaterial()`。
