---
lang: zh-CN
title: 常量
createTime: 2026/06/09 00:00:00
---

# 常量

这些常量主要服务于序列化、贴图参数映射、广告牌布局、帧率选项和漫游角色选择。

## TYPED_ARRAYS

`TYPED_ARRAYS` 是类型化数组构造器映射，常用于从 JSON 或二进制描述中恢复 three.js attribute。

| key | 值 | 说明 |
| --- | --- | --- |
| `Int8Array` | `Int8Array` | 8 位有符号整数数组构造器。 |
| `Uint8Array` | `Uint8Array` | 8 位无符号整数数组构造器。 |
| `Uint8ClampedArray` | `Uint8ClampedArray` | 8 位无符号夹紧数组构造器。 |
| `Int16Array` | `Int16Array` | 16 位有符号整数数组构造器。 |
| `Uint16Array` | `Uint16Array` | 16 位无符号整数数组构造器。 |
| `Int32Array` | `Int32Array` | 32 位有符号整数数组构造器。 |
| `Uint32Array` | `Uint32Array` | 32 位无符号整数数组构造器。 |
| `Float32Array` | `Float32Array` | 32 位浮点数组构造器。 |
| `Float64Array` | `Float64Array` | 64 位浮点数组构造器。 |

## BASE64_TYPES

`BASE64_TYPES` 把 base64 data URL 前缀映射成文件扩展名。

| key | 值 | 说明 |
| --- | --- | --- |
| `data:image/png;base64` | `png` | PNG 图片。 |
| `data:image/jpeg;base64` | `jpg` | JPEG 图片。 |
| `data:image/gif;base64` | `gif` | GIF 图片。 |
| `data:image/x-icon;base64` | `ico` | ICO 图标。 |
| `data:image/svg+xml;base64` | `svg` | SVG 图片。 |
| `data:image/webp;base64` | `webp` | WebP 图片。 |
| `data:audio/wav;base64` | `wav` | WAV 音频。 |
| `data:audio/mpeg;base64` | `mp3` | MP3 音频。 |
| `data:video/mp4;base64` | `mp4` | MP4 视频。 |
| `data:video/webm;base64` | `webm` | WebM 视频。 |
| `data:font/woff;base64` | `woff` | WOFF 字体。 |
| `data:font/woff2;base64` | `woff2` | WOFF2 字体。 |
| `data:application/vnd.ms-fontobject;base64` | `eot` | EOT 字体。 |
| `data:application/x-font-ttf;base64` | `ttf` | TTF 字体。 |
| `data:application/octet-stream;base64` | `ttf` | 通用二进制，SDK 按 TTF 处理。 |
| `data:application/font-woff;base64` | `woff` | WOFF 字体。 |
| `data:application/font-woff2;base64` | `woff2` | WOFF2 字体。 |

## TEXTURE_MAPPING

`TEXTURE_MAPPING` 是 three.js 贴图映射常量名到数值的映射。

| key | 值 | 说明 |
| --- | --- | --- |
| `UVMapping` | `THREE.UVMapping` | 普通 UV 映射。 |
| `CubeReflectionMapping` | `THREE.CubeReflectionMapping` | 立方体反射映射。 |
| `CubeRefractionMapping` | `THREE.CubeRefractionMapping` | 立方体折射映射。 |
| `EquirectangularReflectionMapping` | `THREE.EquirectangularReflectionMapping` | 等距柱状反射映射，常用于 HDR 环境。 |
| `EquirectangularRefractionMapping` | `THREE.EquirectangularRefractionMapping` | 等距柱状折射映射。 |
| `CubeUVReflectionMapping` | `THREE.CubeUVReflectionMapping` | CubeUV 反射映射。 |

## TEXTURE_WRAPPING

| key | 值 | 说明 |
| --- | --- | --- |
| `RepeatWrapping` | `THREE.RepeatWrapping` | 重复平铺。 |
| `ClampToEdgeWrapping` | `THREE.ClampToEdgeWrapping` | 边缘夹紧。 |
| `MirroredRepeatWrapping` | `THREE.MirroredRepeatWrapping` | 镜像重复。 |

## TEXTURE_FILTER

| key | 值 | 说明 |
| --- | --- | --- |
| `NearestFilter` | `THREE.NearestFilter` | 最近点过滤。 |
| `NearestMipmapNearestFilter` | `THREE.NearestMipmapNearestFilter` | 最近 mipmap + 最近采样。 |
| `NearestMipmapLinearFilter` | `THREE.NearestMipmapLinearFilter` | 线性 mipmap + 最近采样。 |
| `LinearFilter` | `THREE.LinearFilter` | 线性过滤。 |
| `LinearMipmapNearestFilter` | `THREE.LinearMipmapNearestFilter` | 最近 mipmap + 线性采样。 |
| `LinearMipmapLinearFilter` | `THREE.LinearMipmapLinearFilter` | 线性 mipmap + 线性采样。 |

## POSITION

`POSITION` 用于广告牌图片、文本和 UI 布局位置描述。

| key | 值 | 说明 |
| --- | --- | --- |
| `BOTTOM_LEFT` | `bottom-left` | 左下。 |
| `BOTTOM` | `bottom` | 下方。 |
| `BOTTOM_CENTER` | `bottom` | 下中，值和 `BOTTOM` 相同。 |
| `BOTTOM_RIGHT` | `bottom-right` | 右下。 |
| `TOP_LEFT` | `top-left` | 左上。 |
| `TOP` | `top` | 上方。 |
| `TOP_CENTER` | `top` | 上中，值和 `TOP` 相同。 |
| `TOP_RIGHT` | `top-right` | 右上。 |
| `LEFT` | `left` | 左侧。 |
| `RIGHT` | `right` | 右侧。 |
| `CENTER` | `center` | 居中。 |

## FPS_OPTIONS

| key | 值 | 说明 |
| --- | --- | --- |
| `NO_UPPER_LIMIT` | `0` | 不设帧率上限。 |
| `LOW` | `24` | 低帧率。 |
| `MEDIUM` | `30` | 中等帧率。 |
| `HIGH` | `60` | 高帧率。 |
| `ULTRA_HIGH` | `120` | 超高帧率。 |

设置帧率时写入 `App.FPS`：

```ts
import { App, FPS_OPTIONS } from '@astral3d/engine'

App.FPS = FPS_OPTIONS.HIGH
```

## ROAMING_CHARACTERS

| key | 值 | 说明 |
| --- | --- | --- |
| `JACKIE` | `Jackie` | Jackie 漫游角色。 |
| `WORK_MAN` | `Workman` | 工人漫游角色。 |
| `X_BOT` | `X_Bot` | X Bot 漫游角色。 |
| `Y_BOT` | `Y_Bot` | Y Bot 漫游角色。 |

## 使用建议

这些常量大多用于“字符串配置与 three.js 实例值之间的桥接”。保存 JSON 时用常量名更稳定，恢复运行态时再映射到 three.js 常量值。不要把 `TEXTURE_*` 里的数值硬编码到业务里，three.js 升级时数值和语义都应该跟着 SDK 走。
