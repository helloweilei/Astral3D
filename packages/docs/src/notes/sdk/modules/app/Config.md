---
lang: zh-CN
title: Config
createTime: 2026/06/09 00:00:00
---

# Config

`Config` 管理全局配置，并与本地存储同步。二次开发里，快捷键、主题、偏好配置这类和场景对象无关的状态，都适合放在这里。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `storage` | `Storage` | 构造时传入的存储模块。 |
| `config` | `IAppConfig.Config` | 当前配置对象。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor(storage)` | `storage: Storage` | `Config` | 绑定本地存储。 |
| `setConfig(config)` | `config: Record<string, any>` | `void` | 设置初始配置。 |
| `syncStorage()` | 无 | `void` | 与本地存储中的配置同步。 |
| `getKey(key)` | `key: string` | `any` | 按点路径读取配置，例如 `renderer.fps`。 |
| `setKey(key, value)` | `key: string`；`value: unknown` | `void` | 按点路径写入配置。 |
| `getShortcutItem(key)` | `key: string` | `any` | 获取快捷键配置项。 |
| `setShortcutItem(key, value)` | `key: string`；`value: any` | `Promise<any>` | 写入快捷键配置。 |
| `clear()` | 无 | `void` | 清空配置。 |

## 使用建议

配置读写建议使用点路径，避免业务侧直接替换整棵配置对象。这样 UI 表单、存储同步和默认配置合并更容易保持一致。
