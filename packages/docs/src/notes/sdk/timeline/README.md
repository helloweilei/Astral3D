---
lang: zh-CN
title: Timeline
createTime: 2026/06/09 00:00:00
---

# Timeline

SDK 导出了两层时间轴能力：

```ts
import { TimelineTrack, Timeline } from '@astral3d/engine'
```

`TimelineTrack` 是面向 Astral3D 动画编辑的轨道封装；`Timeline` 命名空间来自底层 canvas 时间轴库，里面包含时间轴组件、模型、样式、枚举、事件对象和工具类。

## TimelineTrack

`TimelineTrack` 继承 `THREE.EventDispatcher`，用于把 three.js `AnimationAction`、`KeyframeTrack` 和底层 Timeline 组件接起来。

### 类型

| API | 成员 | 说明 |
| --- | --- | --- |
| `ITimelineKeyframe` | 继承 `Timeline.TimelineKeyframe`，新增 `data: number[] | boolean[]` | Astral3D 关键帧数据。 |
| `ITimelineRow` | 继承 `Timeline.TimelineRow`，新增 `id: string`、`name: string`、`keyframes?: ITimelineKeyframe[]`、`track?: THREE.KeyframeTrack` | Astral3D 轨道行。 |
| `ITimelineModel` | 继承 `Timeline.TimelineModel`，新增 `rows: ITimelineRow[]` | Astral3D 时间轴模型。 |

### 构造函数

```ts
new TimelineTrack(container, outlineContainer, options)
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `container` | `HTMLDivElement` | 时间轴主容器。 |
| `outlineContainer` | `HTMLDivElement` | 左侧轨道大纲容器。 |
| `options` | `Timeline.TimelineOptions` | 时间轴配置。 |

### 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `container` | `HTMLDivElement` | 主容器。 |
| `outlineContainer` | `HTMLDivElement` | 大纲容器。 |
| `timeline` | `Timeline.Timeline` | 底层时间轴实例。 |
| `model` | `ITimelineModel` | 当前时间轴数据模型。 |
| `options` | `Timeline.TimelineOptions` | 当前配置。 |
| `bindAction` | `THREE.AnimationAction | null` | 当前绑定的动画 action。 |
| `_maxDuration` | `get number` | 当前轨道最大时长。 |

### 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `init()` | 无 | `Timeline.Timeline` | 初始化底层 Timeline。 |
| `initEvent()` | 无 | `void` | 绑定时间轴事件。 |
| `updateTrackLength()` | 无 | `void` | 更新时间轴长度，默认可视区域是一分钟。 |
| `setRows(rows)` | `rows: ITimelineRow[]` | `void` | 设置轨道行。`model.rows` 应只通过此方法变更。 |
| `setRowIsVisible(keys, visible)` | `keys: string[]`；`visible: boolean` | `void` | 设置指定轨道行显隐。 |
| `handleMixerUpdate(mixer, delta)` | `mixer: THREE.AnimationMixer`；`delta: number` | `void` | 动画混合器更新时同步时间轴。 |
| `deleteRow(row)` | `row: ITimelineRow` | `void` | 删除轨道行。 |
| `addKeyframe(attr)` | `attr: string` | `void` | 添加关键帧。`attr` 通常是 `position`、`rotation`、`quaternion` 或 `scale`。 |
| `onKeyframeChanged(args)` | `args: Timeline.TimelineKeyframeChangedEvent` | `void` | 关键帧拖动变化回调。 |
| `deleteSelectedKeyframes()` | 无 | `void` | 删除当前选中的关键帧。 |
| `resize()` | 无 | `void` | 重算时间轴尺寸。 |
| `play()` | 无 | `void` | 播放绑定 action。 |
| `pause()` | 无 | `void` | 暂停或继续绑定 action。 |
| `stop()` | 无 | `void` | 停止绑定 action。 |
| `setOptions(options)` | `options: Timeline.TimelineOptions` | `void` | 更新配置。 |
| `dispose()` | 无 | `void` | 释放 resize observer、事件和底层时间轴。 |

## Timeline 命名空间导出

`Timeline` 是命名空间。下面所有名字都通过 `Timeline.xxx` 访问。

## 核心类：Timeline

底层 `Timeline.Timeline` 是 canvas 时间轴组件。它公开了大量 `_` 前缀成员；这些成员已经在类型声明里暴露，但语义上仍是内部实现，业务应优先使用无下划线的 API。

### 构造函数

```ts
new Timeline.Timeline(options?: TimelineOptions | null, model?: TimelineModel | null)
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `options` | `TimelineOptions | null` | 时间轴配置。 |
| `model` | `TimelineModel | null` | 时间轴数据模型。 |

