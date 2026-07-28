---
lang: zh-CN
title: Preview
createTime: 2026/06/09 00:00:00
---

# Preview

`Preview` 是轻量预览器，适合在资源面板、材质面板或弹窗中预览单个模型、材质、贴图、广告牌、HDR 或粒子。它有自己的场景、相机、渲染器和粒子系统，但不会接管 `App.scene`。

```ts
import { Preview } from '@astral3d/engine'

const preview = new Preview({
  container: document.querySelector('#preview') as HTMLElement,
  hdr: '/hdr/studio.hdr',
  control: {
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    minDistance: 0,
    maxDistance: Infinity,
    maxPolarAngle: Math.PI,
    minPolarAngle: 0,
    maxZoom: Infinity,
    minZoom: 0,
    dollySpeed: 1,
    dollyToCursor: true,
  },
})
```

## 构造函数

```ts
new Preview(options: IPreviewSetting)
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `options` | `IPreviewSetting` | 是 | 预览器配置。 |
| `options.container` | `HTMLElement` | 否 | 预览器容器。不传时创建默认 `div`。 |
| `options.hdr` | `string` | 否 | 默认环境贴图地址。 |
| `options.request` | `IViewerRequest` | 否 | 请求配置，结构和 Viewer 一致。 |
| `options.control` | `IViewerControl` | 是 | 相机控制配置。 |

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `_container` | `HTMLElement` | 当前容器。业务建议通过 `container` 访问器读写。 |
| `options` | `IPreviewSetting` | 合并后的配置。 |
| `renderer` | `THREE.WebGLRenderer` | 预览 WebGLRenderer。 |
| `camera` | `THREE.PerspectiveCamera` | 预览相机。 |
| `scene` | `THREE.Scene` | 预览场景。 |
| `modules` | `PreviewerModules` | 控制器和粒子系统集合。 |
| `css3DRenderer` | `CSS3DRenderer` | HTML 面板预览用 CSS3D 渲染器。 |
| `timer` | `Timer` | 动画 delta 计时器。 |
| `resizeObserver` | `ResizeObserver \| null` | 容器尺寸监听器。 |
| `resize` | `() => void` | 当前 resize 回调。 |

## PreviewerModules

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `controls` | `CameraControls` | 预览相机控制器。 |
| `particleSystem` | `ParticleSystem` | 预览粒子系统。 |

## 访问器

| API | 类型 | 说明 |
| --- | --- | --- |
| `container` | `get HTMLElement` / `set HTMLElement` | 读取或切换容器。设置新容器时会移除旧容器中的 renderer DOM，并重新绑定 resize。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `basicCreation()` | 无 | `{ camera, scene, renderer, css3DRenderer }` | 创建预览相机、场景、WebGLRenderer 和 CSS3DRenderer。 |
| `initModules()` | 无 | `PreviewerModules` | 创建相机控制器和粒子系统。 |
| `loadEnv(options)` | `options?: { setBg?: boolean, extension?: string, onLoad?: (texture) => void, onError?: (error) => void }` | `void` | 加载 `options.hdr`。`extension` 默认为 hdr 地址后缀。 |
| `load(fileOrUrl, type)` | `fileOrUrl: string \| File`；`type = 'Model'` | `Promise<unknown>` | 加载预览项。支持 `Model`、`Material`、`Texture`、`Billboard`、`HDR`。 |
| `onResize()` | 无 | `() => void` | 创建 resize 监听并返回立即可调用的 resize 函数。 |
| `clear()` | 无 | `void` | 清空预览场景中非 `ignore` 对象。 |
| `animate()` | 无 | `void` | 更新 timer、相机控制器、粒子系统并渲染。 |
| `render()` | 无 | `void` | 渲染预览场景和 CSS3D 场景，派发 `beforeRender`、`afterRender`。 |
| `dispose()` | 无 | `void` | 解绑 resize、释放模块、清场景、移除 DOM、停止动画循环并释放 renderer。 |
| `addParticle(emitter, body, name)` | `emitter: Particle.Emitter`；`body: THREE.Sprite \| THREE.Mesh`；`name?: string` | `ParticleEmitter` | 将粒子添加到预览场景并返回代理对象。 |
| `getViewportImage()` | 无 | `Promise<{image: HTMLImageElement, blob: Blob}>` | 截取预览画布。 |

## 事件

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `beforeRender` | `{}` | 每次预览渲染前触发。 |
| `afterRender` | `{}` | 每次预览渲染后触发。 |

## 使用建议

预览器适合短生命周期场景。组件卸载时调用 `preview.dispose()`，不要只把 DOM 节点移除；否则动画循环、ResizeObserver、renderer 和粒子系统都会留下引用。
