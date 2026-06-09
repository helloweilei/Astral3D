---
lang: zh-CN
title: 对象与内置资源
createTime: 2026/06/09 00:00:00
---

# 对象与内置资源

这一组 API 用来快速创建 three.js 对象，或者创建 SDK 自己扩展出来的对象类型。基础对象函数只负责创建对象，不会自动加入场景；正式编辑行为建议配合 `App.execute(new AddObjectCommand(object))`。

## 基础对象工厂

这些函数都没有参数，返回已设置默认 `name` 的 three.js 对象。

| API | 返回值 | 默认对象名 | 说明 |
| --- | --- | --- | --- |
| `Group()` | `THREE.Group` | `Group` | 创建空组。 |
| `Box()` | `THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>` | `Box` | 创建 1x1x1 正方体。 |
| `Capsule()` | `THREE.Mesh<THREE.CapsuleGeometry, THREE.MeshStandardMaterial>` | `Capsule` | 创建胶囊体，半径 1，高度 1。 |
| `Circle()` | `THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial>` | `Circle` | 创建圆面。 |
| `Cylinder()` | `THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>` | `Cylinder` | 创建圆柱体。 |
| `Dodecahedron()` | `THREE.Mesh<THREE.DodecahedronGeometry, THREE.MeshStandardMaterial>` | `Dodecahedron` | 创建十二面体。 |
| `Icosahedron()` | `THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshStandardMaterial>` | `Icosahedron` | 创建二十面体。 |
| `DoubleCone()` | `THREE.Mesh<THREE.LatheGeometry, THREE.MeshStandardMaterial>` | `DoubleCone` | 创建双锥形对象，材质默认 `DoubleSide`。 |
| `Octahedron()` | `THREE.Mesh<THREE.OctahedronGeometry, THREE.MeshStandardMaterial>` | `Octahedron` | 创建八面体。 |
| `Plane()` | `THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>` | `Plane` | 创建 1x1 平面。 |
| `Ring()` | `THREE.Mesh<THREE.RingGeometry, THREE.MeshStandardMaterial>` | `Ring` | 创建圆环面。 |
| `Sphere()` | `THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>` | `Sphere` | 创建球体。 |
| `Sprite()` | `THREE.Sprite` | `Sprite` | 创建 Sprite。 |
| `Tetrahedron()` | `THREE.Mesh<THREE.TetrahedronGeometry, THREE.MeshStandardMaterial>` | `Tetrahedron` | 创建四面体。 |
| `Torus()` | `THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>` | `Torus` | 创建圆环体。 |
| `TorusKnot()` | `THREE.Mesh<THREE.TorusKnotGeometry, THREE.MeshStandardMaterial>` | `TorusKnot` | 创建环面扭结体。 |
| `Tube()` | `THREE.Mesh<THREE.TubeGeometry, THREE.MeshStandardMaterial>` | `Tube` | 沿内置 CatmullRom 曲线创建管道。 |
| `Teapot()` | `THREE.Mesh<TeapotGeometry, THREE.MeshStandardMaterial>` | `Teapot` | 创建茶壶模型，默认 `size=2`、`segments=10`。 |

## 灯光与相机工厂

| API | 返回值 | 默认对象名 | 说明 |
| --- | --- | --- | --- |
| `AmbientLight()` | `THREE.AmbientLight` | `AmbientLight` | 创建白色环境光。 |
| `DirectionalLight()` | `THREE.DirectionalLight` | `DirectionalLight` | 创建白色平行光，位置 `(5, 10, 7.5)`，target 名为 `DirectionalLight Target`。 |
| `HemisphereLight()` | `THREE.HemisphereLight` | `HemisphereLight` | 创建半球光，天空色 `0x00aaff`，地面色 `0xffaa00`。 |
| `PointLight()` | `THREE.PointLight` | `PointLight` | 创建白色点光源。 |
| `Spotlight()` | `THREE.SpotLight` | `SpotLight` | 创建白色聚光灯，位置 `(5, 10, 7.5)`，target 名为 `SpotLight Target`。 |
| `OrthographicCamera()` | `THREE.OrthographicCamera` | `OrthographicCamera` | 创建正交相机。宽高比来自 `App.camera.aspect`。 |
| `PerspectiveCamera()` | `THREE.PerspectiveCamera` | `PerspectiveCamera` | 创建透视相机。 |

## Billboard

`Billboard` 是 SDK 的广告牌对象，继承 `THREE.Sprite`，内部使用 CanvasTexture 绘制图片和文本。