### 主要公开成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `_container` | `HTMLElement | null` | 组件容器。 |
| `_canvas` | `HTMLCanvasElement | null` | 内部 canvas。 |
| `_scrollContainer` | `HTMLElement | null` | 滚动容器。 |
| `_scrollContent` | `HTMLElement | null` | 虚拟滚动内容。 |
| `_ctx` | `CanvasRenderingContext2D | null` | 绘制上下文。 |
| `_options` | `TimelineOptions` | 当前配置。 |
| `_model` | `TimelineModel | null` | 当前模型。 |
| `_val` | `number` | 当前时间值。 |
| `_currentZoom` | `number` | 当前缩放。 |
| `_interactionMode` | `TimelineInteractionMode` | 当前交互模式。 |
| `_drag` | `TimelineDraggableData | null` | 当前拖拽状态。 |
| `_consts` | `TimelineConsts` | 内部常量配置。 |
| `scrollLeft` | `get/set number` | 横向滚动位置。 |
| `scrollTop` | `get/set number` | 纵向滚动位置。 |

### 推荐业务使用的方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `initialize(options, model)` | `options: TimelineOptions | null`；`model: TimelineModel | null` | `void` | 初始化组件。 |
| `dispose()` | 无 | `void` | 释放 DOM 事件和用户事件。 |
| `zoomIn(speed)` | `speed?: number` | `void` | 放大。`speed` 范围通常是 0 到 1。 |
| `zoomOut(speed)` | `speed?: number` | `void` | 缩小。 |
| `setZoom(zoom)` | `zoom: number` | `number` | 设置缩放并返回归一化后的值。 |
| `getZoom()` | 无 | `number` | 获取当前缩放。 |
| `setInteractionMode(mode)` | `mode: TimelineInteractionMode` | `void` | 设置交互模式。 |
| `getInteractionMode()` | 无 | `TimelineInteractionMode` | 获取交互模式。 |
| `getSelectedKeyframes()` | 无 | `TimelineKeyframe[]` | 获取选中关键帧。 |
| `getSelectedElements()` | 无 | `TimelineElement[]` | 获取选中元素。 |
| `getAllKeyframes()` | 无 | `TimelineKeyframe[]` | 获取全部关键帧。 |
| `selectAllKeyframes()` | 无 | `TimelineSelectionResults` | 全选关键帧。 |
| `deselectAll()` | 无 | `TimelineSelectionResults` | 取消所有选择。 |
| `select(nodes, mode)` | `nodes: TimelineKeyframe[] | TimelineKeyframe | null`；`mode?: TimelineSelectionMode` | `TimelineSelectionResults` | 选择关键帧。 |
| `pxToVal(px)` | `px: number` | `number` | 屏幕像素转时间轴值。 |
| `valToPx(val)` | `val: number` | `number` | 时间轴值转屏幕像素。 |
| `snapVal(val)` | `val: number` | `number` | 将值吸附到最近网格。 |
| `redraw()` | 无 | `void` | 重绘时间轴。 |
| `scrollToRightBounds()` | 无 | `void` | 滚动到最右侧。 |
| `getTime()` | 无 | `number` | 获取当前时间。 |
| `setTime(val)` | `val: number` | `boolean` | 设置当前时间。返回是否成功设置。 |
| `getOptions()` | 无 | `TimelineOptions` | 获取配置。 |
| `setOptions(toSet)` | `toSet: TimelineOptions` | `TimelineOptions` | 合并配置并重绘。 |
| `getModel()` | 无 | `TimelineModel | null` | 获取模型。 |
| `setModel(data)` | `data: TimelineModel` | `void` | 设置模型并重绘。 |
| `getClientWidth()` | 无 | `number` | 获取滚动容器宽度。 |
| `getClientHeight()` | 无 | `number` | 获取滚动容器高度。 |
| `rescale()` | 无 | `boolean` | 重新计算 canvas 缩放和尺寸。 |
| `elementFromPoint(pos, clickRadius, onlyTypes)` | `pos: DOMPoint`；`clickRadius: number`；`onlyTypes?: TimelineElementType[] | null` | `TimelineElement[]` | 获取坐标下的可点击元素。 |

### 事件订阅方法

