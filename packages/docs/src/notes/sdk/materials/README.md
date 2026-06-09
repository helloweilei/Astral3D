---
lang: zh-CN
title: 材质与几何
createTime: 2026/06/09 00:00:00
---

# 材质与几何

这一页覆盖几何与 Shader 材质能力：`TeapotGeometry` 和六个 Shader 材质静态类。

## TeapotGeometry

`TeapotGeometry` 继承 `THREE.BufferGeometry`，用于创建内置茶壶几何。

```ts
import { TeapotGeometry } from '@astral3d/engine'

const geometry = new TeapotGeometry(2, 10, true, true, true, false, true)
```

### 构造函数

```ts
new TeapotGeometry(size?, segments?, bottom?, lid?, body?, fitLid?, blinn?)
```

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `size` | `number` | `50` 或调用方传入值 | 茶壶整体尺寸。内置 `Teapot()` 工厂使用 `2`。 |
| `segments` | `number` | `10` | 曲面分段。越高越平滑，也会增加顶点量。 |
| `bottom` | `boolean` | `true` | 是否生成底部。 |
| `lid` | `boolean` | `true` | 是否生成壶盖。 |
| `body` | `boolean` | `true` | 是否生成主体。 |
| `fitLid` | `boolean` | `false` | 壶盖是否贴合。 |
| `blinn` | `boolean` | `true` | 是否使用 Blinn 版本数据。 |

### 成员与方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `parameters` | 无 | `{ size, bottom, lid, blinn, body, fitLid, segments }` | 构造参数快照。 |
| `copy(source)` | `source: any` | `this` | 复制几何数据与参数。 |
| `TeapotGeometry.fromJSON(data)` | `data: any` | `TeapotGeometry` | 从 JSON 恢复几何。 |

## Shader 材质静态类

以下类都是静态工厂，不需要 `new`。它们共同暴露 `Material`、`PreviewMaterial`、`InstanceShaderMaterial()`、`Init()`、`Update()`、`UpdatePreview()`。

| API | 效果 | 说明 |
| --- | --- | --- |
| `CircleGridShaderMaterial` | 圆形网格 | 适合做地面网格、扫描网格或科技感面片。 |
| `DynamicCheckerboardShaderMaterial` | 动态棋盘格 | 适合做规则流动背景或材质预览。 |
| `FlickerShaderMaterial` | 闪烁 | 适合做告警、发光提示或闪烁面。 |
| `SlowSmokeShaderMaterial` | 慢速烟雾 | 使用分辨率 uniform，适合屏幕或面片烟雾效果。 |
| `SnowingShaderMaterial` | 下雪 | 使用分辨率 uniform，适合天气雪效面片。 |
| `StreamerWallShaderMaterial` | 流光墙 | 适合围栏、墙面、区域边界流光。 |

### 通用成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `_ShaderMaterial` | `THREE.ShaderMaterial` | 静态缓存的材质实例。业务不建议直接替换。 |
| `Name` | `string` | 材质名称。通常用于材质管理器识别。 |
| `Material` | `get/set THREE.ShaderMaterial` | 读取或替换主材质实例。 |
| `PreviewMaterial` | `get THREE.ShaderMaterial` | 读取预览用材质实例。 |

`SlowSmokeShaderMaterial` 和 `SnowingShaderMaterial` 额外有：

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `Resolution` | `get/set THREE.Vector2` | 分辨率 uniform 的封装。容器尺寸变化时需要同步更新。 |

### 通用方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `InstanceShaderMaterial()` | 无 | `THREE.ShaderMaterial` | 创建一个新的 ShaderMaterial 实例。需要独立 uniform 状态时用这个。 |
| `Init()` | 无 | `THREE.ShaderMaterial` | 初始化并返回静态主材质。 |
| `Update()` | 无 | `void` | 更新静态主材质的时间、uniform 或运行状态。通常由 `ShaderMaterialManager` 每帧调用。 |
| `UpdatePreview(previewMaterial)` | `previewMaterial: THREE.ShaderMaterial` | `void` | 更新某个预览材质。 |

### 使用方式

```ts
import { StreamerWallShaderMaterial } from '@astral3d/engine'

const material = StreamerWallShaderMaterial.InstanceShaderMaterial()
const mesh = new THREE.Mesh(geometry, material)
```

如果多个对象共享 `Material`，它们会共享 uniform 状态；如果你希望每个对象的时间、颜色、速度互不影响，用 `InstanceShaderMaterial()`。

## 资源释放

Shader 材质本质上还是 `THREE.ShaderMaterial`。对象移出场景时，如果材质只属于这个对象，需要调用 `material.dispose()`；如果交给 `App.addObject()` 管理，移除时应走 `App.removeObject()` 或命令系统，让材质引用计数先更新。