```ts
import { Billboard, getDefaultBillboardOptions } from '@astral3d/engine'

const options = getDefaultBillboardOptions()
options.text.value = '设备 A'
options.image.url = '/icons/device.png'

const billboard = new Billboard(options)
```

### BillboardEventMap

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `imgLoaded` | `{ url: string }` | 图片加载完成。 |
| `redraw` | `{ url: string }` | 画布贴图重绘完成。 |

### getDefaultBillboardOptions()

无参数，返回一份新的默认配置。

| 配置路径 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 对象名。 |
| `position` | `number[]` | 初始位置。 |
| `image.url` | `string` | 图片地址。 |
| `image.visible` | `boolean` | 是否显示图片。 |
| `image.width` | `number` | 图片绘制宽度。 |
| `image.height` | `number` | 图片绘制高度。 |
| `image.rotate` | `number` | 图片旋转角。 |
| `image.margin` | `number` | 图片与文本间距。 |
| `image.position` | `string` | 图片相对文本的位置，可配合 `POSITION` 常量。 |
| `image.top` | `boolean` | 图片是否置顶绘制。 |
| `text.value` | `string` | 文本内容。 |
| `text.visible` | `boolean` | 是否显示文本。 |
| `text.fontSize` | `number` | 字号。 |
| `text.fontColor` | `string` | 文本颜色。 |
| `text.fontFamily` | `string` | 字体。 |
| `text.fontWeight` | `number` | 字重。 |
| `text.fontStyle` | `string` | 字体样式。 |
| `text.lineGap` | `number` | 多行间距。 |
| `text.padding` | `number` | 文本内边距。 |
| `text.align` | `string` | Canvas 文本对齐。 |
| `text.baseline` | `string` | Canvas 文本基线。 |
| `text.strokeWidth` | `number` | 描边宽度。 |
| `text.strokeColor` | `string` | 描边颜色。 |
| `text.fill` | `boolean` | 是否绘制背景填充。 |
| `text.fillColor` | `string` | 背景填充颜色。 |

### Billboard 成员与方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(options, material)` | `options: IBillboard.options`；`material?: THREE.SpriteMaterial` | `Billboard` | 创建广告牌。未传材质时使用内部材质。 |
| `type` | `string` | `Billboard` | 对象类型标记。 |
| `isBillboard` | `boolean` | `true` | 判断对象是否广告牌。 |
| `options` | `IBillboard.options` | 配置对象 | 当前广告牌配置。 |
| `toJSON(meta)` | `meta?: THREE.JSONMeta` | `THREE.Object3DJSON` | 序列化广告牌。 |
| `Billboard.fromJSON(json)` | `json: { material: THREE.SpriteMaterial, options: IBillboard.options }` | `Billboard` | 从 JSON 恢复广告牌。 |

## HtmlPanelConverter、HtmlPanel、HtmlSprite

HTML 面板用于把单 HTML 或 zip 包渲染成 CSS3D 对象。单 HTML 使用沙箱环境与 `with + proxy`，zip 包使用 iframe 方式处理资源。

### HtmlPanelConverter

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `HtmlPanelConverter.getInstance()` | 无 | `HtmlPanelConverter` | 获取单例转换器。 |
| `loadAsync(option)` | `{ url: string, isSprite: boolean, fileName?: string }` | `Promise<HtmlPanel | HtmlSprite>` | 从 URL 加载 HTML 或 zip，并转成 CSS3D 对象。 |
| `parseToCSS3D(options)` | `IHtmlPanelOption` | `HtmlPanel | HtmlSprite` | 将已读取的代码内容解析成 `HtmlPanel` 或 `HtmlSprite`。 |
| `_isEditable(filePath)` | `filePath: string` | `boolean` | 判断 zip 内文件是否可编辑。业务通常不需要直接调用。 |

`IHtmlPanelOption` 的成员：

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `isSprite` | `boolean` | 是否创建 CSS3DSprite。 |
| `codes` | `Array<{ name: string, content: string | ArrayBuffer, isIndex?: boolean }>` | HTML、脚本、样式或资源内容。 |
| `isSingleHtml` | `boolean` | 是否单 HTML 文件。 |

