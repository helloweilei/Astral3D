# Three.js 影像瓦片加载

本文说明 Astral3D 如何在 Three.js 场景中加载并显示 **XYZ 卫星/地图影像**（OSM、高德、天地图等）。

## 1. 相关代码

| 职责 | 路径 |
|------|------|
| 调度入口 | `packages/sdk/lib/core/viewer/modules/Terrain.ts` |
| 影像图层 | `packages/sdk/lib/core/objects/terrain/ImageryLayer.ts` |
| 坐标与瓦片网格 | `packages/sdk/lib/utils/geo/GeoUtils.ts` |
| URL / 预置源 | `packages/sdk/lib/utils/geo/ImageryProviders.ts` |
| 配置类型 | `packages/sdk/types/app/Project.d.ts` → `IAppProject.Terrain` |
| 默认配置 | `packages/sdk/lib/core/app/modules/Project.ts` |
| 编辑器 UI | `packages/editor/src/views/editor/layouts/sidebar/terrain/Sidebar.Terrain.Imagery.vue` |

依赖：Three.js `TextureLoader` + `PlaneGeometry`；水平位置用 **Web Mercator（EPSG:3857）**。

## 2. 心智模型

```
WGS84 经纬度 bounds / 相机视域
        │
        ▼
  计算 zoom + 可见 XYZ 瓦片范围
        │
        ▼
  每个瓦片 → PlaneGeometry 铺在 XZ 平面
        │
        ▼
  用相对地形原点的墨卡托米差定位（y=0）
        │
        ▼
  TextureLoader 异步贴图（失败用占位色）
```

场景水平约定（与 3D Tiles / 地理锚点一致）：

- **x** = 东（墨卡托 ΔX）
- **y** = 天（高度差）
- **z** = 南（墨卡托 ΔY 取反）

地形原点 `terrain.origin` 是这套局部坐标的零点。

## 3. 配置字段

```ts
interface ImageryConfig {
  enabled: boolean;
  provider: "custom" | "osm" | "tianditu_vec" | "tianditu_img";
  /** XYZ URL 模板，支持 {z}/{x}/{y}/{s}/{switch:a,b,c}/{token} */
  url: string;
  /** 天地图等需要 token 时填入 */
  token: string;
  minZoom: number;
  maxZoom: number;
  opacity: number;
  /** 锁定 Level，不再随视距变化 */
  lockLevel: boolean;
  lockedLevel: number;
  /** 向外多加载几圈瓦片 */
  tilePadding: number;
  /** true：加载范围与配置 bounds 求交 */
  fixedBounds: boolean;
  bounds: { west: number; south: number; east: number; north: number };
}
```

完整地形配置还需：

```ts
terrain: {
  enabled: true,
  hideGrid: true, // 建议开启，避免地面挡住影像
  origin: { longitude, latitude, height },
  imagery: { /* 如上 */ },
  tiles3d: { /* 见 tiles3d-loading.md */ },
}
```

## 4. 生命周期

```
Viewer 构造 → new Terrain(viewer)
Viewer.init → terrain.init() → applySettings()
  ├─ imagery.enabled
  │    ├─ new ImageryLayer / updateConfig
  │    ├─ scene.add(imageryLayer.group)
  │    ├─ ensureCameraFarForImagery()
  │    ├─ 首次启用 → flyToRegion()
  │    └─ refreshImageryNow()
  └─ …
每帧 Viewer.animate → terrain.update()
  └─ imageryLayer.update(camera, origin, { viewDistance, target })
App.project.setKey("terrain" | "terrain.*")
  → sceneTerrainSettingsChanged → applySettings()
关闭地形 / 关闭影像 → dispose + scene.remove
```

## 5. 单帧加载逻辑（摘要）

`ImageryLayer.update` 大致步骤：

1. **规划 zoom 与加载范围**
   - `lockLevel`：固定 `lockedLevel` + 配置 bounds
   - 否则：按视距 `resolveImageryZoom`（带滞回，减少 Level 抖动）+ `getStableViewBounds`
   - `fixedBounds`：与配置 bounds `intersectBounds`
   - `expandBounds(tilePadding)`，并限制单次瓦片数量上限
2. **zoom 变化** → 清理其它 Level 的瓦片
3. **planVisibleTiles** → 缺失入创建队；离开视域的进入延迟删除
4. **processCreateQueue** → 每帧创建有限张，避免卡顿
5. **flushPendingRemovals** → 超时删除 + LRU 上限

## 6. 单瓦片如何落到 Three.js

```ts
// 概念示意（实现见 ImageryLayer.createTile）
const bounds = tileToLonLatBounds(x, y, z); // 瓦片经纬度范围
// → 转墨卡托米，得到平面宽高
const geometry = new THREE.PlaneGeometry(width, height);
geometry.rotateX(-Math.PI / 2); // 铺到 XZ

const mesh = new THREE.Mesh(geometry, material);
// 中心相对地形原点的墨卡托差：
mesh.position.set(deltaMercX, 0, -deltaMercY);

material.depthTest = false;
material.depthWrite = false;
mesh.renderOrder = -1000; // 最先画，当作“底图”
```

纹理：

```ts
const url = buildImageryTileUrl(provider, z, x, y, { url: template, token });
textureLoader.load(
  url,
  (tex) => { material.map = tex; material.needsUpdate = true; },
  undefined,
  () => { /* 失败：占位色材质 */ }
);
```

## 7. URL 与预置源

`buildImageryTileUrl`（`ImageryProviders.ts`）：

