---
lang: zh-CN
title: Particle
createTime: 2026/06/09 00:00:00
---

# Particle

`Particle` 是 SDK 对内置 three-nebula 粒子库的命名空间导出：

```ts
import { Particle } from '@astral3d/engine'

const emitter = new Particle.Emitter()
```

下面按粒子系统的使用层次整理，覆盖 `Particle` 命名空间能访问到的公开名字。

## 核心对象

| API | 构造参数 | 说明 |
| --- | --- | --- |
| `Particle.System` | `preParticles = 500`；`integrationType = Particle.INTEGRATION_TYPE_EULER` | 粒子系统。管理 emitter、renderer、粒子池和每帧更新。 |
| `Particle.Particle` | `properties` | 单个粒子对象。包含生命周期、位置、速度、加速度、颜色、透明度、缩放等运行态数据。 |
| `Particle.Pool` | 无 | 对象池。用于复用粒子对象，降低频繁创建造成的 GC。 |

### System 常用方法

| API | 参数 | 说明 |
| --- | --- | --- |
| `addEmitter(emitter)` | `Particle.Emitter` | 添加发射器。 |
| `removeEmitter(emitter)` | `Particle.Emitter` | 移除发射器。 |
| `addRenderer(renderer)` | `Particle.MeshRenderer | Particle.SpriteRenderer | Particle.CustomRenderer | Particle.GPURenderer` | 添加渲染器。 |
| `removeRenderer(renderer)` | 渲染器实例 | 移除渲染器。 |
| `update(delta)` | `delta?: number` | 更新粒子系统。 |
| `destroy()` | 无 | 销毁系统、发射器、渲染器和池。 |

## Emitter

| API | 构造参数 | 说明 |
| --- | --- | --- |
| `Particle.Emitter` | `properties = {}` | 基础发射器。通过 rate、initializers、behaviours 组合出粒子效果。 |
| `Particle.FollowEmitter` | `mouseTarget`；`ease`；`pObj` | 跟随鼠标或目标对象的发射器。 |

### Emitter 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `dispatch(event, target)` | `event: string`；`target = this` | `void` | 派发 emitter 事件。 |
| `setRate(rate)` | `rate: Particle.Rate` | `this` | 设置发射速率。 |
| `setPosition(newPosition)` | `newPosition = {}` | `this` | 设置发射器位置。 |
| `setRotation(newRotation)` | `newRotation = {}` | `this` | 设置发射器旋转。 |
| `emit(totalEmitTimes, life)` | `totalEmitTimes = Infinity`；`life = Infinity` | `this` | 开始发射。 |
| `experimental_emit()` | 无 | `this` | 实验性发射入口。 |
| `setTotalEmitTimes(totalEmitTimes)` | `totalEmitTimes = Infinity` | `this` | 设置总发射次数。 |
| `setLife(life)` | `life = Infinity` | `this` | 设置发射器寿命。 |
| `stopEmit()` | 无 | `this` | 停止发射。 |
| `removeAllParticles()` | 无 | `this` | 移除全部粒子。 |
| `addInitializer(initializer)` | initializer 实例 | `this` | 添加初始化器。 |
| `addInitializers(initializers)` | initializer 数组 | `this` | 批量添加初始化器。 |
| `setInitializers(initializers)` | initializer 数组 | `this` | 替换初始化器集合。 |
| `removeInitializer(initializer)` | initializer 实例 | `this` | 移除初始化器。 |
| `removeAllInitializers()` | 无 | `this` | 清空初始化器。 |
| `addBehaviour(behaviour)` | behaviour 实例 | `this` | 添加粒子行为。 |
| `addBehaviours(behaviours)` | behaviour 数组 | `this` | 批量添加粒子行为。 |
| `setBehaviours(behaviours)` | behaviour 数组 | `this` | 替换粒子行为集合。 |
| `removeBehaviour(behaviour)` | behaviour 实例 | `this` | 移除行为。 |
| `removeAllBehaviours()` | 无 | `this` | 清空行为。 |
| `addEmitterBehaviour(behaviour)` | behaviour 实例 | `this` | 添加作用于发射器自身的行为。 |
| `addEmitterBehaviours(behaviours)` | behaviour 数组 | `this` | 批量添加发射器行为。 |
| `setEmitterBehaviours(behaviours)` | behaviour 数组 | `this` | 替换发射器行为集合。 |
| `removeEmitterBehaviour(behaviour)` | behaviour 实例 | `this` | 移除发射器行为。 |
| `removeAllEmitterBehaviours()` | 无 | `this` | 清空发射器行为。 |
| `addOnEmitterDeadEventListener(onEmitterDead)` | `(emitter) => void` | `this` | 添加发射器死亡回调。 |
| `createParticle()` | 无 | `Particle.Particle` | 创建或从池中取出粒子。 |
| `setupParticle(particle, index)` | `particle: Particle.Particle`；`index: number` | `void` | 初始化粒子。 |
| `update(time)` | `time: number` | `void` | 更新发射器和粒子。 |
| `updateEmitterBehaviours(time)` | `time: number` | `void` | 更新发射器自身行为。 |
| `integrate(time)` | `time: number` | `void` | 按积分方式更新物理状态。 |
| `generate(time)` | `time: number` | `void` | 按 rate 生成粒子。 |
| `destroy()` | 无 | `void` | 销毁发射器。 |