| API | 参数 | 说明 |
| --- | --- | --- |
| `onTimeChanged(callback)` | `(eventArgs: TimelineTimeChangedEvent) => void` | 监听当前时间变化。 |
| `onDragStarted(callback)` | `(eventArgs: TimelineDragEvent) => void` | 监听拖拽开始。 |
| `onDrag(callback)` | `(eventArgs: TimelineDragEvent) => void` | 监听拖拽过程。 |
| `onDragFinished(callback)` | `(eventArgs: TimelineDragEvent) => void` | 监听拖拽结束。 |
| `onDoubleClick(callback)` | `(eventArgs: TimelineClickEvent) => void` | 监听双击。 |
| `onKeyframeChanged(callback)` | `(eventArgs: TimelineKeyframeChangedEvent) => void` | 监听关键帧位置变化。 |
| `onMouseDown(callback)` | `(eventArgs: TimelineClickEvent) => void` | 监听鼠标按下。 |
| `onSelected(callback)` | `(eventArgs: TimelineSelectedEvent) => void` | 监听选择变化。 |
| `onScroll(callback)` | `(eventArgs: TimelineScrollEvent) => void` | 监听滚动。 |
| `onScrollFinished(callback)` | `(eventArgs: TimelineScrollEvent) => void` | 监听滚动结束。 |
| `onContextMenu(callback)` | `(eventArgs: TimelineClickEvent) => void` | 监听右键菜单。 |

### 内部暴露方法

