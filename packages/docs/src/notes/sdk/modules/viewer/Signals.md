---
lang: zh-CN
title: Signals
createTime: 2026/06/09 00:00:00
---

# Signals

`Signals` 是 Viewer 对全局 signal 的响应层。业务代码更常通过 `Hooks` 派发信号，但理解这些方法有助于判断 UI 改配置后会发生什么。

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer` | `Signals` | 绑定 Viewer。 |
| `init()` | 无 | `void` | 注册 signal 监听。 |
| `objectIsCanPick(object)` | `object: THREE.Object3D \| null` | `boolean` | 判断对象是否允许被射线拾取。 |
| `sceneCleared()` | 无 | `void` | 场景清空后的渲染状态复位。 |
| `transformModeChanged(mode)` | `mode: any` | `void` | 切换 transform 控件模式。 |
| `snapChanged(dist)` | `dist: number` | `void` | 修改 transform 吸附距离。 |
| `spaceChanged(space)` | `space: 'world' \| 'local'` | `void` | 修改 transform 坐标系。 |
| `effectEnabledChange(enabled)` | `enabled: boolean` | `void` | 启用或禁用后处理。 |
| `rendererUpdated()` | 无 | `void` | 渲染器更新后的处理。 |
| `rendererCreated(newRenderer)` | `newRenderer: THREE.WebGLRenderer` | `void` | 渲染器创建完成后的处理。 |
| `rendererConfigUpdate()` | 无 | `void` | 按工程配置刷新 renderer。 |
| `rendererDetectKTX2Support(ktx2Loader)` | `ktx2Loader: any` | `void` | 让 KTX2Loader 检测当前 renderer 支持。 |
| `sceneBackgroundChanged(...)` | `backgroundType, backgroundColor, backgroundTexture, backgroundEquirectangularTexture, backgroundBlurriness, backgroundIntensity, backgroundRotation` | `void` | 更新场景背景。 |
| `sceneEnvironmentChanged(environmentType, environmentEquirectangularTexture)` | `environmentType: '' \| 'Background' \| 'Equirectangular' \| 'ModelViewer'`；`environmentEquirectangularTexture: THREE.Texture` | `void` | 更新场景环境贴图。 |
| `sceneGraphChanged()` | 无 | `void` | 手动触发场景渲染。 |
| `cameraChanged()` | 无 | `void` | 相机控制器更新后的处理。 |
| `viewportCameraChanged()` | 无 | `void` | 当前视口相机切换后的处理。 |
| `viewportShadingChanged()` | 无 | `void` | 切换渲染模式。 |
| `objectSelected(object)` | `object: any` | `void` | 对象选中后的处理。 |
| `objectFocused(object)` | `object: any` | `void` | 对象聚焦后的处理。 |
| `objectAdded()` | 无 | `void` | 对象新增后的处理。 |
| `objectChanged(object)` | `object: any` | `void` | 对象属性变更后的处理。 |
| `objectRemoved(object)` | `object: any` | `void` | 对象移除后的处理。 |
| `geometryChanged(object)` | `object: any` | `void` | 几何变更后的处理。 |
| `materialChanged()` | 无 | `void` | 材质变更后的处理。 |
| `sceneResize()` | 无 | `void` | 容器尺寸变化后的处理。 |
| `showGridChanged(showGrid)` | `showGrid: boolean` | `void` | 显示或隐藏网格。 |
| `scriptAdded(object, script)` | `object: THREE.Object3D`；`script: ISceneScript` | `void` | 对象脚本新增后的热更新。 |
| `scriptRemoved(object, script)` | `object: THREE.Object3D`；`script: ISceneScript` | `void` | 对象脚本删除后的热更新。 |
| `scriptChanged(attributeName, object, script)` | `attributeName: string`；`object: THREE.Object3D`；`script: ISceneScript` | `void` | 对象脚本属性变更后的热更新。 |
| `render()` | 无 | `void` | 触发 Viewer 渲染。 |

## 使用建议

signal 是跨模块协作通道，不适合当作任意全局事件总线滥用。高频场景要做节流或合并，尤其是鼠标移动、拖拽和动画更新。
