---
lang: zh-CN
title: Loader
createTime: 2026/06/09 00:00:00
---

# Loader

`Loader` 是 SDK 的默认加载入口，用来读取本地文件、URL 贴图、three.js JSON、ZIP 包以及常见 3D 模型格式。

```ts
import { Loader } from '@astral3d/engine'

const object = await Loader.loadFile(file)
```

## 成员

这些成员主要用于延迟创建 three.js 加载器。业务侧通常不直接改它们，除非你明确要替换加载器实例或释放缓存。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `texturePath` | `string` | three.js JSON 贴图资源路径。 |
| `_objectLoader` | `ObjectLoader \| null` | 延迟创建的 ObjectLoader。 |
| `_dracoLoader` | `DRACOLoader \| null` | 延迟创建的 DRACO Loader。 |
| `_ktx2Loader` | `KTX2Loader \| null` | 延迟创建的 KTX2 Loader。 |
| `_ifcLoader` | `any` | IFC Loader 实例。 |
| `rgbeLoader` | `RGBELoader \| null` | HDR 贴图加载器。 |
| `tgaLoader` | `TGALoader \| null` | TGA 贴图加载器。 |
| `_exrLoader` | `EXRLoader \| null` | EXR 贴图加载器。 |
| `textureLoader` | `THREE.TextureLoader \| null` | 默认贴图加载器。 |

## 访问器

| API | 类型 | 说明 |
| --- | --- | --- |
| `objectLoader` | `get/set ObjectLoader \| null` | three.js 对象 JSON 加载器。 |
| `dracoLoader` | `get/set DRACOLoader \| null` | DRACO 解码器。首次读取时设置 `libs/draco/gltf` 解码路径。 |
| `ktx2Loader` | `get/set KTX2Loader \| null` | Basis/KTX2 转码器。首次读取时设置 `libs/basis` 路径并派发 renderer 支持检测。 |
| `exrLoader` | `get/set EXRLoader \| null` | EXR 加载器。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `loadItemList(items)` | `items: any` | `void` | 从拖拽目录或文件条目读取文件列表，再调用 `loadFiles()`。 |
| `loadFiles(files, filesMap)` | `files: File[] \| FileList`；`filesMap: any` | `Promise<THREE.Object3D[]>` | 批量加载文件。会创建 `LoadingManager`，处理相对资源路径，并预解析 MTL。 |
| `loadFile(file, manager, mtlMaterials, addToScene)` | `file: any`；`manager = new THREE.LoadingManager()`；`mtlMaterials: MTLLoader.MaterialCreator \| null = null`；`addToScene = true` | `Promise<THREE.Object3D>` | 按文件后缀加载模型或场景。`addToScene` 为真时通过命令加入 `App`。 |
| `handleJSON(data, addToScene)` | `data: any`；`addToScene = true` | `Promise<unknown>` | 处理 three.js JSON。支持 `BufferGeometry`、`Object`、`App`。 |
| `handleZIP(contents, addToScene)` | `contents: any`；`addToScene = true` | `Promise<unknown>` | 处理 ZIP 内的 OBJ/MTL、FBX、GLB、GLTF。 |
| `createGLTFLoader(manager)` | `manager?: THREE.LoadingManager` | `Promise<GLTFLoader>` | 创建 GLTFLoader，并挂上 DRACO、KTX2 和 Meshopt 解码。 |
| `disposeGLTFLoaderEffects(loader)` | `loader: any` | `void` | 释放 GLTFLoader 关联的 DRACO、KTX2、Meshopt 引用。 |
| `loadUrlTexture(extension, url, onload, onerror)` | `extension: string`；`url: string`；`onload?: (tex) => void`；`onerror?: (err) => void` | `THREE.Texture` | 按后缀加载 HDR、TGA、EXR 或普通贴图。成功后设置 RepeatWrapping 与 `needsUpdate`。 |

## 支持格式

| 后缀 | 说明 |
| --- | --- |
| `3dm`、`3ds`、`3mf`、`amf` | CAD 或制造相关模型格式。 |
| `dae`、`fbx`、`glb`、`gltf`、`obj`、`stl`、`usdz` | 常见三维模型格式。 |
| `drc` | Draco 压缩模型。 |
| `ifc` | IFC BIM 模型。 |
| `kmz`、`ldr`、`mpd`、`md2`、`vox`、`wrl` | 特定生态或历史模型格式。 |
| `pcd`、`ply`、`xyz` | 点云或网格数据。 |
| `svg` | SVG 矢量图形。 |
| `vtk`、`vtp` | VTK/VTP 数据。 |
| `js`、`json` | three.js JSON 或 App JSON。 |
| `zip` | ZIP 资源包。 |

## 使用建议

加载到正式场景时，让 `Loader.loadFile()` 的 `addToScene` 保持默认 `true`，这样会走命令系统并保留撤销记录。只做预览或自定义处理时，把 `addToScene` 传为 `false`，拿到对象后自行决定是否释放或加入场景。