下列 `_` 前缀方法来自底层组件，类型声明中可见。它们用于容器生成、事件处理、绘制、拖拽、选择、滚动和事件派发。业务通常不应直接调用；如果确实要用，最好包一层适配器，避免底层实现变更影响业务。

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `_generateContainers(id)` | `id: string | HTMLElement` | `void` | 创建容器、canvas 和滚动 DOM。 |
| `_getCtx()` | 无 | `CanvasRenderingContext2D | null` | 获取绘制上下文。 |
| `_subscribeComponentEvents()` | 无 | `void` | 订阅组件 DOM/窗口事件。 |
| `_unsubscribeComponentEvents()` | 无 | `void` | 移除组件事件。 |
| `_handleKeyUp(event)` | `KeyboardEvent` | `void` | 键盘抬起处理。 |
| `_handleKeyDown(event)` | `KeyboardEvent` | `void` | 键盘按下处理。 |
| `_setZoomCursor(e)` | `MouseEvent | KeyboardEvent` | `void` | 设置缩放模式游标。 |
| `_handleBlurEvent()` | 无 | `void` | 窗口失焦处理。 |
| `_handleWindowResizeEvent()` | 无 | `void` | 窗口尺寸变化处理。 |
| `_clearScrollFinishedTimer()` | 无 | `void` | 清理滚动结束计时器。 |
| `_handleScrollMouseDownEvent()` | 无 | `void` | 滚动区域鼠标按下处理。 |
| `_handleScrollEvent(args)` | `Event` | `void` | 滚动事件处理。 |
| `_controlKeyPressed(e)` | `MouseEvent | KeyboardEvent | TouchEvent` | `boolean` | 判断控制键是否按下。 |
| `_handleWheelEvent(event)` | `WheelEvent` | `void` | 滚轮缩放/滚动处理。 |
| `_zoom(direction, speed, x)` | `direction: number`；`speed: number`；`x: number` | `void` | 内部缩放实现。 |
| `_setZoom(zoom, min, max)` | `zoom: number`；`min?: number | null`；`max?: number | null` | `number` | 设置直接缩放值。 |
| `_getClickDetectionRadius(point)` | `TimelineMouseData` | `number` | 计算点击检测半径。 |
| `_handleContextMenu(args)` | `MouseEvent | TouchEvent` | `void` | 右键菜单事件处理。 |
| `_handleMouseDownEvent(args)` | `MouseEvent | TouchEvent` | `void` | 鼠标按下处理。 |
| `_setElementDragState(element, val)` | `TimelineElement | TimelineElementDragState`；`val: number` | `TimelineElementDragState` | 创建元素拖拽状态。 |
| `isLeftButtonClicked(args)` | `MouseEvent | TouchEvent | any` | `boolean` | 判断是否左键。 |
| `_handleMouseMoveEvent(args)` | `MouseEvent | TouchEvent | null` | `void` | 鼠标移动处理。 |
| `_moveElements(offset, elements, source)` | `offset: number`；`elements: TimelineElementDragState[]`；`source?: TimelineEventSource` | `number` | 移动元素并返回实际移动值。 |
| `_handleMouseUpEvent(args)` | `MouseEvent | TouchEvent` | `void` | 鼠标抬起处理。 |
| `_canvasClientHeight()` | 无 | `number` | canvas 客户区高度。 |
| `_canvasClientWidth()` | 无 | `number` | canvas 客户区宽度。 |
| `_getKeyframesByRectangle(screenRect)` | `DOMRect` | `TimelineKeyframe[]` | 获取矩形内关键帧。 |
| `_performClick(pos, drag)` | `TimelineMouseData`；`TimelineDraggableData | null` | `boolean` | 执行点击逻辑。 |
| `_setKeyframePos(element, value, source)` | `TimelineElementDragState`；`value: number`；`source?: TimelineEventSource` | `number` | 设置关键帧位置。 |
| `_setCursor(cursor)` | `cursor: string` | `void` | 设置 canvas 游标。 |
| `_convertToTimelineElement(rowModel, keyframe)` | `TimelineRow | null`；`TimelineKeyframe` | `TimelineElement` | 转成可点击元素。 |
| `_selectInternal(nodes, mode)` | `TimelineKeyframe[] | TimelineKeyframe | null`；`mode?: TimelineSelectionMode` | `TimelineSelectionResults` | 内部选择实现。 |
| `_forEachKeyframe(callback, onRowCallback)` | `(keyframeViewModel, index?, newRow?) => void`；`(rowViewModel) => void` | `void` | 遍历可见关键帧。 |
| `_trackMousePos(canvas, mouseArgs)` | `HTMLCanvasElement`；`MouseEvent | TouchEvent` | `TimelineMouseData` | 计算鼠标数据。 |
| `_cleanUpSelection(forcePrevent)` | `forcePrevent?: boolean` | `void` | 清理选择状态。 |
| `_clickTimeoutIsOver()` | 无 | `boolean` | 判断点击超时。 |
| `_startAutoPan()` | 无 | `void` | 开始自动平移。 |
| `_stopAutoPan()` | 无 | `void` | 停止自动平移。 |
| `_checkUpdateSpeedTooFast()` | 无 | `boolean` | 判断自动平移更新是否过快。 |
| `_scrollByPan(start, pos, scrollStartPos)` | `DOMPoint`；`DOMPoint`；`DOMPoint | null` | `void` | 平移模式滚动。 |
| `_scrollBySelectionOutOfBounds(pos)` | `DOMPoint` | `boolean` | 框选越界时滚动。 |
| `_toScreenPx(val)` | `number` | `number` | 值转本地屏幕坐标。 |
| `_fromScreen(px)` | `number` | `number` | 屏幕坐标转全局值。 |
| `_mousePosToVal(x, snapEnabled)` | `x: number`；`snapEnabled?: boolean` | `number` | 鼠标 x 转时间轴值。 |
| `_formatUnitsText(ms)` | `ms: number` | `string` | 格式化刻度文本。 |
| `_leftMargin()` | 无 | `number` | 获取左边距。 |
| `_renderTicks()` | 无 | `void` | 渲染刻度。 |
| `_generateViewModel()` | 无 | `TimelineViewModel` | 生成绘制视图模型。 |
| `_renderRows()` | 无 | `void` | 渲染轨道行。 |
| `_renderGroupBounds(rowViewModel)` | `TimelineRowViewModel` | `void` | 渲染组边界。 |
| `_cutBounds(rect)` | `DOMRect` | `TimelineCutBoundsRectResults | null` | 裁剪绘制范围。 |
| `_cutBoundsWhenOverlap(rect, minX, maxX, minY, maxY)` | `DOMRect` 和边界值 | `TimelineCutBoundsRectResults | null` | 有重叠时裁剪绘制范围。 |
| `_getKeyframesGroupSize(groupViewModel, rowViewModel)` | `TimelineGroupViewModel`；`TimelineRowViewModel` | `DOMRect` | 计算关键帧组尺寸。 |
| `_getKeyframePosition(keyframe, groupViewModel, rowViewModel, keyframeShape)` | `TimelineKeyframe`；`TimelineGroupViewModel`；`TimelineRowViewModel`；`TimelineKeyframeShape` | `DOMRect | null` | 计算关键帧绘制位置。 |
| `_renderKeyframes()` | 无 | `void` | 渲染关键帧。 |
| `_renderKeyframe(ctx, keyframeViewModel)` | `CanvasRenderingContext2D`；`TimelineKeyframeViewModel` | `void` | 渲染单个关键帧。 |
| `_renderSelectionRect()` | 无 | `void` | 渲染选择框。 |
| `_renderBackground()` | 无 | `void` | 渲染背景。 |
| `_renderTimeline()` | 无 | `void` | 渲染当前时间线。 |
| `_renderTimelineCap(timeLinePos, y)` | `number`；`number` | `void` | 渲染时间线顶部帽。 |
| `_renderHeaderBackground()` | 无 | `void` | 渲染头部背景。 |
| `_redrawInternal()` | 无 | `void` | 内部重绘流程。 |
| `_getSharp(pos, thickness)` | `pos: number`；`thickness?: number` | `number` | 获取清晰像素位置。 |
| `_setTimeInternal(val, source)` | `val: number`；`source?: TimelineEventSource` | `boolean` | 内部设置时间。 |
| `_applyContainersStyles()` | 无 | `void` | 应用容器样式。 |
| `_setOptions(toSet)` | `TimelineOptions` | `TimelineOptions` | 内部合并配置。 |
| `_getMousePos(canvas, e)` | `HTMLCanvasElement`；`TouchEvent | MouseEvent | any` | `TimelineMouseData` | 获取鼠标数据。 |
| `_updateCanvasScale()` | 无 | `boolean` | 更新 canvas 缩放。 |
| `_rescaleInternal(newWidth, newHeight, scrollMode)` | `number | null`；`number | null`；`TimelineScrollSource` | `boolean` | 内部重算尺寸。 |
| `_filterDraggableElements(elements)` | `TimelineElement[]` | `TimelineElement[]` | 过滤可拖拽元素。 |
| `_findDraggableElement(elements, val)` | `TimelineElement[]`；`val?: number | null` | `TimelineElement | null` | 找到最接近的可拖拽元素。 |
| `_emitScrollEvent(args, scrollProgrammatically, eventType)` | `Event | null`；`boolean`；`TimelineEvents` | `TimelineScrollEvent` | 派发滚动事件。 |
| `_emitKeyframeChanged(element, source)` | `TimelineElementDragState`；`TimelineEventSource` | `TimelineKeyframeChangedEvent` | 派发关键帧变化。 |
| `_emitDragStartedEvent(dragState)` | `TimelineDraggableData` | `TimelineDragEvent | null` | 派发拖拽开始。 |
| `_emitDragFinishedEvent(dragState, forcePrevent)` | `TimelineDraggableData`；`forcePrevent?: boolean` | `TimelineDragEvent | null` | 派发拖拽结束。 |
| `_preventDrag(dragArgs, data, toStart)` | `TimelineDragEvent`；`TimelineDraggableData`；`toStart?: boolean` | `void` | 阻止拖拽并恢复状态。 |
| `_emitDragEvent(dragState)` | `TimelineDraggableData` | `TimelineDragEvent | null` | 派发拖拽中。 |
| `_emitKeyframesSelected(state)` | `TimelineSelectionResults` | `TimelineSelectedEvent` | 派发选择变化。 |
| `_getDragEventArgs(dragState, point)` | `TimelineDraggableData`；`TimelineMouseData | null` | `TimelineDragEvent` | 组装拖拽事件参数。 |

