---
lang: zh-CN
title: Utils 与 Hooks
createTime: 2026/06/09 00:00:00
---

# Utils 与 Hooks

`Utils` 和 `Hooks` 都是命名空间导出：

```ts
import { Utils, Hooks } from '@astral3d/engine'
```

`Utils` 放通用工具、场景工具、请求控制、WASM ZIP 工具、日志和 signal 注册表；`Hooks` 是 signal 的便捷调用层。

## Utils.common

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Utils.deepAssign(target, source)` | `target: any`；`source: any` | `void` | 深度遍历 `source`，只把同名 key 合并到 `target`。常用于默认配置合并。 |
| `Utils.deepEqual(a, b)` | `a: any`；`b: any` | `boolean` | 深度比较两个值是否相等。 |
| `Utils.debounce(func, wait)` | `func: Function`；`wait: number` | `(...args: any[]) => void` | 防抖。连续触发时只在最后一次等待结束后执行。 |
| `Utils.throttle(func, wait)` | `func: Function`；`wait: number` | `(...args: any[]) => void` | 节流。在时间窗口内最多执行一次。 |
| `Utils.getNestedProperty(obj, path)` | `obj: object`；`path: string` | `any` | 按点路径读取嵌套属性，例如 `a.b.c`。 |
| `Utils.escapeRegExp(str)` | `str: string` | `string` | 转义正则特殊字符。 |
| `Utils.getOsTheme()` | 无 | `'dark' | 'light'` | 读取系统明暗主题。 |
| `Utils.remToPxNumber(rem)` | `rem: number` | `number` | 将 rem 转成 px 数字。 |
| `Utils.downloadBlob(blob, filename)` | `blob: any`；`filename: any` | `void` | 下载 Blob。 |
| `Utils.saveArrayBuffer(buffer, filename)` | `buffer: any`；`filename: any` | `void` | 下载 ArrayBuffer。 |
| `Utils.saveString(text, filename)` | `text: any`；`filename: any` | `void` | 下载文本。 |
| `Utils.IS_MAC` | 无 | `boolean` | 当前平台是否 macOS。 |
| `Utils.isNil(v)` | `v: any` | `boolean` | 是否 `null` 或 `undefined`。 |
| `Utils.isEmptyObject(obj)` | `obj: object` | `boolean` | 是否普通空对象。 |
| `Utils.createDivContainer()` | 无 | `HTMLDivElement` | 创建默认容器 `div`。 |

## Utils.scene

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Utils.parseMaterialZip(zipFile)` | `zipFile: File` | `Promise<THREE.MeshStandardMaterial>` | 解析材质 ZIP 包，返回 PBR 标准材质。 |
| `Utils.focusObject(object, controls, enableTransition)` | `object: THREE.Object3D`；`controls: CameraControls`；`enableTransition = true` | `Promise<void[]>` | 根据对象包围盒聚焦相机。 |
| `Utils.focusObjectByDistance(object, controls, distance, enableTransition)` | `object: THREE.Object3D`；`controls: CameraControls`；`distance: number`；`enableTransition = true` | `Promise<void>` | 按指定距离聚焦对象。 |
| `Utils.getParentPath(parentObject, object, attr, splitter)` | `parentObject: THREE.Object3D`；`object: THREE.Object3D`；`attr = 'name'`；`splitter = '/'` | `any` | 获取对象到父对象的路径，不包含 `parentObject`。 |
| `Utils.getMousePosition(dom, x, y)` | `dom: HTMLElement`；`x: number`；`y: number` | `number[]` | 将页面坐标转成容器内归一化坐标。 |
| `Utils.getMeshByInstancedMesh(instancedMesh)` | `instancedMesh: THREE.InstancedMesh` | `THREE.Mesh[]` | 将 InstancedMesh 拆成 Mesh 数组。 |
| `Utils.isGroup(object3D)` | `object3D: THREE.Object3D` | `any` | 判断对象是否可视为 Group。 |
| `Utils.isParticleObject(object)` | `object: THREE.Object3D | null` | `any` | 判断是否粒子代理对象。 |
| `Utils.isBillboardObject(object)` | `object: THREE.Object3D | null` | `any` | 判断是否广告牌对象。 |
| `Utils.isHtmlPanelObject(object)` | `object: THREE.Object3D | null` | `false | HTMLElement | null | undefined` | 判断是否 HTML 面板对象，并返回关联元素。 |
| `Utils.getAnimations(object)` | `object = App.scene` | `any` | 获取对象或场景中的所有动画 action。 |
| `Utils.getAnimationClips(object)` | `object = App.scene` | `any` | 获取对象或场景中的所有动画剪辑。 |

