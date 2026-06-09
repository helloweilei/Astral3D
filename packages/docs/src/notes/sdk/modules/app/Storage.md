---
lang: zh-CN
title: Storage
createTime: 2026/06/09 00:00:00
---

# Storage

`Storage` 基于 localforage 管理模型、其他数据和配置数据三个库。它适合存储编辑器偏好、离线缓存和小型业务数据。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `dbs` | `{ modelsDB, otherDB, configDB }` | 三个 localforage 实例集合。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `Storage` | 初始化数据库。 |
| `initDB()` | 无 | `{ modelsDB, otherDB, configDB }` | 创建并返回数据库集合。 |
| `setModel(key, value)` | `key: string`；`value: any` | `void` | 写入模型缓存。 |
| `getModel(key)` | `key: string` | `Promise<unknown>` | 读取模型缓存。 |
| `removeModel(key)` | `key: string` | `Promise<void>` | 删除模型缓存。 |
| `setOtherItem(key, value)` | `key: string`；`value: any` | `void` | 写入其他缓存。 |
| `getOtherItem(key)` | `key: string` | `Promise<unknown>` | 读取其他缓存。 |
| `removeOtherItem(key)` | `key: string` | `Promise<void>` | 删除其他缓存。 |
| `setConfigItem(key, value)` | `key: string`；`value: any` | `Promise<any>` | 写入配置缓存。 |
| `getConfigItem(key)` | `key: string` | `Promise<unknown>` | 读取配置缓存。 |
| `removeConfigItem(key)` | `key: string` | `Promise<void>` | 删除配置缓存。 |

## 使用建议

本地缓存不是工程数据的唯一来源。重要工程数据仍要通过服务端或正式项目文件保存，Storage 更适合做加速和偏好持久化。