### FollowEmitter 方法

| API | 参数 | 说明 |
| --- | --- | --- |
| `initEventHandler()` | 无 | 初始化鼠标事件处理器。 |
| `emit()` | 无 | 开始跟随发射。 |
| `stopEmit()` | 无 | 停止发射。 |
| `setCameraAndCanvas(camera, canvas)` | `camera`；`canvas` | 设置相机和 canvas，用于鼠标坐标转换。 |
| `mousemove(e)` | 鼠标事件 | 更新跟随位置。 |
| `destroy()` | 无 | 释放事件和引用。 |

## Initializer

Initializer 决定粒子刚出生时的状态。

| API | 构造参数 | 说明 |
| --- | --- | --- |
| `Particle.Body` | `body`；`w = null`；`h = null`；`isEnabled = true` | 设置粒子主体，可传 Sprite 或 Mesh。 |
| `Particle.BodySprite` | `THREE`；`texture`；`materialProperties = DEFAULT_MATERIAL_PROPERTIES`；`isEnabled = true` | 用纹理创建 Sprite body。 |
| `Particle.InitializerUtil` | 无 | 初始化器辅助工具。 |
| `Particle.Life` | `min`；`max`；`center`；`isEnabled = true` | 设置粒子寿命范围。 |
| `Particle.Mass` | `min`；`max`；`center = false`；`isEnabled = true` | 设置粒子质量范围。 |
| `Particle.Position` | 无 | 设置粒子出生区域，可继续 `addZone()`。 |
| `Particle.Rotation` | `x`；`y`；`z`；`useEmitterRotation = true`；`isEnabled = true` | 设置初始旋转。 |
| `Particle.Radius` | `width`；`height`；`center = false`；`isEnabled = true` | 设置粒子半径或尺寸。 |
| `Particle.Rate` | `numPan = 1`；`timePan = 1` | 设置单位时间内发射数量和间隔。 |
| `Particle.Texture` | `THREE`；`loadedTexture`；`materialProperties = DEFAULT_MATERIAL_PROPERTIES`；`isEnabled = true` | 用已加载贴图创建粒子材质。 |
| `Particle.VectorVelocity` | `vector3d`；`theta`；`isEnabled = true` | 按方向向量设置速度。 |
| `Particle.PolarVelocity` | `polar3d`；`theta`；`isEnabled = true` | 按极坐标设置速度。 |
| `Particle.RadialVelocity` | `radius`；`vector3d`；`theta`；`isEnabled = true` | 按径向设置速度。 |

常用方法：

| API | 参数 | 说明 |
| --- | --- | --- |
| `initialize(particle)` | `Particle.Particle` | 给粒子写入初始状态。大部分 Initializer 都有这个方法。 |
| `reset(...)` | 各类自己的构造参数 | 重置初始化器。 |
| `Position.addZone(zone)` | `Particle.BoxZone | LineZone | MeshZone | PointZone | ScreenZone | SphereZone` | 添加出生区域。 |
| `Rate.getValue(time)` | `time: number` | 按时间获取本次发射数量。 |

## Behaviour

Behaviour 决定粒子出生后的变化。

