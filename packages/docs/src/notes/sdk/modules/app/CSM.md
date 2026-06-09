---
lang: zh-CN
title: CSM
createTime: 2026/06/09 00:00:00
---

# CSM

`CSM` 是级联阴影映射模块，用于大场景中提升方向光阴影质量。它会把材质接入 CSM，并在每帧根据相机更新阴影分段。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `instance` | `_CSM \| null` | three.js CSM 实例。 |
| `enabled` | `get/set boolean` | 启用或禁用 CSM。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(options)` | `options: IAppProject.CSM` | `CSM` | 按工程 CSM 配置创建实例。 |
| `reset()` | 无 | `void` | 重置 CSM。 |
| `setupMaterial(material)` | `material: THREE.Material` | `void` | 将材质接入 CSM。 |
| `updateProperty(key, value)` | `key: any`；`value: any` | `void` | 更新 CSM 属性。 |
| `updateLightColor(color)` | `color: string` | `void` | 更新阴影光源颜色。 |
| `updateLightIntensity(intensity)` | `intensity: number` | `void` | 更新阴影光源强度。 |
| `updateLightDirection(direction, value)` | `direction: 'x' \| 'y' \| 'z'`；`value: number` | `void` | 更新阴影光源方向。 |
| `updateFrustums()` | 无 | `void` | 更新 CSM 分段。 |
| `update()` | 无 | `void` | 每帧更新 CSM。Viewer 渲染前会调用。 |

## 使用建议

CSM 对大场景阴影有帮助，但也会增加渲染成本。移动端或低性能设备上，先确认是否真的需要级联阴影，再开启较高质量配置。
