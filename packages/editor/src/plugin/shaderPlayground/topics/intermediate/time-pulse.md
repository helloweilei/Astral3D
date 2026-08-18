# 时间与闪烁

## uniform 时间

预览循环每帧更新：

```glsl
uniform float uTime;
```

用三角函数就能做呼吸灯：

```glsl
float wave = 0.5 + 0.5 * sin(uTime * uSpeed);
float shape = exp(-d * d * 18.0) * wave;
```

## 为什么闪电也要时间？

真实回击不是一直亮：主闪 → 短暂熄灭 → 回闪。  
工程里用 JS 状态机改 `uIntensity`；这里用 `sin` 先感受「时间驱动亮度」。

## 实验

1. 调大 `uSpeed`，闪得更快。  
2. 把 `sin` 换成 `abs(sin(...))`，观察波形变化。  
3. 尝试 `step(0.7, wave)`：只有亮过阈值才显示，更接近「电击一下」。

## 关键词

- `uTime`：累计秒数（本沙盒由 Preview 驱动）  
- 指数衰减 `exp(-d*d*k)`：中心亮、外围快速变暗（后面精通档会拆成多层）

## 下一步

精通档 **叠加混合亮斑**：为什么发光要用 Additive。
