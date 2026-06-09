---
lang: zh-CN
title: HTML 面板
createTime: 2026/06/09 00:00:00
---

# HTML 面板

`HtmlPanelConverter`、`HtmlPanel`、`HtmlSprite` 用于把单 HTML 或 zip 包渲染成 CSS3D 对象。单 HTML 使用沙箱环境，zip 包使用 iframe 方式处理资源。

## HtmlPanelConverter

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `HtmlPanelConverter.getInstance()` | 无 | `HtmlPanelConverter` | 获取单例转换器。 |
| `loadAsync(option)` | `{ url: string, isSprite: boolean, fileName?: string }` | `Promise<HtmlPanel \| HtmlSprite>` | 从 URL 加载 HTML 或 zip，并转成 CSS3D 对象。 |
| `parseToCSS3D(options)` | `IHtmlPanelOption` | `HtmlPanel \| HtmlSprite` | 将已读取的代码内容解析成 `HtmlPanel` 或 `HtmlSprite`。 |
| `_isEditable(filePath)` | `filePath: string` | `boolean` | 判断 zip 内文件是否可编辑。业务通常不需要直接调用。 |

## IHtmlPanelOption

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `isSprite` | `boolean` | 是否创建 CSS3DSprite。 |
| `codes` | `Array<{ name: string, content: string \| ArrayBuffer, isIndex?: boolean }>` | HTML、脚本、样式或资源内容。 |
| `isSingleHtml` | `boolean` | 是否单 HTML 文件。 |

## HtmlPanel

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(element, options)` | `element: HTMLElement`；`options: IHtmlPanelOption` | `HtmlPanel` | 创建 CSS3DObject 面板。 |
| `type` | 无 | `HtmlPanel` | 对象类型标记。 |
| `isHtmlPanel` | 无 | `true` | HTML 面板标记。 |
| `options` | 无 | `IHtmlPanelOption` | 面板源配置。 |
| `toJSON(meta)` | `meta?: THREE.JSONMeta` | `any` | 序列化面板。 |
| `HtmlPanel.fromJSON(data)` | `data: any` | `HtmlPanel \| HtmlSprite` | 从 JSON 恢复面板或精灵。 |

## HtmlSprite

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(element, options)` | `element: HTMLElement`；`options: IHtmlPanelOption` | `HtmlSprite` | 创建 CSS3DSprite。 |
| `type` | 无 | `HtmlSprite` | 对象类型标记。 |
| `isHtmlSprite` | 无 | `true` | HTML 精灵标记。 |
| `options` | 无 | `IHtmlPanelOption` | 面板源配置。 |
| `toJSON(meta)` | `meta?: THREE.JSONMeta` | `any` | 序列化精灵。 |
| `HtmlSprite.fromJSON(data)` | `data: any` | `HtmlPanel \| HtmlSprite` | 从 JSON 恢复面板或精灵。 |
