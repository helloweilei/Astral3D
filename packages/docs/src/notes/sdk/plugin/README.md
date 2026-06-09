---
lang: zh-CN
title: 插件
createTime: 2026/06/09 00:00:00
---

# 插件

`Plugin` 是插件必须实现的接口。插件管理器实例在 `viewer.modules.plugin` 上使用。

```ts
import type { Plugin } from '@astral3d/engine'

export default {
  name: 'demo-plugin',
  version: 1,
  icon: 'carbon:plug',
  install() {},
  uninstall() {},
  run() {},
} satisfies Plugin
```

## Plugin

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 插件名称，也是插件注册表里的唯一键。重复注册同名插件时，插件管理器会直接返回当前实例，不会重复安装。 |
| `version` | `number` | 插件版本号。不兼容时应显式替换插件实现，不要静默降级。 |
| `icon` | `string` | 插件图标，用于插件盒子等 UI 展示。 |
| `install(config)` | `(config?: any) => void` | 安装入口。插件应在这里注册事件、创建资源、保存配置。 |
| `uninstall()` | `() => void` | 卸载入口。插件应在这里移除监听、释放 three.js/WebGL/Worker/定时器等资源。 |
| `run()` | `() => void` | 用户从插件面板点击插件时执行的方法。 |

## PluginManager 常用入口

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `loadAsync(pluginPaths, autoUse)` | `pluginPaths: string \| string[]`；`autoUse = false` | `Promise<Plugin[] \| undefined>` | 加载远程插件模块，`autoUse` 为真时自动安装。 |
| `use(plugin, config)` | `plugin: Plugin`；`config?: any` | `this` | 注册、配置并安装插件。 |
| `getPlugin(pluginName)` | `pluginName: string` | `Plugin \| undefined` | 获取插件实例。 |
| `getPlugins(pluginNames)` | `pluginNames: string[]` | `Plugin[] \| undefined` | 获取多个插件实例。 |
| `run(pluginNames)` | `pluginNames: string \| string[]` | `this` | 运行一个或多个插件。 |
| `uninstall(pluginNames)` | `pluginNames: string \| string[]` | `this` | 卸载一个或多个插件。 |

## 使用建议

插件边界要清楚：资源在哪里创建，就要能在 `uninstall()` 里释放。监听器、Worker、请求、缓存、three.js 对象和 UI DOM 都不要散落在插件外部。
