---
lang: zh-CN
title: Resource
createTime: 2026/06/09 00:00:00
---

# Resource

`Resource` 是资源加载模块，目前主要负责 URL 贴图加载。正式场景中的材质贴图建议通过它进入 SDK，便于后续统一处理加载成功、加载失败和贴图参数。

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `Resource` | 创建资源模块。 |
| `loadURLTexture(url, onload, onerror)` | `url: string \| THREE.Texture`；`onload?: (tex) => void`；`onerror?: (err) => void` | `THREE.Texture` | 加载 URL 或直接接收 Texture。加载成功后回调贴图。 |

## 使用建议

如果传入的已经是 `THREE.Texture`，方法会直接返回这份贴图。业务侧不要在高频路径里反复调用贴图加载；贴图创建后应复用，并在材质或场景释放时走对应清理流程。
