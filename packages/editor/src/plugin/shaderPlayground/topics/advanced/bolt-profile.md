# 闪电丝带剖面

## 和工程闪电的关系

真实闪电几何是 CPU 挤出的 **丝带 Mesh**：横向 UV `0～1`，中心 `0.5` 是芯。  
本知识点用全屏平面的 `vUv.x` **模拟同一横截面公式**，方便单步理解：

```glsl
float d = abs(vUv.x - 0.5) * 2.0;
float core = exp(-d * d * uCoreK);
float mid  = exp(-d * d * uMidK) * 0.55;
float glow = exp(-d * d * uGlowK) * 0.35;
```

再把芯偏白、晕偏冷蓝：

```glsl
vec3 col = mix(cool, hot, core);
```

## 参数含义

| Uniform | 作用 |
|---------|------|
| `uCoreK` | 越大芯越细越锐 |
| `uMidK` | 中间亮度层 |
| `uGlowK` | 越小晕拖得越宽 |

## 实验

1. 只增大 `uCoreK`：白线变细。  
2. 减小 `uGlowK`：蓝晕收窄。  
3. 打开文档站《着色器进阶：以闪电效果为例》，对照 `Lighting.ts` 片元。

## 你应该能口头说明

> 像素自己算离中线的距离；多层高斯决定芯和晕；太暗就 discard；Additive 负责叠亮。

若以上都能说清，可以回到天气面板开闪电，对照真实效果。
