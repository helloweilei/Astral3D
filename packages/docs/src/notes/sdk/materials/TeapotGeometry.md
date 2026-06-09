---
lang: zh-CN
title: TeapotGeometry
createTime: 2026/06/09 00:00:00
---

# TeapotGeometry

`TeapotGeometry` 继承 `THREE.BufferGeometry`，用于创建内置茶壶几何。

## 构造函数

```ts
new TeapotGeometry(size?, segments?, bottom?, lid?, body?, fitLid?, blinn?)
```

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `size` | `number` | `50` 或调用方传入值 | 茶壶整体尺寸。内置 `Teapot()` 工厂使用 `2`。 |
| `segments` | `number` | `10` | 曲面分段。越高越平滑，也会增加顶点量。 |
| `bottom` | `boolean` | `true` | 是否生成底部。 |
| `lid` | `boolean` | `true` | 是否生成壶盖。 |
| `body` | `boolean` | `true` | 是否生成主体。 |
| `fitLid` | `boolean` | `false` | 壶盖是否贴合。 |
| `blinn` | `boolean` | `true` | 是否使用 Blinn 版本数据。 |

## 成员与方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `parameters` | 无 | `{ size, bottom, lid, blinn, body, fitLid, segments }` | 构造参数快照。 |
| `copy(source)` | `source: any` | `this` | 复制几何数据与参数。 |
| `TeapotGeometry.fromJSON(data)` | `data: any` | `TeapotGeometry` | 从 JSON 恢复几何。 |
