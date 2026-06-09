---
lang: zh-CN
title: DXF
createTime: 2026/06/09 00:00:00
---

# DXF

DXF 能力包含 `DxfParser` 和 `DxfViewer`。前者把 DXF 文本解析成结构化对象，后者把解析结果渲染到 canvas。

```ts
import { DxfParser, DxfViewer } from '@astral3d/engine'

const parser = new DxfParser()
const data = parser.parse(dxfText)
```

## DxfViewer

`DxfViewer` 接收已经解析好的 DXF 数据和一个 `canvas`，优先使用 `OffscreenCanvas + Worker` 渲染；浏览器不支持离屏画布时，会退回主线程渲染。

### 构造参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `data` | `any` | DXF 数据对象，通常来自 `DxfParser.parse`。 |
| `canvas` | `HTMLCanvasElement` | 渲染画布。构造函数会设置画布样式宽高。 |
| `width` | `number` | 初始渲染宽度，单位像素。 |
| `height` | `number` | 初始渲染高度，单位像素。 |
| `onComplete` | `() => void` | 可选，DXF 渲染完成时触发。 |

### 成员与方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `handleSignal(args)` | `args: { type: string; name: string; data: unknown[] }` | `void` | 处理 DXF 渲染线程发回来的信号，目前用于转发 `dispatch` 类型的全局信号。 |
| `callMethod(methodName, data)` | `methodName: string`；`data: any`，默认 `{}`。 | `void` | 向 Worker 或主线程绘制模块发命令。 |
| `dispose()` | 无 | `void` | 终止 Worker 或释放主线程绘制模块，并断开 `ResizeObserver`。 |
| `selectRectIndex` | 无 | `any` | 访问器，返回当前选中的 DXF 标记索引。 |
| `deleteRect()` | 无 | `void` | 删除当前选中的标记。没有选中标记时直接返回。 |
| `selectRect(uuid)` | `uuid: string` | `void` | 根据 ID 选中对应标记。 |

## DxfParser

### 构造函数

```ts
const parser = new DxfParser()
```

构造函数不接收参数，会注册默认实体处理器。内置处理器覆盖 `POINT`、`3DFACE`、`ARC`、`ATTDEF`、`ATTRIB`、`CIRCLE`、`DIMENSION`、`ELLIPSE`、`HATCH`、`INSERT`、`LINE`、`LWPOLYLINE`、`MTEXT`、`POLYLINE`、`SOLID`、`SPLINE`、`TEXT`、`VERTEX`。

### 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `parse(source)` | `source: string \| Readable` | `IDxf \| null` | 解析 DXF。浏览器侧通常传字符串。 |
| `registerEntityHandler(handlerType)` | `handlerType: new () => { ForEntityName: string; parseEntity(scanner, curr): IEntity }` | `void` | 注册自定义实体解析器。实体名相同会覆盖已有映射。 |
| `parseSync(source)` | `source: string` | `IDxf \| null` | 同步解析，适合已经拿到完整文本的场景。 |
| `parseStream(stream)` | `stream: Readable` | `Promise<IDxf>` | 从流里拼接 DXF 文本，结束后解析。 |

## DXF 基础结构

| 类型 | 成员 | 说明 |
| --- | --- | --- |
| `IPoint` | `x: number`、`y: number`、`z: number` | DXF 点或向量。部分二维数据可能没有 `z`。 |
| `IDxf` | `header`、`entities`、`blocks`、`tables` | 解析结果根对象。 |
| `IBlock` | `entities`、`type`、`ownerHandle`、`xrefPath`、`name`、`name2`、`handle`、`layer`、`position`、`paperSpace` | BLOCKS 段中的块定义。 |
| `IEntity` | `lineType`、`layer`、`lineTypeScale`、`visible`、`colorIndex`、`color`、`inPaperSpace`、`ownerHandle`、`materialObjectHandle`、`lineweight`、`extendedData`、`type`、`handle` | 所有实体的公共字段。 |

## DXF 表结构

| 类型 | 成员 | 说明 |
| --- | --- | --- |
| `IBaseTable` | `handle`、`ownerHandle` | 表结构公共字段。 |
| `ITables` | `viewPort`、`lineType`、`layer` | TABLES 段解析结果。 |
| `ITable` | `IViewPortTable \| ILayerTypesTable \| ILayersTable` | 表联合类型。 |
| `IViewPortTable` | `handle`、`ownerHandle`、`viewPorts` | 视口表。 |
| `ILayerTypesTable` | `handle`、`ownerHandle`、`lineTypes` | 线型表。 |
| `ILayersTable` | `handle`、`ownerHandle`、`layers` | 图层表。 |
| `ITableDefinitions` | `VPORT`、`LTYPE`、`LAYER`、`DIMSTYLE`、`STYLE` | 表定义索引。 |
| `IViewPortTableDefinition` | `tableRecordsProperty`、`tableName`、`dxfSymbolName`、`parseTableRecords()` | 视口表定义。 |
| `ILineTypeTableDefinition` | `tableRecordsProperty`、`tableName`、`dxfSymbolName`、`parseTableRecords()` | 线型表定义。 |
| `ILayerTableDefinition` | `tableRecordsProperty`、`tableName`、`dxfSymbolName`、`parseTableRecords()` | 图层表定义。 |

