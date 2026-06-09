---
lang: zh-CN
title: Package
createTime: 2026/06/09 00:00:00
---

# Package

`Package` 挂在 `viewer.package` 上，负责把当前场景按 group 拆成多个 ZIP 上传，也负责从首包开始解包恢复场景。

```ts
await viewer.package.pack({
  name: 'demo',
  zipUploadFun: uploadZip,
  onProgress: progress => console.log(progress),
  onComplete: result => console.log(result),
})
```

## 构造函数

```ts
new Package(viewer: Viewer)
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `viewer` | `Viewer` | 所属 Viewer。 |

## Pack 配置

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 包名称。 |
| `layer` | `number` | 可选图层。 |
| `zipUploadFun` | `(zip: File) => Promise<any>` | 每个 zip 生成后的上传函数。 |
| `onProgress` | `(progress: number) => void` | 打包上传进度回调。 |
| `onComplete` | `({ firstUploadResult, totalSize, totalZipNumber }) => void` | 完成回调。 |

## Unpack 配置

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string` | 首包地址。 |
| `onSceneLoad` | `(sceneJson, configJson) => void` | 首包场景 JSON 和工程配置解析完成后的回调。 |
| `onProgress` | `(progress: number) => void` | 解包进度回调。 |
| `onComplete` | `() => void` | 解包完成回调。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `handleImage(imageJson, zipData)` | `imageJson: ITHREEScene.ImageJSON`；`zipData: SourceData[]` | `string` | 处理 image JSON，把贴图数据加入待压缩数据，并返回贴图文件名。 |
| `handleMesh(mesh, json, zipData)` | `mesh: THREE.Mesh`；`json: ITHREEScene.SceneJSON`；`zipData: SourceData[]` | `void` | 处理 Mesh 的几何、材质和贴图引用。 |
| `pack(packConfig)` | `packConfig: IPackConfig` | `Promise<{ firstUploadResult, totalSize, totalZipNumber }>` | 按 group 分包压缩并上传。首包保存场景基础信息、图纸信息和基础配置。 |
| `unpack(unpackConfig)` | `unpackConfig: IUnpackConfig` | `void` | 从首包地址开始解包并恢复场景。 |
| `dispose()` | 无 | `void` | 释放缓存、映射和加载状态。 |

## PackageSkeleton

`PackageSkeleton` 用于场景包解包时恢复骨骼与 Skeleton 关系。

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `PackageSkeleton` | 创建骨骼映射。 |
| `addBones(bones)` | `bones: THREE.Bone[]` | `void` | 登记骨骼。 |
| `handleSkeletons(skeletons, group)` | `skeletons: any`；`group: THREE.Object3D` | `void` | 将 Skeleton 数据重新绑定到 group。 |
| `clear()` | 无 | `void` | 清空骨骼映射。 |

## 使用建议

打包和解包都涉及大文件、贴图和二进制数据，进度回调一定要接到业务 UI。组件卸载或取消导入时，及时调用 `dispose()`，避免旧包缓存继续占用内存。