### HtmlPanel

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(element, options)` | `element: HTMLElement`；`options: IHtmlPanelOption` | `HtmlPanel` | 创建 CSS3DObject 面板。 |
| `type` | `string` | `HtmlPanel` | 对象类型标记。 |
| `isHtmlPanel` | `boolean` | `true` | HTML 面板标记。 |
| `options` | `IHtmlPanelOption` | 配置对象 | 面板源配置。 |
| `toJSON(meta)` | `meta?: THREE.JSONMeta` | `any` | 序列化面板。 |
| `HtmlPanel.fromJSON(data)` | `data: any` | `HtmlPanel | HtmlSprite` | 从 JSON 恢复面板或精灵。 |

### HtmlSprite

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(element, options)` | `element: HTMLElement`；`options: IHtmlPanelOption` | `HtmlSprite` | 创建 CSS3DSprite。 |
| `type` | `string` | `HtmlSprite` | 对象类型标记。 |
| `isHtmlSprite` | `boolean` | `true` | HTML 精灵标记。 |
| `options` | `IHtmlPanelOption` | 配置对象 | 面板源配置。 |
| `toJSON(meta)` | `meta?: THREE.JSONMeta` | `any` | 序列化精灵。 |
| `HtmlSprite.fromJSON(data)` | `data: any` | `HtmlPanel | HtmlSprite` | 从 JSON 恢复面板或精灵。 |

## ParticleEmitter

`ParticleEmitter` 是粒子发射器代理对象，继承 `THREE.Object3D`。它让粒子发射器能出现在场景树里，也能参与命令、序列化和属性同步。

### getDefaultParticleConfig()

无参数，返回一份新的 `IParticle.Config` 默认配置。用它做 UI 表单初始值，比复用旧对象更稳。

### ParticleEmitter 成员与方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(emitter)` | `emitter: Particle.Emitter` | `ParticleEmitter` | 创建发射器代理对象。 |
| `emitter` | `Particle.Emitter` | 发射器 | 被代理的 three-nebula emitter。 |
| `isEmitterProxy` | `boolean` | `true` | 粒子代理标记。 |
| `initEvent()` | 无 | `void` | 初始化 emitter 事件监听。 |
| `handleParticleCreated(particle)` | `particle: any` | `void` | 粒子创建回调。 |
| `handleAddToParticleSystem(emitter)` | `emitter: Particle.Emitter` | `void` | 添加到粒子系统后的回调。 |
| `syncProperties()` | 无 | `void` | 将 emitter 的位置、旋转等属性同步到代理对象。 |
| `proxyProperties()` | 无 | `void` | 拦截重要属性 setter，并同步回 emitter。 |
| `getEmitterJSON()` | 无 | `IParticle.Config` | 获取 emitter 配置 JSON。 |
| `ParticleEmitter.fromJSON(json)` | `json: IParticle.Object3DJSON` | `ParticleEmitter` | 从 JSON 恢复粒子代理。 |
| `toJSON(meta)` | `meta?: THREE.JSONMeta` | `any` | 序列化粒子代理。 |
| `dispose()` | 无 | `void` | 销毁 emitter 与事件关系。 |

## Particles

`Particles` 是内置粒子预设集合。所有方法都返回 `{ emitter, body }`，需要再交给 `viewer.addParticle()` 或 `preview.addParticle()`。

```ts
import { Particles } from '@astral3d/engine'

const { emitter, body } = Particles.fire({ x: 0, y: 0, z: 0 })
viewer.addParticle(emitter, body, '火焰')
```

| 成员或方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `DotImageUrl` | 无 | `string` | 内置圆点贴图地址。 |
| `SmokeImageUrl` | 无 | `string` | 内置烟雾贴图地址。 |
| `smoke(initPosition)` | `initPosition = { x: 0, y: 0, z: 0 }` | `{ emitter: any, body: THREE.Sprite }` | 烟雾预设。 |
| `fire(initPosition)` | `initPosition = { x: 0, y: 0, z: 0 }` | `{ emitter: any, body: THREE.Sprite }` | 火焰预设。 |
| `fireLine(initPosition)` | `initPosition = { x: 0, y: 0, z: 0 }` | `{ emitter: any, body: THREE.Sprite }` | 火线预设。 |
| `firefly(initPosition)` | `initPosition = { x: 0, y: 0, z: 0 }` | `{ emitter: any, body: THREE.Sprite }` | 萤火虫预设。 |
| `fireworks(initPosition)` | `initPosition = { x: 0, y: 0, z: 0 }` | `{ emitter: any, body: THREE.Sprite }` | 烟花预设。 |

## 使用建议

这些工厂函数会创建新的 Geometry、Material、Texture 或 Sprite。把对象加入场景后，要让 `App` 接管资源索引；把对象从场景移除后，要走命令或 `App.removeObject()`，避免材质引用计数和辅助对象残留。
