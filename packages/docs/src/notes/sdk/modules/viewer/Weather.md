---
lang: zh-CN
title: Weather
createTime: 2026/06/09 00:00:00
---

# Weather

`Weather` 负责雾、雨、雪和积雪材质替换。它会跟随工程配置变化创建、更新或关闭天气效果。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `rain` | `Rain \| null` | 下雨效果对象。 |
| `snow` | `Snow \| null` | 下雪效果对象。 |
| `snowingMaterialObj` | `THREE.Mesh[]` | 已替换积雪材质的网格列表。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer` | `Weather` | 绑定 Viewer。 |
| `objectAdded(object)` | `object: any` | `void` | 新对象加入场景时，必要时参与积雪材质处理。 |
| `sceneFogSettingsChanged()` | 无 | `void` | 按工程配置更新雾效。 |
| `sceneRainSettingsChanged()` | 无 | `void` | 按工程配置创建、更新或关闭雨效。 |
| `replaceSnowMaterial(obj)` | `obj: any` | `void` | 替换对象材质，使其支持雪堆积。 |
| `initSnowMap()` | 无 | `void` | 初始化全场景积雪贴图替换。 |
| `removeSnowMap()` | 无 | `void` | 关闭雪效并还原材质。 |
| `sceneSnowSettingsChanged()` | 无 | `void` | 按工程配置更新雪效。 |
| `update(deltaTime)` | `deltaTime: any` | `boolean` | 更新天气，返回本帧是否需要重新渲染。 |
| `dispose()` | 无 | `void` | 释放雨雪对象和材质替换状态。 |

## 使用建议

积雪效果会替换材质状态。导入或删除模型时让 Weather 正常接收对象变化，关闭雪效时走 `removeSnowMap()` 或 `dispose()`，避免材质停留在天气态。