## DXF 表项

| 类型 | 成员 | 说明 |
| --- | --- | --- |
| `IViewPort` | `name`、`lowerLeftCorner`、`upperRightCorner`、`center`、`snapBasePoint`、`snapSpacing`、`gridSpacing`、`viewDirectionFromTarget`、`viewTarget`、`lensLength`、`frontClippingPlane`、`backClippingPlane`、`viewHeight`、`snapRotationAngle`、`viewTwistAngle`、`orthographicType`、`ucsOrigin`、`ucsXAxis`、`ucsYAxis`、`renderMode`、`defaultLightingType`、`defaultLightingOn`、`ownerHandle`、`ambientColor`、`viewMode` | 一个 VPORT 表项。 |
| `ILineType` | `name`、`description`、`pattern`、`patternLength` | 一个 LTYPE 表项。 |
| `ILayer` | `name`、`visible`、`colorIndex`、`color`、`frozen` | 一个 LAYER 表项。 |

## DXF 实体类型

| 类型 | 增量成员 | 说明 |
| --- | --- | --- |
| `I3DfaceEntity` | `shape`、`hasContinuousLinetypePattern`、`vertices` | 3D 面实体。 |
| `IArcEntity` | `center`、`radius`、`startAngle`、`endAngle`、`angleLength`、`extrusionDirectionX`、`extrusionDirectionY`、`extrusionDirectionZ` | 圆弧实体，角度以弧度保存。 |
| `IAttdefEntity` | `scale`、`textStyle`、`text`、`tag`、`prompt`、`startPoint`、`endPoint`、`thickness`、`textHeight`、`rotation`、`obliqueAngle`、`invisible`、`constant`、`verificationRequired`、`preset`、`backwards`、`mirrored`、`horizontalJustification`、`fieldLength`、`verticalJustification`、`extrusionDirectionX`、`extrusionDirectionY`、`extrusionDirectionZ` | 属性定义实体。 |
| `ICircleEntity` | `center`、`radius`、`startAngle`、`endAngle`、`angleLength` | 圆实体。 |
| `IDimensionEntity` | `block`、`anchorPoint`、`middleOfText`、`insertionPoint`、`linearOrAngularPoint1`、`linearOrAngularPoint2`、`diameterOrRadiusPoint`、`arcPoint`、`dimensionType`、`attachmentPoint`、`actualMeasurement`、`text`、`angle` | 标注实体。 |
| `IEllipseEntity` | `center`、`majorAxisEndPoint`、`axisRatio`、`startAngle`、`endAngle`、`name` | 椭圆实体。 |
| `IInsertEntity` | `name`、`xScale`、`yScale`、`zScale`、`position`、`rotation`、`columnCount`、`rowCount`、`columnSpacing`、`rowSpacing`、`extrusionDirection` | 块插入实体。 |
| `ILineEntity` | `vertices`、`extrusionDirection` | 线段实体。 |
| `ILwpolylineEntity` | `vertices`、`elevation`、`depth`、`shape`、`hasContinuousLinetypePattern`、`width`、`extrusionDirectionX`、`extrusionDirectionY`、`extrusionDirectionZ` | 轻量多段线。 |
| `IMtextEntity` | `text`、`position`、`directionVector`、`height`、`width`、`rotation`、`attachmentPoint`、`drawingDirection` | 多行文字实体。 |
| `IPointEntity` | `position`、`thickness`、`extrusionDirection` | 点实体。 |
| `IPolylineEntity` | `vertices`、`thickness`、`shape`、`includesCurveFitVertices`、`includesSplineFitVertices`、`is3dPolyline`、`is3dPolygonMesh`、`is3dPolygonMeshClosed`、`isPolyfaceMesh`、`hasContinuousLinetypePattern`、`extrusionDirection` | 传统多段线。 |
| `ISolidEntity` | `points`、`extrusionDirection` | 实体填充面。 |
| `ISplineEntity` | `controlPoints`、`fitPoints`、`startTangent`、`endTangent`、`knotValues`、`closed`、`periodic`、`rational`、`planar`、`linear`、`degreeOfSplineCurve`、`numberOfKnots`、`numberOfControlPoints`、`numberOfFitPoints`、`normalVector` | 样条曲线实体。 |
| `ITextEntity` | `startPoint`、`endPoint`、`textHeight`、`xScale`、`rotation`、`obliqueAngle`、`text`、`fontName`、`thickness`、`halign`、`valign`、`flags` | 单行文字实体。 |
| `IVertexEntity` | `bulge`、`curveFittingVertex`、`curveFitTangent`、`splineVertex`、`splineControlPoint`、`threeDPolylineVertex`、`threeDPolylineMesh`、`polyfaceMeshVertex`、`faceA`、`faceB`、`faceC`、`faceD` | 多段线顶点实体。 |

## 使用建议

DXF 文件差异很大，业务层不要假定所有实体字段都存在。读取实体前先判断 `type`，再按对应实体字段收窄；查看器销毁时必须调用 `dispose()`，否则 Worker、事件和 ResizeObserver 会残留。
