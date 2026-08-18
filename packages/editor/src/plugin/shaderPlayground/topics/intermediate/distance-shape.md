# 距离变成形状

## 核心结论

圆形（或闪电）**不是**被「识别」出来的。  
每个像素算一个数——到中心的距离——再决定亮不亮：

```glsl
float d = length(vUv - 0.5);
float shape = 1.0 - smoothstep(uRadius, uRadius + uSoftness, d);
if (shape < 0.004) discard; // 太暗 → 空白，不画
```

- `shape` 大：当「有东西」画出来  
- `shape` 接近 0：`discard`，看起来就是空白  

所以：**空白区域 = 公式结果不够强**，不是另一张透明贴图。

## smoothstep 在干什么？

在 `uRadius` 到 `uRadius + uSoftness` 之间做平滑过渡，避免硬边锯齿。  
`uSoftness` 越大，圆边越糊。

## 实验

1. 增大 `uRadius`，圆变大。  
2. 减小 `uSoftness`，边缘变硬。  
3. 删掉 `discard` 那一行，看背景是否被半透明脏色铺满。

## 和闪电的关系

闪电片元同样是：算「离电弧中线的距离」→ 高斯衰减 → 太弱就 discard。  
只是距离定义从「到圆心」换成了「到折线/丝带中线」。

## 下一步

**时间与闪烁**：让 `shape` 再乘上随时间变化的因子。