## TimelineEventsEmitter

| 成员或方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `_subscriptions` | 无 | `TimelineEvent[]` | 当前订阅列表。 |
| `on(topic, callback)` | `topic: string`；`callback: (args) => void` | `boolean` | 订阅事件。 |
| `off(topic, callback)` | `topic: string`；`callback: (args) => void` | `boolean` | 移除订阅。 |
| `offAll()` | 无 | `void` | 移除全部订阅。 |
| `emit(topic, args)` | `topic: string`；`args: T` | `void` | 派发事件。 |

## 模型接口

| API | 成员 | 说明 |
| --- | --- | --- |
| `TimelineModel` | `rows: TimelineRow[]` | 时间轴数据根模型。 |
| `TimelineRow` | `style?`、`keyframes?`、`hidden?`、`keyframesDraggable?`、`groupsDraggable?`、`min?`、`max?` | 一行轨道。 |
| `TimelineKeyframe` | `val`、`group?`、`style?`、`hidden?`、`draggable?`、`selected?`、`selectable?`、`min?`、`max?` | 关键帧。 |
| `TimelineGroup` | `style`、`keyframesStyle?`、`draggable?`、`keyframesDraggable?`、`hidden?` | 关键帧组。 |
| `TimelineRanged` | `min?: number | null`、`max?: number | null` | 带范围限制的基础接口。 |
| `TimelineSelectable` | `selected?: boolean`、`selectable?: boolean` | 可选择对象基础接口。 |

