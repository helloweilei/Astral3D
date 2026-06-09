---
lang: zh-CN
title: ParticleSystem
createTime: 2026/06/09 00:00:00
---

# ParticleSystem

`ParticleSystem` 是 Viewer/Preview 和 three-nebula 之间的桥接层，负责 Sprite 粒子、Mesh 粒子、粒子代理对象和 body 映射。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `particlesGroup` | `THREE.Group` | 粒子代理对象统一挂载组。 |
| `spriteRenderer` | `Particle.SpriteRenderer` | Sprite 粒子渲染器。 |
| `meshRenderer` | `Particle.MeshRenderer` | Mesh 粒子渲染器。 |
| `spriteSystem` | `Particle.System` | Sprite 粒子系统。 |
| `meshSystem` | `Particle.System` | Mesh 粒子系统。 |
| `PointBody` | `THREE.Points` | 静态 Point 粒子 body。 |
| `Body3DMap` | `Map<string, THREE.Sprite \| THREE.Mesh>` | 静态 body 映射，key 是 `ParticleEmitter.uuid`。 |
| `needsUpdate` | `boolean` | 本帧粒子是否要求 Viewer 渲染。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer \| Preview` | `ParticleSystem` | 绑定 Viewer 或 Preview。 |
| `initEvent()` | 无 | `void` | 注册粒子相关 signal。 |
| `handleAddEmitter(emitter)` | `emitter: Particle.Emitter` | `void` | 添加 emitter 到系统。 |
| `handleObjectRemoved(object)` | `object: any` | `void` | 对象移除时清理粒子引用。 |
| `handleObjectAdded(object)` | `object: any` | `void` | redo 或导入对象时恢复粒子系统关系。 |
| `handleParticleBodyChanged(data, object3D, isObjectChange, done)` | `data: IParticle.Config['init']['body']`；`object3D: THREE.Texture \| string \| THREE.Mesh`；`isObjectChange?: boolean`；`done?: (data) => void` | `void` | 替换粒子 body，可以是贴图、URL 或 Mesh。 |
| `handleEmitterAdd(emitter, system)` | `emitter: Particle.Emitter`；`system?: string` | `void` | 将 emitter 加入指定粒子系统。 |
| `update(delta)` | `delta: number` | `void` | 更新粒子系统。 |
| `dispose()` | 无 | `void` | 释放粒子系统和渲染器。 |

## 使用建议

正式场景里优先通过 `viewer.addParticle()` 添加粒子，它会创建 `ParticleEmitter` 代理对象，让场景树、序列化和释放路径都更清楚。
