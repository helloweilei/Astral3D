---
lang: zh-CN
title: Export
createTime: 2026/06/09 00:00:00
---

# Export

`Export` 导出当前选中对象或整个场景。方法没有参数，会读取 `App.selected` 或 `App.scene`，并触发文件下载。

## 对象导出

| API | 返回值 | 说明 |
| --- | --- | --- |
| `exportObjectToJSON()` | `void` | 导出选中对象 JSON。 |
| `exportObjectToGlb()` | `Promise<void>` | 导出选中对象 GLB。 |
| `exportObjectToGltf()` | `Promise<void>` | 导出选中对象 GLTF。 |
| `exportObjectToObj()` | `Promise<void>` | 导出选中对象 OBJ。 |
| `exportObjectToPly()` | `Promise<void>` | 导出选中对象 PLY。 |
| `exportObjectToPlyBinary()` | `Promise<void>` | 导出选中对象二进制 PLY。 |
| `exportObjectToStl()` | `Promise<void>` | 导出选中对象 STL。 |
| `exportObjectToStlBinary()` | `Promise<void>` | 导出选中对象二进制 STL。 |
| `exportObjectToUSDZ()` | `Promise<void>` | 导出选中对象 USDZ。 |

## 场景导出

| API | 返回值 | 说明 |
| --- | --- | --- |
| `exportSceneToJSON()` | `void` | 导出场景 JSON。 |
| `exportSceneToGlb()` | `Promise<void>` | 导出场景 GLB。 |
| `exportSceneToGltf()` | `Promise<void>` | 导出场景 GLTF。 |
| `exportSceneToObj()` | `Promise<void>` | 导出场景 OBJ。 |
| `exportSceneToPly()` | `Promise<void>` | 导出场景 PLY。 |
| `exportSceneToPlyBinary()` | `Promise<void>` | 导出场景二进制 PLY。 |
| `exportSceneToStl()` | `Promise<void>` | 导出场景 STL。 |
| `exportSceneToStlBinary()` | `Promise<void>` | 导出场景二进制 STL。 |
| `exportSceneToUSDZ()` | `Promise<void>` | 导出场景 USDZ。 |