- **osm / custom**：替换模板占位符
- **天地图**：固定 DataServer 地址 + `tk=token`

默认 custom 常用高德卫星（HTTPS）：

```text
https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}
```

编辑器侧「预置图层」来自 `OSM_IMAGERY_PRESETS` / `CUSTOM_IMAGERY_PRESETS`。

## 8. 代码示例

### 8.1 通过项目配置启用影像

```ts
import { App } from "@astral3d/engine";

App.project.setKey("terrain", {
  enabled: true,
  hideGrid: true,
  origin: { longitude: 116.391, latitude: 39.907, height: 0 },
  imagery: {
    enabled: true,
    provider: "custom",
    url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    token: "",
    minZoom: 10,
    maxZoom: 18,
    opacity: 1,
    lockLevel: false,
    lockedLevel: 15,
    tilePadding: 3,
    fixedBounds: false,
    bounds: {
      west: 116.38,
      south: 39.90,
      east: 116.40,
      north: 39.92,
    },
  },
  tiles3d: {
    enabled: false,
    url: "",
    maximumScreenSpaceError: 16,
    offset: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
  },
});
// 内部派发 sceneTerrainSettingsChanged → Terrain.applySettings()
```

### 8.2 运行时 API

```ts
const terrain = window.viewer.modules.terrain;

// 飞到 imagery.bounds 中心
terrain.flyToRegion();

// 用当前相机视域估算 bounds（可写回配置）
const bounds = terrain.estimateBoundsFromCamera();

// 当前影像 Level（-1 表示无）
const level = terrain.getCurrentImageryLevel();

// 地表拾取（含影像平面 / 3D Tiles）
const y = terrain.pickSurfaceHeight(10, -20);
```

### 8.3 编辑器写回

```ts
// SidebarTerrain.vue
function handleChange() {
  App.project.setKey("terrain", toRaw(terrainConfig));
}
```

## 9. 常见问题与解决方案

### 9.1 高德/腾讯底图与 3D 模型错位约百米级

**原因**：国内部分图源是 **GCJ-02（火星坐标）**，模型/锚点通常是 **WGS84**。

**解决**（已实现）：

- `isGcj02ImageryUrl(url)` 识别高德/腾讯域名
- 选瓦：`WGS84 bounds → wgs84ToGcj02 → lonLatToTile`
- 摆瓦：瓦片中心 `gcj02ToWgs84` 后再按墨卡托相对原点定位

```ts
// ImageryProviders.ts
export function isGcj02ImageryUrl(url?: string): boolean {
  return /autonavi\.com|amap\.com|map\.qq\.com/i.test(url ?? "");
}
```

### 9.2 HTTPS 页面加载不了高德瓦片

**原因**：预置曾用 `http://`，浏览器混合内容拦截。

**解决**：预置与默认 URL 统一为 `https://…autonavi.com…`。

### 9.3 瓦片预览 / MiniMap 被 CORP/COEP 拦住

**原因**：跨域图片未声明 CORS。

**解决**：

- 预览用 `<img crossorigin="anonymous">`
- Leaflet / MiniMap 设置 `crossOrigin: true`

### 9.4 地面网格把影像盖住

**原因**：影像关闭深度写入且 `renderOrder` 极小，后画的地面会盖住底图。

**解决**：

- 配置 `terrain.hideGrid = true`
- `Terrain.isGroundHidden()` 在重建地面时同步隐藏

### 9.5 大范围瓦片被相机 far 裁掉

**原因**：默认 `camera.far` 过小。

**解决**：`Terrain.ensureCameraFarForImagery()` 按范围抬高 far。

### 9.6 近景发糊、Level 来回跳

**原因**：视距与瓦片边长接近；相邻 Level 无滞回。

**解决**：`resolveImageryZoom` 带滞回；细节系数 `IMAGERY_ZOOM_DETAIL_FACTOR`。

### 9.7 旋转相机时加载范围抖动

**原因**：仅用视锥四角投影，旋转导致 bounds 抖动。

**解决**：`getStableViewBounds` 以控制器目标点为中心稳定估算。

### 9.8 `fixedBounds` 后近景怎么都不清晰

**原因**：曾误用「整片固定范围」去压低 zoom。

**解决**：固定范围只 **裁剪** 加载区域，不再用它压低清晰度；zoom 仍跟视距走。

### 9.9 某些 OSM 源空白

**原因**：国内网络 / 无 CORS。

**解决**：预置只收录可公开访问且 CORS 友好的源（如 OSM France HOT、Esri 等）；官方 osm.org 等未收录并在注释中说明。

### 9.10 单瓦片纹理失败

**原因**：404、鉴权、CORS、网络错误。

**解决**：加载失败时使用占位色材质，避免整层崩溃；检查 URL 模板、`token`、HTTPS。

## 10. 与 3D Tiles 对齐时要注意

影像按 **墨卡托平面米** 铺设；真实地理米在纬度 φ 处水平尺度差 `1/cos(φ)`。  
3D Tiles 侧会对模型做 **仅水平** 的墨卡托补偿缩放，详见 [3D Tiles 加载](./tiles3d-loading.md)。

## 11. 调试建议

1. 确认 `terrain.enabled` 与 `imagery.enabled` 均为 true  
2. 看 `hideGrid` 是否打开  
3. 用「飞到区域」确认相机在 bounds 上方  
4. 高德源核对是否走了 GCJ 纠偏分支  
5. 浏览器 Network 面板检查瓦片 URL 状态码与 CORS  
6. 临时调大 `tilePadding` / `maxZoom` 观察是否加载到目标 Level  