## Utils.Stats

`Stats` 是性能面板工具，绑定 Viewer 后可显示 FPS、帧耗时和内存。

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `domElement` | `get HTMLElement` | 性能面板 DOM。 |
| `visible` | `get/set boolean` | 是否显示面板。 |

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(viewer)` | `viewer: Viewer` | `Stats` | 绑定 Viewer。 |
| `initEvent()` | 无 | `void` | 注册渲染事件。 |
| `init()` | 无 | `void` | 初始化面板。 |
| `showPanel(type)` | `type: number | 'fps' | 'ms' | 'mb'` | `void` | 显示指定面板。 |
| `showAllPanels(show)` | `show: boolean` | `void` | 显示或隐藏全部面板。 |
| `dispose()` | 无 | `void` | 移除面板和事件监听。 |

## Utils.request

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Utils.fetchController(limit, timeout)` | `limit: number`；`timeout: number | boolean` | `(url: string, options?: any) => void` | 创建受并发数和超时控制的 fetch 包装函数。 |

`timeout` 为 `false` 时表示不做超时控制；为数字时按毫秒计算。

## Utils.wasm

### injectWasm

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Utils.injectWasm(opts)` | `opts: { wasmUrl: string }` | `Promise<any>` | 注入 SDK WASM 能力，例如 AstralZip。Viewer 构造时会自动注入默认 wasm。 |

### AstralZip 常量

| API | 值 | 说明 |
| --- | --- | --- |
| `Utils.ASTRAL_ZIP_READY_TIMEOUT` | `10000` | 等待 AstralZip 构造器可用的最长时间，单位毫秒。 |
| `Utils.ASTRAL_ZIP_READY_INTERVAL` | `16` | 轮询间隔，单位毫秒。 |
| `Utils.ASTRAL_ZIP_MAX_WORKERS` | `4` | ZIP 并发 worker 上限。 |

### AstralZip 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Utils.getAstralZipConstructor()` | 无 | `IAstralZip.Constructor | undefined` | 获取已注入的 AstralZip 构造器。 |
| `Utils.waitAstralZipConstructor()` | 无 | `Promise<IAstralZip.Constructor>` | 等待 AstralZip 可用。超时会抛错。 |
| `Utils.getAstralZipWorkers()` | 无 | `number` | 获取受上限保护的 worker 数量。 |
| `Utils.getAstralZipFile(archive, fileName)` | `archive: IAstralZip.Zip`；`fileName: string` | `IAstralZip.File` | 从 ZIP 归档中取文件代理。 |
| `Utils.readAstralZipText(archive, fileName)` | `archive: IAstralZip.Zip`；`fileName: string` | `Promise<string>` | 读取 ZIP 内 UTF-8 文本。 |
| `Utils.readAstralZipArrayBuffer(archive, fileName)` | `archive: IAstralZip.Zip`；`fileName: string` | `Promise<ArrayBuffer>` | 读取 ZIP 内二进制文件。 |
| `Utils.readAstralZipBlob(archive, fileName)` | `archive: IAstralZip.Zip`；`fileName: string` | `Promise<Blob>` | 读取 ZIP 内 Blob。 |

## Utils.signals

### SignalsRegister

`Utils.SignalsRegister` 是全局 signal 注册表，结构为：