| API | 构造参数 | 说明 |
| --- | --- | --- |
| `Particle.Behaviour` | `life = Infinity`；`easing = easeLinear`；`type = 'Behaviour'`；`isEnabled = true` | 行为基类。 |
| `Particle.Alpha` | `alphaA = 1`；`alphaB = null`；`life = Infinity`；`easing`；`isEnabled = true` | 透明度变化。 |
| `Particle.Attraction` | `targetPosition = new Vector3D()`；`force = 100`；`radius = 1000`；`life = Infinity`；`easing`；`isEnabled = true` | 吸引力。 |
| `Particle.Collision` | `emitter`；`useMass`；`onCollide`；`life`；`easing`；`isEnabled = true` | 粒子碰撞。 |
| `Particle.Color` | `colorA`；`colorB`；`life = Infinity`；`easing`；`isEnabled = true` | 颜色渐变。 |
| `Particle.CrossZone` | `zone`；`crossType`；`life`；`easing`；`isEnabled` | 粒子穿越区域后的处理。 |
| `Particle.Force` | `fx`；`fy`；`fz`；`life = Infinity`；`easing`；`isEnabled = true` | 持续力。 |
| `Particle.Gravity` | `gravity`；`life`；`easing`；`isEnabled = true` | 重力，是 `Force(0, -gravity, 0, ...)` 的封装。 |
| `Particle.RandomDrift` | `driftX`；`driftY`；`driftZ`；`delay = 0.03`；`life = Infinity`；`easing`；`isEnabled = true` | 随机漂移。 |
| `Particle.Repulsion` | `targetPosition`；`force`；`radius`；`life`；`easing`；`isEnabled = true` | 排斥力。 |
| `Particle.Rotate` | `x`；`y`；`z`；`life = Infinity`；`easing`；`isEnabled = true` | 旋转变化。 |
| `Particle.Scale` | `scaleA`；`scaleB`；`life = Infinity`；`easing`；`isEnabled = true` | 缩放变化。 |
| `Particle.Spring` | `x`；`y`；`z`；`spring`；`friction`；`life = Infinity`；`easing`；`isEnabled = true` | 弹簧力。 |

通用方法：

| API | 参数 | 说明 |
| --- | --- | --- |
| `reset(...)` | 各类自己的构造参数 | 重置行为参数。 |
| `initialize(particle)` | `Particle.Particle` | 粒子创建时初始化行为状态。 |
| `applyBehaviour(target, time, index)` | `target`；`time`；`index` | 执行行为。 |
| `mutate(target, time, index)` | `target`；`time`；`index` | 子类具体变更逻辑。 |
| `energize(particle, time)` | `particle`；`time` | 更新行为生命周期能量。 |
| `destroy()` | 无 | 释放行为。 |
| `fromJSON(json)` | `json` | 从 JSON 恢复行为。 |

## Zone

Zone 用于粒子出生位置或越界判定。

| API | 构造参数 | 说明 |
| --- | --- | --- |
| `Particle.BoxZone` | `a`；`b`；`c`；`d`；`e`；`f` | 盒形区域。 |
| `Particle.LineZone` | `x1`；`y1`；`z1`；`x2`；`y2`；`z2` | 线段区域。 |
| `Particle.MeshZone` | `bounds`；`scale = 1` | Mesh 表面或几何区域。 |
| `Particle.PointZone` | `a`；`b`；`c` | 单点区域。 |
| `Particle.ScreenZone` | `camera`；`renderer`；`dis`；`dir` | 屏幕区域。 |
| `Particle.SphereZone` | `centerX`；`centerY`；`centerZ`；`radius` | 球形区域。 |

通用方法：

| API | 参数 | 说明 |
| --- | --- | --- |
| `getPosition()` | 无 | 返回区域内的一个位置。 |
| `crossing(particle)` | `particle` | 判断并处理粒子穿越区域。 |
| `isBoxZone()` / `isLineZone()` / `isMeshZone()` / `isPointZone()` / `isScreenZone()` / `isSphereZone()` | 无 | 判断区域类型。 |

## Math

| API | 构造参数或参数 | 说明 |
| --- | --- | --- |
| `Particle.Span` | `a`；`b`；`center = false` | 数值范围。`getValue(INT)` 可取随机值。 |
| `Particle.createSpan(a, b, c)` | `a`；`b`；`c` | 创建 Span。 |
| `Particle.ArraySpan` | `items` | 数组范围，常用于随机取数组项。 |
| `Particle.createArraySpan(items)` | `items` | 创建 ArraySpan。 |
| `Particle.ColorSpan` | `colors` | 颜色范围。 |
| `Particle.createColorSpan(colors)` | `colors` | 创建 ColorSpan。 |
| `Particle.Box` | `x`；`y`；`z`；`w`；`h`；`d` | 包围盒数据。 |
| `Particle.Polar3D` | `radius`；`theta`；`phi` | 三维极坐标。 |
| `Particle.Vector3D` | 继承 Vector3 构造 | 粒子库向量。 |
| `Particle.MathUtils` | 无 | 数学辅助工具集合。 |
| `Particle.integrate(particle, time, damping, type)` | `particle`；`time`；`damping`；`type = INTEGRATION_TYPE_EULER` | 粒子物理积分。 |

