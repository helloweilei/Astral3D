# Three.js 3D Tiles 加载

本文说明 Astral3D 如何在 Three.js 场景中加载 **3D Tiles**（倾斜摄影、城市白模等），以及如何与影像底图对齐。

## 1. 相关代码

| 职责 | 路径 |
|------|------|
| 调度入口 | `packages/sdk/lib/core/viewer/modules/Terrain.ts` |
| 3D Tiles 图层 | `packages/sdk/lib/core/objects/terrain/Tiles3DLayer.ts` |
| 地理坐标 / ENU | `packages/sdk/lib/utils/geo/GeoUtils.ts` |
| 预置数据集 | `packages/sdk/lib/utils/geo/Tiles3DPresets.ts` |
| Draco / KTX2 | `packages/sdk/lib/core/loader/Loader.ts` |
| 配置类型 | `packages/sdk/types/app/Project.d.ts` → `tiles3d` |
| 编辑器 UI | `packages/editor/src/views/editor/layouts/sidebar/terrain/Sidebar.Terrain.Tiles3D.vue` |

依赖库：[`3d-tiles-renderer`](https://github.com/NASA-AMMOS/3DTilesRendererJS) 的 `TilesRenderer`；内嵌 glTF 走 Three.js `GLTFLoader`。

## 2. 心智模型

地理参考的 3D Tiles 几何通常在 **ECEF** 坐标系。若直接用「场景原点」的 ECEF→局部矩阵套模型，只要原点不在模型处就会 **倾斜/飞到天边**。

本项目采用 **重锚定** 变换链：

```
group.matrix =
    T(定位点场景坐标 − 视觉中心水平偏移)
  × L(用户偏移 / 旋转 / 缩放)
  × S(墨卡托水平缩放, 1, 墨卡托水平缩放)
  × M(锚点处 ECEF → 局部直立)
```

| 符号 | 含义 |
|------|------|
| **M** | `getEnuMatrix(anchor)`：把 ECEF 摆成「就地直立」 |
| **S** | `1/cos(φ)`，只缩 X/Z，对齐影像的墨卡托平面尺度 |
| **L** | 配置里的 `offset` / `rotation` / `scale` |
| **T** | `wgs84ToEnu(placement)`：放到与影像一致的地图位置 |
| **视觉中心偏移** | 包围球中心相对锚点的水平差，让「看起来的中心」对准定位点 |

非地理参考（本地坐标）瓦片集：只应用 **L**。

## 3. 配置字段

```ts
interface Tiles3DConfig {
  enabled: boolean;
  /** tileset.json 地址（建议 HTTPS + CORS） */
  url: string;
  /** LOD 屏幕空间误差，越小越精细、越吃性能 */
  maximumScreenSpaceError: number;
  /** 相对定位点的偏移（米，场景坐标） */
  offset: { x: number; y: number; z: number };
  /** 以定位点为枢轴的旋转（度） */
  rotation: { x: number; y: number; z: number };
  scale: number;
  /**
   * 定位：启用后用指定经纬度/高度放置；
   * 未启用则用瓦片集自身地理锚点。
   */
  placement?: {
    enabled: boolean;
    longitude: number;
    latitude: number;
    height: number;
  };
  /**
   * 贴地足迹描边（影像平面上的边界线）
   */
  outline?: {
    enabled: boolean;
    color: string; // hex
    width: number; // 屏幕像素
  };
}
```

启用前提：`terrain.enabled === true` 且 `tiles3d.enabled && tiles3d.url`。

## 4. 生命周期

```
tiles3d.enabled && url
  → Terrain.enableTerrain
  → new Tiles3DLayer / updateConfig
  → createRenderer():
       const renderer = new TilesRenderer(url)
       挂 Draco / KTX2 到 GLTFLoader
       setCamera / setResolutionFromRenderer
       errorTarget = maximumScreenSpaceError
       on load-tileset → resolveAnchor → applyTransform → syncOutline
       on load-model  → child.ignore = true; userData.terrainPick = true
       on load-error  → loadState = "error"
  → scene.add(tiles3DLayer.group)

每帧 terrain.update()
  → tilesRenderer.update()
  → syncOutline()（描边开启时）

url 变更 → disposeRenderer → 重新 createRenderer
关闭 → dispose + scene.remove
```

加载状态可读：

```ts
viewer.modules.terrain.tiles3dLoadState;    // idle | loading | loaded | error
viewer.modules.terrain.tiles3dErrorMessage;
```

## 5. Draco / KTX2（必配）

倾斜摄影 b3dm 内嵌 glTF 常带 **Draco / KTX2**。`TilesRenderer` 默认 `GLTFLoader` 无解码器时会报：

```text
No DRACOLoader instance provided
```

本项目在创建时复用全局 `Loader`：

```ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Loader from "@/core/loader/Loader";

const gltfLoader = new GLTFLoader(renderer.manager);
gltfLoader.setDRACOLoader(Loader.dracoLoader);
gltfLoader.setKTX2Loader(Loader.ktx2Loader);
renderer.manager.addHandler(/\.(gltf|glb)$/, gltfLoader);
// 点云 pnts 的 Draco
renderer.manager.addHandler(/\.drc$/, Loader.dracoLoader);
```

解码器资源随 SDK 分发：

- Draco：`libs/draco/gltf/`
- Basis/KTX2：`libs/basis/`

## 6. 锚点解算

`resolveAnchor()`（`Tiles3DLayer`）：

1. 根节点 `transform` 平移若为 ECEF 量级（长度 > 1e6 m）→ 解算 WGS84，**高度优先用它**（通常靠近模型底部）
2. 包围球中心若为 ECEF 量级 → 解算 WGS84，**水平经纬度优先用它**（更接近视觉重心）
3. 两者都不具备 → 视为本地坐标，`anchor = null`

定位点：

- `placement.enabled` → 用配置的经纬高
- 否则 → 用 `anchor`

## 7. 贴地足迹描边（outline）

用途：在 **影像平面** 画出 3D Tiles 覆盖范围，便于和底图区分（不是三维包围盒）。

流程：

1. 根节点 OBB 八点投影到 XZ → 凸包（稳定兜底）
2. 已有网格时：在范围内 **向下射线采样** → 占位图 → 外轮廓追踪 → 折线简化 → **不规则边界**
3. 用 `LineSegments2` + `LineMaterial` 画在 `y ≈ 0.5`（略抬高，避免与影像深度冲突）
4. 结果有缓存，避免每帧重算

配置示例：

```ts
tiles3d.outline = {
  enabled: true,
  color: "#00e5ff",
  width: 2,
};
```

## 8. 代码示例

### 8.1 启用 3D Tiles（含影像对齐场景）

```ts
import { App } from "@astral3d/engine";

App.project.setKey("terrain", {
  enabled: true,
  hideGrid: true,
  // 原点靠近数据所在位置，便于影像与模型同屏
  origin: { longitude: 108.9594, latitude: 34.2196, height: 445 },
  imagery: {
    enabled: true,
    provider: "custom",
    url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    token: "",
    minZoom: 10,
    maxZoom: 18,
    opacity: 1,
    lockLevel: false,
    lockedLevel: 16,
    tilePadding: 3,
    fixedBounds: false,
    bounds: {
      west: 108.95,
      south: 34.21,
      east: 108.97,
      north: 34.23,
    },
  },
  tiles3d: {
    enabled: true,
    url: "https://resource.dvgis.cn/data/3dtiles/dayanta/tileset.json",
    maximumScreenSpaceError: 16,
    offset: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    placement: {
      enabled: false,
      longitude: 0,
      latitude: 0,
      height: 0,
    },
    outline: {
      enabled: true,
      color: "#00e5ff",
      width: 2,
    },
  },
});
```

### 8.2 运行时 API

```ts
const terrain = window.viewer.modules.terrain;

// 瓦片集地理锚点（WGS84）；本地坐标数据为 null
const anchor = terrain.getTiles3DAnchor();

// 开启视口 gizmo 编辑（整体 TRS）
terrain.setTiles3DEditEnabled(true);
const editing = terrain.isTiles3DEditActive();

// 模型地面相对 y=0 的高度（用于「贴地」）
const groundY = terrain.getTiles3DGroundOffsetY();
if (groundY != null) {
  // 编辑器侧：offset.y -= groundY
}

// 拾取目标（测距等）
const meshes = terrain.getPickTargets();
```

### 8.3 手动放置到指定经纬度

```ts
const tiles3d = App.project.getKey("terrain.tiles3d");
tiles3d.placement = {
  enabled: true,
  longitude: 108.9594,
  latitude: 34.2196,
  height: 445,
};
tiles3d.offset = { x: 0, y: 0, z: 0 };
App.project.setKey("terrain.tiles3d", tiles3d);
```

### 8.4 最小自建加载（理解用）

若在引擎外复现核心思路：

```ts
import { TilesRenderer } from "3d-tiles-renderer";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

const tiles = new TilesRenderer(tilesetUrl);
const gltfLoader = new GLTFLoader(tiles.manager);
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setKTX2Loader(ktx2Loader);
tiles.manager.addHandler(/\.(gltf|glb)$/, gltfLoader);

tiles.setCamera(camera);
tiles.setResolutionFromRenderer(camera, renderer);
scene.add(tiles.group);

tiles.addEventListener("load-tileset", () => {
  // 1) 从包围球 / root transform 解算 WGS84 锚点
  // 2) group.matrix = T × L × S × M(anchor)
  tiles.group.matrixAutoUpdate = false;
});

function animate() {
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);
  tiles.update();
}
```

生产环境请直接使用 `Terrain` / `Tiles3DLayer`，变换与对齐逻辑已封装。

## 9. 编辑器侧常用操作

| UI | 作用 |
|----|------|
| 启用 / Tileset URL / 预置数据集 | 开关与换源；预置会移动原点、平移影像范围并复位 TRS |
| 屏幕空间误差 (SSE) | `maximumScreenSpaceError` |
| 地形描边 | `outline`：贴地边界线，可配颜色/线宽 |
| 同步地形原点 | 把 `origin` 对齐到当前定位/锚点，影像 bounds 中心跟随 |
| 定位 | 手动指定放置经纬高 |
| 选中编辑 | gizmo 拖拽 → `tiles3dEditCommitted` 写回 offset/rotation/scale |
| 更新锚点 | 把当前偏移合并进 placement，offset 归零 |
| 高度贴地 | 射线测最低地面 Y，修正 `offset.y` |
| 变换复位 | offset/rotation/scale/placement 恢复默认 |

## 10. 常见问题与解决方案

### 10.1 模型倾斜、倒立或飞到远处

**原因**：把「场景原点」的 ECEF→局部矩阵直接乘到远离原点的 ECEF 几何上。

**解决**：重锚定 `T × L × S × M(锚点)`，姿态用锚点处直立矩阵，位置用墨卡托映射的定位点。

### 10.2 ENU 矩阵方向反了（曾导致整体歪斜）

**原因**：`Matrix4.makeBasis(east, up, south)` 得到的是 **局部→世界**（列向量为基）。若当作世界→局部使用会相当于反变换。

**解决**（`GeoUtils.buildEnuMatrix`）：

```ts
matrix.makeBasis(east, up, south).transpose(); // 得到世界→局部
```

### 10.3 与影像水平位置差一截 / 尺度对不齐

**可能原因与对应解法**：

| 现象 | 原因 | 解法 |
|------|------|------|
| 整体偏约 100–700 m | 底图是 GCJ-02 | 影像侧纠偏，见 [影像加载](./imagery-loading.md) |
| 纬度越高偏得越大 | 影像为墨卡托米，模型为真实米 | `mercatorScale = 1/cos(φ)`，**只缩 X/Z** |
| 差数米级南北/东西 | 锚点是测绘基准而非视觉中心 | 水平用包围球中心 + `getVisualCenterOffset` |
| 斜视时像「悬空」 | 透视视差 | UI「高度贴地」：`getTiles3DGroundOffsetY` |

### 10.4 `No DRACOLoader instance provided`

**原因**：未给 `GLTFLoader` 挂 Draco。

**解决**：见上文「Draco / KTX2」；确认 `libs/draco`、`libs/basis` 已随应用部署且 `BASE_URL` 正确。

### 10.5 tileset 加载失败 / CORS

**原因**：HTTP 混合内容、无 `Access-Control-Allow-Origin`、需要 Token 的私有源。

**解决**：

- 使用 HTTPS
- 服务端开 CORS，或走同源代理
- 预置数据集只收录 HTTPS + 公开 CORS 的源（见 `Tiles3DPresets.ts`）

### 10.6 本地坐标 tileset 没有地理锚点

**现象**：`getTiles3DAnchor()` 为 `null`，无法「同步原点 / 选中编辑」。

**说明**：ECEF 长度不足时视为本地数据；可用 `placement` 手动指定经纬高，或只在场景原点附近用 offset 调整。

### 10.7 描边看不见 / 曾出现巨大三维盒子

**原因与演进**：

1. 早期把线框挂在 ECEF 大坐标的 `tilesRenderer.group` 下 → `LineSegments2` 精度/变换异常  
2. 三维 AABB 在倾斜 OBB 下会被放大很多 → 与模型差距巨大  
3. UI 误用 `n-switch` 的 `v-model:checked`（应为 `value`）→ 开关无反应  

**当前方案**：

- 顶点转到 **场景世界坐标**，挂在 layer 根节点  
- **贴地二维足迹**（OBB 凸包 + 可选不规则采样轮廓）  
- 描边 UI 使用 `n-checkbox`  
- `depthTest/Write = false`，`y = 0.5` 抬升  

### 10.8 不规则边界与凸包不一致

**说明**：有网格后优先不规则轮廓；瓦片未加载完时先显示 OBB 凸包，随后随 LOD 刷新（有缓存间隔）。

若采样命中过少会回退凸包——等模型加载更多后再看描边即可。

### 10.9 编辑 gizmo 拖完配置没更新

**原因**：未监听提交信号。

**解决**：编辑器监听 `tiles3dEditCommitted`，把 payload 写回 `offset/rotation/scale` 并 `setKey`。

```ts
Hooks.useAddSignal("tiles3dEditCommitted", (payload) => {
  Object.assign(tiles3d, {
    offset: { ...payload.offset },
    rotation: { ...payload.rotation },
    scale: payload.scale,
  });
  App.project.setKey("terrain", toRaw(terrainConfig));
});
```

### 10.10 性能：SSE 与瓦片数量

- `maximumScreenSpaceError` 调大 → 更糙、更流畅  
- 同时开高清影像 + 倾斜摄影时注意显存；可减小影像 `maxZoom` 或提高 SSE  

## 11. 坐标系速查

| 名称 | 用途 |
|------|------|
| WGS84 | 配置原点、placement、锚点 |
| ECEF | 地理参考 tiles 几何 |
| Web Mercator | 与影像一致的水平放置 / 尺度补偿 |
| 场景坐标 | x 东、y 天、z 南（墨卡托 ΔY 取反） |

水平放置请用 `wgs84ToEnu` / `enuToWgs84`（墨卡托平面差），**不要**与椭球测地 ENU 米制混用。  
姿态摆正请用 `getEnuMatrix`（转置后的基矩阵）。

## 12. 调试建议

1. 确认 `tiles3dLoadState === "loaded"`，否则看 `tiles3dErrorMessage`  
2. 打开「地形描边」核对足迹是否落在影像正确位置  
3. 高德底图时先确认影像 GCJ 纠偏已生效  
4. 偏差数米：试「高度贴地」「更新锚点」微调  
5. 偏差百米级：检查是否 WGS84 模型叠在未纠偏的 GCJ 图上  
6. Network 中确认 `.b3dm/.glb`、`.drc`、basis 转码器请求成功  
7. 硬刷新编辑器以加载最新 `@astral3d/engine` 构建产物  