## 配置与样式

### TimelineOptions

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string | HTMLElement | null` | 容器 id 或元素。 |
| `snapEnabled` | `boolean` | 是否启用吸附。 |
| `snapAllKeyframesOnMove` | `boolean` | 拖动时是否把所有选中关键帧作为整体吸附。 |
| `stepPx` | `number` | 时间轴 1 秒近似像素步长。 |
| `stepVal` | `number` | 一个步骤包含的值。 |
| `stepSmallPx` | `number` | 小刻度像素步长。 |
| `snapStep` | `number` | 吸附步长。 |
| `leftMargin` | `number` | 左边距。 |
| `headerFillColor` | `string` | 头部背景色。 |
| `fillColor` | `string` | 组件背景色。 |
| `labelsColor` | `string` | 标题文字颜色。 |
| `tickColor` | `string` | 刻度颜色。 |
| `selectionColor` | `string` | 选择框颜色。 |
| `headerHeight` | `number` | 头部高度。 |
| `font` | `string` | 刻度字体。 |
| `zoom` | `number` | 默认缩放。 |
| `zoomSpeed` | `number` | 缩放速度。 |
| `zoomMin` | `number` | 最小缩放。 |
| `zoomMax` | `number` | 最大缩放。 |
| `controlKeyIsMetaKey` | `boolean` | macOS 下是否使用 Meta 作为控制键。 |
| `scrollContainerClass` | `string` | 滚动容器类名。 |
| `rowsStyle` | `TimelineRowStyle` | 默认轨道行样式。 |
| `timelineStyle` | `TimelineStyle` | 当前时间线样式。 |
| `groupsDraggable` | `boolean` | 组是否可拖拽。 |
| `keyframesDraggable` | `boolean` | 关键帧是否可拖拽。 |
| `timelineDraggable` | `boolean` | 当前时间线是否可拖动。 |
| `denominators` | `number[]` | 刻度美化分母列表。 |
| `min` / `max` | `number | null` | 值范围限制。 |

### 样式接口

| API | 成员 | 说明 |
| --- | --- | --- |
| `TimelineCapStyle` | `width?`、`height?`、`strokeColor?`、`fillColor?`、`capType?` | 当前时间线顶部帽样式。 |
| `TimelineGroupStyle` | `height?`、`strokeColor?`、`strokeThickness?`、`radii?`、`fillColor?`、`cursor?`、`marginTop?`、`keyframesStyle?`、`text?` | 关键帧组样式。 |
| `TimelineKeyframeStyle` | `cursor?`、`shape?`、`height?`、`width?`、`fillColor?`、`selectedFillColor?`、`strokeColor?`、`selectedStrokeColor?`、`strokeThickness?` | 关键帧样式。 |
| `TimelineRowStyle` | `height?`、`fillColor?`、`marginBottom?`、`keyframesStyle?`、`groupsStyle?` | 轨道行样式。 |
| `TimelineStyle` | `width?`、`marginTop?`、`marginBottom?`、`capStyle?`、`strokeColor?`、`fillColor?`、`cursor?` | 当前时间线样式。 |

### 默认配置

| API | 类型 | 说明 |
| --- | --- | --- |
| `defaultRowHeight` | `24` | 默认轨道行高度。 |
| `defaultGroupStyle` | `TimelineGroupStyle` | 默认组样式。 |
| `defaultTimelineConsts` | `TimelineConsts` | 默认内部常量。 |
| `defaultTimelineKeyframeStyle` | `TimelineKeyframeStyle` | 默认关键帧样式。 |
| `defaultTimelineOptions` | `TimelineOptions` | 默认时间轴配置。 |
| `defaultTimelineRowStyle` | `TimelineRowStyle` | 默认轨道行样式。 |
| `defaultTimelineStyle` | `TimelineStyle` | 默认当前时间线样式。 |

### TimelineConsts

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `autoPanSpeed` | `number` | 自动平移速度。 |
| `scrollByDragSpeed` | `number` | 拖拽滚动速度。 |
| `clickDetectionMs` | `number` | 点击判定时间。 |
| `doubleClickTimeoutMs` | `number` | 双击判定时间。 |
| `scrollFinishedTimeoutMs` | `number` | 滚动结束判定时间。 |
| `autoPanByScrollPadding` | `number` | 自动平移边距。 |
| `clickThreshold` | `number` | 点击阈值。 |
| `clickDetectionMinRadius` | `number` | 元素点击检测最小半径。 |
| `autoPanSpeedLimit` | `number` | 自动平移速度上限。 |
| `defaultGroupHeight` | `number` | 默认组高度。 |

## 枚举

| API | 枚举项 |
| --- | --- |
| `TimelineCapShape` | `None = 'none'`、`Triangle = 'triangle'`、`Rect = 'rect'` |
| `TimelineCursorType` | `Alias`、`AllScroll`、`Auto`、`Cell`、`ContextMenu`、`ColResize`、`Copy`、`Crosshair`、`Default`、`EResize`、`EWResize`、`Grab`、`Grabbing`、`Help`、`Move`、`NResize`、`NEResize`、`NESWResize`、`NSResize`、`NWResize`、`NWSEResize`、`NoDrop`、`None`、`NotAllowed`、`Pointer`、`Progress`、`RowResize`、`SResize`、`SEResize`、`SWResize`、`Text`、`WResize`、`Wait`、`ZoomIn`、`ZoomOut` |
| `TimelineElementType` | `Timeline = 'timeline'`、`Keyframe = 'keyframe'`、`Group = 'group'`、`Row = 'row'`、`None = 'none'` |
| `TimelineEvents` | `Selected`、`TimeChanged`、`KeyframeChanged`、`DragStarted`、`Drag`、`DragFinished`、`Scroll`、`ScrollFinished`、`ContextMenu`、`DoubleClick`、`MouseDown`、`Zoom` |
| `TimelineEventSource` | `User = 'user'`、`Programmatically = 'programmatically'`、`SetTimeMethod = 'setTimeMethod'` |
| `TimelineInteractionMode` | `Selection = 'selection'`、`Pan = 'pan'`、`NonInteractivePan = 'nonInteractivePan'`、`Zoom = 'zoom'`、`None = 'none'` |
| `TimelineKeyframeShape` | `None = 'none'`、`Rhomb = 'rhomb'`、`Circle = 'circle'`、`Rect = 'rect'` |
| `TimelineScrollSource` | `DefaultMode = 'none'`、`ZoomMode = 'zoom'`、`ScrollBySelection = 'scrollBySelection'` |
| `TimelineSelectionEventSource` | `Keyframes = 'keyframes'` |
| `TimelineSelectionMode` | `Normal = 'normal'`、`Append = 'append'`、`Revert = 'revert'` |

## 工具类

### TimelineUtils

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `drawLine(ctx, x1, y1, x2, y2)` | `CanvasRenderingContext2D` 和坐标 | `void` | 绘制线段。 |
| `isNumber(val)` | `val?: number | null` | `boolean` | 判断有效数字。 |
| `deleteElement(array, element)` | `array: T[]`；`element: T` | `T[]` | 删除数组元素。 |
| `isOverlap(x, y, rectangle)` | `x: number`；`y: number`；`rectangle: DOMRect` | `boolean` | 判断点是否落在矩形内。 |
| `findGoodStep(originalStep, divisionCheck, denominators)` | `number`；`number?`；`number[]?` | `number` | 计算美观刻度步长。 |
| `keepInBounds(value, min, max)` | `value: number`；`min?: number | null`；`max?: number | null` | `number` | 限制数值范围。 |
| `setMinMax(to, from, shrink)` | `TimelineRanged`；`TimelineRanged | null`；`shrink?: boolean` | `TimelineRanged` | 合并范围。 |
| `shrinkSelf(rect, value)` | `DOMRect`；`number` | `DOMRect` | 矩形内缩。 |
| `isRectIntersects(rect, rect2, touch)` | `DOMRect`；`DOMRect`；`touch?: boolean` | `boolean` | 判断矩形相交。 |
| `getDistance(x1, y1, x2, y2)` | 坐标 | `number` | 计算距离。 |
| `sign(p)` | `p: number` | `number` | 返回 `1` 或 `-1`。 |
| `clearBrowserSelection()` | 无 | `void` | 清理浏览器文本选择。 |
| `getPowArgument(toCheck)` | `toCheck: number` | `number` | 获取幂参数。 |
| `deepClone(previousOptions)` | `previousOptions: T` | `T` | 深拷贝。 |
| `cloneOptions(previousOptions)` | `TimelineOptions` | `TimelineOptions` | 克隆配置。 |
| `mergeOptions(previousOptions, newOptions)` | `TimelineOptions`；`TimelineOptions` | `TimelineOptions` | 合并配置。 |
| `timePadZero(num, len)` | `num: number`；`len?: number` | `string` | 数字补零。 |

### TimelineStyleUtils

`TimelineStyleUtils` 用于从 keyframe、group、row、options 多层配置中取最终样式。所有方法都是静态方法。

| API | 说明 |
| --- | --- |
| `getGroup(groupModel)`、`getGroupStyle(groupModel)` | 获取组模型或组样式。 |
| `getFirstSet(defaultValue, ...params)`、`getValue(defaultValue, returnFalseIfAnyFalse, ...params)`、`getValueOrDefault(value, defaultValue)` | 按优先级取配置值。 |
| `keyframeWidth()`、`keyframeHeight()`、`keyframeShape()`、`keyframeFillColor()`、`keyframeSelectedFillColor()`、`keyframeStrokeThickness()`、`keyframeStrokeColor()`、`keyframeSelectedStrokeColor()` | 计算关键帧最终样式。 |
| `groupHeight()`、`groupMarginTop()`、`groupFillColor()`、`groupStrokeColor()`、`groupStrokeThickness()`、`groupsRadii()`、`groupText()` | 计算组最终样式。 |
| `getRowHeight()`、`getRowMarginBottom()`、`getRowFillColor()`、`headerHeight()` | 计算轨道行和头部样式。 |
| `keyframeDraggable()`、`groupDraggable()` | 判断关键帧或组是否可拖拽。 |

## 事件对象与辅助数据

| API | 成员或方法 | 说明 |
| --- | --- | --- |
| `TimelineBaseEvent` | `preventDefault()`、`isPrevented()` | 可阻止默认逻辑的事件基类。 |
| `TimelineClickEvent` | `args`、`pos`、`val`、`elements`、`target`、`point` | 点击、双击、右键事件参数。 |
| `TimelineDragEvent` | `args`、`pos`、`elements`、`target`、`point`、`prevPoint` | 拖拽事件参数。 |
| `TimelineKeyframeChangedEvent` | `val`、`prevVal`、`target`、`source` | 关键帧值变化事件。 |
| `TimelineTimeChangedEvent` | `val`、`prevVal`、`source` | 当前时间变化事件。 |
| `TimelineSelectedEvent` | `selected`、`changed`、`mode` | 选择变化事件。 |
| `TimelineScrollEvent` | `args`、`scrollProgrammatically`、`scrollLeft`、`scrollTop`、`scrollHeight`、`scrollWidth` | 滚动事件。 |
| `TimelineDraggableData` | `changed`、`target`、`elements`、`type`、`val`、`prevVal` | 当前拖拽状态。 |
| `TimelineElement` | `type`、`val`、`keyframe?`、`row?`、`group?`、`keyframes?` | 可点击元素。 |
| `TimelineElementDragState` | `startedVal`、`prevVal`，并继承 `TimelineElement` | 拖拽中的元素状态。 |
| `TimelineMouseData` | `args`、`radius?`，并继承 `TimelinePoint` | 鼠标位置数据。 |
| `TimelinePoint` | `val`、`snapVal`、`originalVal`、`pos` | 值和屏幕点。 |
| `TimelineSelectionResults` | `changed`、`selected`、`selectionChanged` | 选择结果。 |
| `TimelineCutBoundsRectResults` | `rect`、`overlapY`、`overlapX` | 绘制裁剪结果。 |
| `TimelineGroupViewModel` | `size`、`min`、`max`、`groupModel`、`keyframesViewModels` | 组视图模型。 |
| `TimelineKeyframeViewModel` | `size`、`shape`、`model`、`rowViewModel`、`groupViewModel` | 关键帧视图模型。 |
| `TimelineRowViewModel` | `size`、`model`、`index`、`marginBottom`、`groupsViewModels`、`keyframesViewModels`、`min`、`max` | 行视图模型。 |
| `TimelineViewModel` | `size`、`keyframesViewModels`、`rowsViewModels`、`min`、`max` | 整体视图模型。 |

## 使用建议

做动画编辑器时，业务层优先使用 `TimelineTrack`。只有你需要完全自定义时间轴 UI 或交互时，再直接使用 `Timeline.Timeline`。底层 `Timeline` 暴露了很多 `_` 方法，能用不代表适合长期依赖；升级 SDK 时要重点回归这些调用点。