### 积分常量

| API | 值 | 说明 |
| --- | --- | --- |
| `Particle.INTEGRATION_TYPE_EULER` | `EULER` | 欧拉积分。 |
| `Particle.INTEGRATION_TYPE_RK2` | `RUNGE_KUTTA_2` | 二阶 Runge-Kutta。 |
| `Particle.INTEGRATION_TYPE_RK4` | `RUNGE_KUTTA_4` | 四阶 Runge-Kutta。 |
| `Particle.INTEGRATION_TYPE_VERLET` | `VERLET` | Verlet 积分。 |

## Renderer

| API | 构造参数 | 说明 |
| --- | --- | --- |
| `Particle.CustomRenderer` | 无 | 自定义渲染器基类。 |
| `Particle.MeshRenderer` | `container`；`THREE` | 将粒子 body 作为 Mesh 加到容器。 |
| `Particle.SpriteRenderer` | `container`；`THREE` | 将粒子 body 作为 Sprite 加到容器。 |
| `Particle.GPURenderer` | `container`；`THREE`；`options = DEFAULT_RENDERER_OPTIONS` | GPU 粒子渲染器入口。 |

常用生命周期方法：

| API | 参数 | 说明 |
| --- | --- | --- |
| `onSystemUpdate(system)` | `Particle.System` | 系统更新回调。 |
| `onParticleCreated(particle)` | `Particle.Particle` | 粒子创建时加入渲染容器。 |
| `onParticleUpdate(particle)` | `Particle.Particle` | 粒子更新时同步位置、旋转、缩放、颜色等。 |
| `onParticleDead(particle)` | `Particle.Particle` | 粒子死亡时从渲染容器移除或回收。 |
| `destroy()` | 无 | 释放渲染器资源。 |

## Ease

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Particle.ease` | 无 | easing 函数字典 | 包含所有 easing 函数。 |
| `Particle.setEasingByName(easeName)` | `easeName: string` | `(value: number) => number` | 按名称获取 easing，不存在时返回 `easeLinear`。 |
| `Particle.getEasingByName(name)` | `name: string` | `(value: number) => number` | 按名称获取 easing，不存在时返回 `easeLinear`。 |

命名导出的 easing 函数：

`easeLinear`、`easeInQuad`、`easeOutQuad`、`easeInOutQuad`、`easeInCubic`、`easeOutCubic`、`easeInOutCubic`、`easeInQuart`、`easeOutQuart`、`easeInOutQuart`、`easeInSine`、`easeOutSine`、`easeInOutSine`、`easeInExpo`、`easeOutExpo`、`easeInOutExpo`、`easeInCirc`、`easeOutCirc`、`easeInOutCirc`、`easeInBack`、`easeOutBack`、`easeInOutBack`。

这些函数都接收 `value: number`，返回变换后的 `number`。

## Debug 与工具

| API | 参数 | 说明 |
| --- | --- | --- |
| `Particle.Debug` | 调试配置 | 粒子调试辅助。 |
| `Particle.log` | 日志参数 | three-nebula 内部日志函数。 |
| `Particle.ColorUtil` | 无 | 颜色转换工具。 |
| `Particle.PUID` | 无 | 粒子库唯一 id 工具。 |
| `Particle.THREEUtil` | 无 | three.js 适配工具。 |
| `Particle.Util` | 无 | 通用辅助工具。 |
| `Particle.uid` | 无 | 生成唯一 id。 |
| `Particle.withDefaults(defaults, properties)` | `defaults`；`properties` | 合并默认参数和传入参数。 |

## 使用建议

粒子效果建议通过 `Particles` 预设或 `ParticleEmitter` 接入 Viewer。直接操作 `Particle.System` 时，要自己负责 `addRenderer()`、`addEmitter()`、每帧 `update()` 和 `destroy()`。如果粒子进入正式场景，用 `viewer.addParticle()` 创建代理对象，这样场景树、序列化和资源释放路径会清楚很多。