```ts
interface SignalObj<T = any> {
  add(listener: (...params: T[]) => void, listenerContext?: any, priority?: Number): void
  addOnce(listener: (...params: T[]) => void, listenerContext?: any, priority?: Number): void
  dispatch(...params: T[]): void
  remove(listener: (...params: T[]) => void, context?: any): void
  removeAll(): void
  setActive(active: boolean): void
  halt(): void
  dispose(): void
  has(listener: (...params: T[]) => void, context?: any): boolean
  active: boolean
}
```

### SignalsRegisterFn

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Utils.SignalsRegisterFn(newSignals)` | `newSignals: string[]` | `void` | 批量注册新的 signal 名称。 |

## Utils.logger 与 ILog

`Utils.logger` 是默认日志实例。

### ILog

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 日志 id。 |
| `message` | `string` | 日志内容。 |
| `time` | `string` | 日志时间。 |
| `level` | `string` | 日志级别。 |

### logger 成员与方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Logger.Enum` | 无 | `{ TRACE, DEBUG, INFO, WARN, ERROR }` | 日志级别常量。 |
| `enabled` | `boolean` | 当前值 | 是否启用日志记录。 |
| `logs` | `ILog[]` | 当前值 | 日志列表。 |
| `log(methodName, message)` | `methodName: string`；`message: string` | `void` | 按方法名记录日志。 |
| `trace(message)` | `message: string` | `void` | 记录 trace。 |
| `debug(message)` | `message: string` | `void` | 记录 debug。 |
| `info(message)` | `message: string` | `void` | 记录 info。 |
| `warn(message)` | `message: string` | `void` | 记录 warn。 |
| `error(message)` | `message: string` | `void` | 记录 error。 |
| `delLog(log)` | `log: ILog` | `void` | 删除指定日志。 |
| `clearLogs()` | 无 | `void` | 清空日志。 |
| `historyChanged(cmd)` | `cmd: any` | `void` | 历史记录变化时记录命令信息。 |
| `dispose()` | 无 | `void` | 释放日志监听。 |

## Hooks

`Hooks` 是 signal 的便捷 API。它操作的是同一份 `SignalsRegister`。

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `Hooks.useSignal()` | 无 | `SignalMethods` | 获取一组 signal 操作方法。 |
| `Hooks.useAddSignal(signalName, listener, listenerContext, priority)` | `signalName: string`；`listener: (...params: any) => void`；`listenerContext?: any`；`priority?: Number` | `void` | 给 signal 添加监听。 |
| `Hooks.useAddOnceSignal(signalName, listener, listenerContext, priority)` | `signalName: string`；`listener: (...params: any) => void`；`listenerContext?: any`；`priority?: number` | `void` | 添加只执行一次的监听。 |
| `Hooks.useDispatchSignal(signalName, ...arg)` | `signalName: string`；`...arg: any[]` | `void` | 派发 signal。 |
| `Hooks.useRemoveSignal(signalName, listener)` | `signalName: string`；`listener: (...params: any) => void` | `void` | 移除指定监听。 |
| `Hooks.useSetSignalActive(signalName, active)` | `signalName: string`；`active: boolean` | `void` | 启用或暂停指定 signal。 |

`SignalMethods` 包含：

| 方法 | 参数 | 说明 |
| --- | --- | --- |
| `add` | `signalName, listener, listenerContext?, priority?` | 添加监听。 |
| `addOnce` | `signalName, listener, listenerContext?, priority?` | 添加一次性监听。 |
| `dispatch` | `signalName, ...params` | 派发。 |
| `remove` | `signalName, listener, context?` | 移除监听。 |
| `removeAll` | `signalName` | 移除某个 signal 的全部监听。 |
| `setActive` | `signalName, active` | 启用或禁用。 |
| `halt` | `signalName` | 中断 signal。 |
| `dispose` | `signalName` | 销毁 signal。 |
| `has` | `signalName, listener, context?` | 判断监听是否存在。 |

## 使用建议

高频路径里不要直接打日志，也不要滥用 signal 派发。鼠标移动、拖拽、动画更新这类场景，如果需要观测，先加开关和节流；如果只是修改对象状态，尽量合并到一帧一次的 signal 或命令提交。
