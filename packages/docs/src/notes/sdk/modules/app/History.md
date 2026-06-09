---
lang: zh-CN
title: History
createTime: 2026/06/09 00:00:00
---

# History

`History` 管理命令撤销栈和重做栈。业务侧一般通过 `App.execute()`、`App.undo()`、`App.redo()` 使用它。

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `undos` | `Array<Undos>` | 可撤销命令栈。 |
| `redos` | `Array<Undos>` | 可重做命令栈。 |
| `lastCmdTime` | `number` | 最近命令执行时间。 |
| `idCounter` | `number` | 命令 id 计数器。 |

## 方法

| API | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `constructor()` | 无 | `History` | 初始化历史栈。 |
| `execute(cmd, optionalName)` | `cmd: any`；`optionalName: any` | `void` | 执行命令并写入撤销栈。 |
| `undo()` | 无 | `Undos \| undefined` | 撤销一条命令。 |
| `redo()` | 无 | `Undos \| undefined` | 重做一条命令。 |
| `toJSON()` | 无 | `{ undos?: string[], redos?: string[] }` | 序列化历史。 |
| `fromJSON(json)` | `json: any` | `void` | 从 JSON 恢复历史。 |
| `clear()` | 无 | `void` | 清空历史。 |
| `goToState(id)` | `id: number` | `void` | 跳转到指定历史状态。 |
| `enableSerialization(id)` | `id: any` | `void` | 启用指定命令序列化。 |

## 使用建议

频繁拖拽或滑块输入不要每帧写入历史。交互过程中可以直接预览对象状态，鼠标抬起或输入完成后再提交一条命令。
