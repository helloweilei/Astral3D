---
lang: zh-CN
title: Effect
createTime: 2026/06/09 00:00:00
---

# Effect 与 LUTEffectMap

`Effect` 是后处理模块，按工程配置启用或禁用各类 Pass。`LUTEffectMap` 是内置 LUT 资源名映射。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `composer` | `EffectComposer \| undefined` | 后处理合成器。 |
| `outlinePass` | `OutlinePass \| undefined` | 选中描边 Pass。 |
| `PassMap` | `Map<string, supportPass>` | 静态 Pass 缓存，按名称复用。 |
| `enabled` | `get any` | 是否启用后处理。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer` | `Effect` | 绑定 Viewer。 |
| `createComposer()` | 无 | `void` | 创建后处理合成器。 |
| `FXAA` | 无 | `ShaderPass \| null` | 获取 FXAA 抗锯齿 Pass。 |
| `UnrealBloom` | 无 | `UnrealBloomPass` | 获取辉光 Pass。 |
| `Bokeh` | 无 | `BokehPass` | 获取背景虚化 Pass。 |
| `Pixelate` | 无 | `RenderPixelatedPass` | 获取像素风 Pass。 |
| `Halftone` | 无 | `HalftonePass` | 获取半色调 Pass。 |
| `LUT` | 无 | `LUTPass` | 获取 LUT 调色 Pass。 |
| `Afterimage` | 无 | `AfterimagePass` | 获取运动残影 Pass。 |
| `handlePassConfigChange(name, config)` | `name: string`；`config: any` | `void` | 更新指定 Pass 配置。 |
| `getPassConfigValue(key, value)` | `key: string`；`value: any` | `any` | 将配置值转换为 Pass 可用的值。 |
| `render(deltaTime)` | `deltaTime: number` | `void` | 使用 composer 渲染。 |
| `clear()` | 无 | `void` | 清理 Pass 状态。 |
| `dispose()` | 无 | `void` | 释放 composer 与 Pass。 |

## LUTEffectMap

内置 LUT 名称包括：`Bourbon 64.CUBE`、`Chemical 168.CUBE`、`Clayton 33.CUBE`、`Cubicle 99.CUBE`、`Remy 24.CUBE`、`Presetpro-Cinematic.3dl`、`NeutralLUT.png`、`B&WLUT.png`、`NightLUT.png`。

## 使用建议

后处理会引入额外 RenderTarget 和 Pass。切换配置时走 `handlePassConfigChange()`，关闭页面时走 `dispose()`，不要把 Pass 留在旧 composer 里。
