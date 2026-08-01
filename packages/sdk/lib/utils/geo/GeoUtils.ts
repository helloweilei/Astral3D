import * as THREE from "three";
import proj4 from "proj4";

/** WGS84 地理坐标系（经纬度，度） */
const WGS84 = "EPSG:4326";
/** Web 墨卡托投影（米），常用于 OSM/XYZ 瓦片 */
const WEB_MERCATOR = "EPSG:3857";

proj4.defs(WEB_MERCATOR, "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs");

/** 度 → 弧度 */
const DEG2RAD = Math.PI / 180;
/** 弧度 → 度 */
const RAD2DEG = 180 / Math.PI;
/** WGS84 长半轴（米） */
const WGS84_A = 6378137;
/** WGS84 第一偏心率平方 e² */
const WGS84_E2 = 0.00669437999014;

/**
 * WGS84 地理坐标。
 * - longitude / latitude：度
 * - height：相对椭球面高度（米）
 */
export interface Wgs84Coord {
	longitude: number;
	latitude: number;
	height: number;
}

/**
 * 局部场景坐标，单位米。
 * 在本引擎中映射为 Three.js：x=东，y=天，z=北取反（南为正）。
 * 与影像瓦片的铺设坐标系（Web 墨卡托平面，z = -墨卡托Y偏移）完全一致。
 */
export interface EnuCoord {
	x: number;
	y: number;
	z: number;
}

/**
 * 经纬度地理包围盒（度）。
 * 约定：west &lt; east，south &lt; north。
 */
export interface GeoBounds {
	west: number;
	south: number;
	east: number;
	north: number;
}

/**
 * WGS84 → ECEF（地心地固直角坐标，米）。
 * 使用椭球公式，含高程对法线方向的影响。
 */
export function wgs84ToEcef(lon: number, lat: number, height: number): THREE.Vector3 {
	const lonRad = lon * DEG2RAD;
	const latRad = lat * DEG2RAD;
	const sinLat = Math.sin(latRad);
	const cosLat = Math.cos(latRad);
	const sinLon = Math.sin(lonRad);
	const cosLon = Math.cos(lonRad);
	const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);

	return new THREE.Vector3((n + height) * cosLat * cosLon, (n + height) * cosLat * sinLon, (n * (1 - WGS84_E2) + height) * sinLat);
}

/**
 * 构建「ECEF → 以 origin 为原点的局部直立坐标系」变换矩阵。
 * 输出坐标系与场景约定一致：x=东，y=天（椭球法线方向），z=南（北取反）。
 *
 * 注意旋转部分必须是"世界→局部"的投影（基向量为行），
 * 历史实现误用 `makeBasis`（基向量为列，即局部→世界），导致
 * 地理参考的 3D Tiles 模型出现整体倾斜。
 */
function buildEnuMatrix(origin: Wgs84Coord): THREE.Matrix4 {
	const lonRad = origin.longitude * DEG2RAD;
	const latRad = origin.latitude * DEG2RAD;
	const sinLat = Math.sin(latRad);
	const cosLat = Math.cos(latRad);
	const sinLon = Math.sin(lonRad);
	const cosLon = Math.cos(lonRad);

	const originEcef = wgs84ToEcef(origin.longitude, origin.latitude, origin.height);

	const east = new THREE.Vector3(-sinLon, cosLon, 0);
	const up = new THREE.Vector3(cosLat * cosLon, cosLat * sinLon, sinLat);
	// 场景 z 轴取南向（北取反），与影像瓦片 `z = -墨卡托Y` 的约定一致，构成右手系
	const south = new THREE.Vector3(sinLat * cosLon, sinLat * sinLon, -cosLat);

	// makeBasis 以参数为列（局部→世界）；转置后基向量为行，得到世界→局部的投影
	const rotation = new THREE.Matrix4().makeBasis(east, up, south).transpose();
	const translation = new THREE.Matrix4().makeTranslation(-originEcef.x, -originEcef.y, -originEcef.z);

	return new THREE.Matrix4().multiplyMatrices(rotation, translation);
}

/** 缓存的 ECEF→ENU 矩阵 */
let _enuMatrix: THREE.Matrix4 | null = null;
/** 缓存的 ENU→ECEF 逆矩阵 */
let _enuInverse: THREE.Matrix4 | null = null;
/** 当前缓存对应的原点指纹：`lon,lat,height` */
let _originKey = "";

/**
 * 按需重建 ENU 正/逆矩阵；原点未变时直接复用缓存。
 */
function ensureEnuMatrices(origin: Wgs84Coord) {
	const key = `${origin.longitude},${origin.latitude},${origin.height}`;
	if (_originKey === key && _enuMatrix && _enuInverse) return;

	_originKey = key;
	_enuMatrix = buildEnuMatrix(origin);
	_enuInverse = _enuMatrix.clone().invert();
}

/**
 * 设置（或刷新）全局 ENU 原点。
 * 地形模块在原点变更、启用地形时应调用，保证后续 `wgs84ToEnu` / `enuToWgs84` 一致。
 */
export function setEnuOrigin(origin: Wgs84Coord) {
	ensureEnuMatrices(origin);
}

/**
 * WGS84 → 局部场景坐标。
 *
 * 采用与影像瓦片铺设完全一致的「Web 墨卡托平面差值」映射：
 * `x = ΔmercX`，`y = Δ高度`，`z = -ΔmercY`。
 * 这样地理锚点、相机飞行、拾取换算与瓦片平面天然对齐，
 * 不存在椭球曲率导致的远距离下沉/偏移。
 *
 * @param coord 待转换点
 * @param origin 场景原点（通常为地形配置原点）
 * @returns 场景米制坐标 `{ x:东, y:天, z:北取反 }`
 */
export function wgs84ToEnu(coord: Wgs84Coord, origin: Wgs84Coord): EnuCoord {
	const merc = lonLatToMercatorMeters(coord.longitude, coord.latitude);
	const originMerc = lonLatToMercatorMeters(origin.longitude, origin.latitude);
	return {
		x: merc.x - originMerc.x,
		y: coord.height - origin.height,
		z: -(merc.y - originMerc.y),
	};
}

/**
 * 局部场景坐标 → WGS84。`wgs84ToEnu` 的精确逆映射。
 *
 * @param enu 场景坐标（米）
 * @param origin 场景原点
 */
export function enuToWgs84(enu: EnuCoord, origin: Wgs84Coord): Wgs84Coord {
	const originMerc = lonLatToMercatorMeters(origin.longitude, origin.latitude);
	const { lon, lat } = mercatorMetersToLonLat(originMerc.x + enu.x, originMerc.y - enu.z);
	return {
		longitude: lon,
		latitude: lat,
		height: enu.y + origin.height,
	};
}

/**
 * ECEF → WGS84 经纬度/椭球高。
 * 纬度采用迭代求解，精度对数字孪生尺度足够。
 */
export function ecefToWgs84(ecef: { x: number; y: number; z: number }): Wgs84Coord {
	const { x, y, z } = ecef;
	const p = Math.sqrt(x * x + y * y);
	const lon = Math.atan2(y, x) * RAD2DEG;
	let lat = Math.atan2(z, p * (1 - WGS84_E2));
	let prevLat = 0;

	for (let i = 0; i < 8; i++) {
		prevLat = lat;
		const sinLat = Math.sin(lat);
		const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
		lat = Math.atan2(z + WGS84_E2 * n * sinLat, p);
		if (Math.abs(lat - prevLat) < 1e-12) break;
	}

	const sinLat = Math.sin(lat);
	const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
	const height = p / Math.cos(lat) - n;

	return {
		longitude: lon,
		latitude: lat * RAD2DEG,
		height,
	};
}

/* ------------------------------------------------------------------ */
/* GCJ-02（国测局加密坐标系）与 WGS84 互转                                */
/* 高德/腾讯等国内瓦片源使用 GCJ-02，与 WGS84 相差约 100~700 米，          */
/* 若不纠偏，地理参考模型（3D Tiles、地理锚点）会与底图错位。               */
/* ------------------------------------------------------------------ */

/** GCJ-02 加偏算法使用的克拉索夫斯基椭球长半轴 */
const GCJ_A = 6378245.0;
/** GCJ-02 加偏算法使用的椭球偏心率平方 */
const GCJ_EE = 0.00669342162296594323;

/** 中国境外不加偏 */
function outOfChina(lon: number, lat: number): boolean {
	return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function gcjTransformLat(x: number, y: number): number {
	let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
	ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
	ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
	ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
	return ret;
}

function gcjTransformLon(x: number, y: number): number {
	let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
	ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
	ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
	ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
	return ret;
}

/**
 * WGS84 → GCJ-02（正向加偏）。中国境外原样返回。
 */
export function wgs84ToGcj02(lon: number, lat: number): { lon: number; lat: number } {
	if (outOfChina(lon, lat)) return { lon, lat };

	let dLat = gcjTransformLat(lon - 105.0, lat - 35.0);
	let dLon = gcjTransformLon(lon - 105.0, lat - 35.0);
	const radLat = (lat / 180.0) * Math.PI;
	let magic = Math.sin(radLat);
	magic = 1 - GCJ_EE * magic * magic;
	const sqrtMagic = Math.sqrt(magic);
	dLat = (dLat * 180.0) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * Math.PI);
	dLon = (dLon * 180.0) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * Math.PI);

	return { lon: lon + dLon, lat: lat + dLat };
}

/**
 * GCJ-02 → WGS84（反向解偏）。
 * 采用两轮迭代反解，精度约 1e-7 度（厘米级），对瓦片对齐足够。
 */
export function gcj02ToWgs84(lon: number, lat: number): { lon: number; lat: number } {
	if (outOfChina(lon, lat)) return { lon, lat };

	let wgsLon = lon;
	let wgsLat = lat;
	for (let i = 0; i < 2; i++) {
		const gcj = wgs84ToGcj02(wgsLon, wgsLat);
		wgsLon += lon - gcj.lon;
		wgsLat += lat - gcj.lat;
	}

	return { lon: wgsLon, lat: wgsLat };
}

/**
 * 经纬度 → Web 墨卡托平面坐标（米）。
 * 用于把瓦片经纬度范围换算为场景地平面尺寸。
 */
export function lonLatToMercatorMeters(lon: number, lat: number): { x: number; y: number } {
	const [x, y] = proj4(WGS84, WEB_MERCATOR, [lon, lat]);
	return { x, y };
}

/**
 * Web 墨卡托平面坐标（米）→ 经纬度。
 */
export function mercatorMetersToLonLat(x: number, y: number): { lon: number; lat: number } {
	const [lon, lat] = proj4(WEB_MERCATOR, WGS84, [x, y]);
	return { lon, lat };
}

/**
 * 经纬度 → XYZ 瓦片索引（Slippy Map / OSM 规范）。
 * Y 轴自上而下；结果会钳制在 `[0, 2^zoom - 1]`。
 *
 * @param zoom 瓦片层级（整数）
 */
export function lonLatToTile(lon: number, lat: number, zoom: number): { x: number; y: number } {
	const n = Math.pow(2, zoom);
	const x = Math.floor(((lon + 180) / 360) * n);
	const latRad = lat * DEG2RAD;
	const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
	return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

/**
 * XYZ 瓦片索引 → 该瓦片覆盖的经纬度 bounds。
 *
 * @param x 列号
 * @param y 行号（自上而下）
 * @param z zoom 层级
 */
export function tileToLonLatBounds(x: number, y: number, z: number): { west: number; south: number; east: number; north: number } {
	const n = Math.pow(2, z);
	const west = (x / n) * 360 - 180;
	const east = ((x + 1) / n) * 360 - 180;
	const northRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
	const southRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
	return {
		west,
		east,
		north: northRad * RAD2DEG,
		south: southRad * RAD2DEG,
	};
}

/**
 * 赤道处单边瓦片边长（米）≈ `2πR / 2^zoom`。
 * 用于按视距/范围估算合适 Level。
 */
export function getTileSizeMeters(zoom: number): number {
	return (2 * Math.PI * WGS84_A) / Math.pow(2, zoom);
}

/**
 * 视距尺度上期望覆盖的瓦片数。
 * 原公式令「瓦片边长 ≈ 视距」，近距离时整屏往往只有 1～2 块 256px 瓦片，会被严重拉伸发糊；
 * 取 4 表示视距对应地面尺度约由 4 块瓦片覆盖，近景更清晰且瓦片量仍可控。
 */
const IMAGERY_ZOOM_DETAIL_FACTOR = 5;

/** 某 Level 对应的切换视距（米）：`detailFactor × 赤道瓦片边长` */
function viewDistanceForZoomLevel(zoom: number): number {
	return (IMAGERY_ZOOM_DETAIL_FACTOR * 2 * Math.PI * WGS84_A) / Math.pow(2, zoom);
}

/**
 * 根据相机高度（或视距，米）粗估影像 Level。
 * 使约 `IMAGERY_ZOOM_DETAIL_FACTOR` 块瓦片覆盖视距对应的地面尺度。
 *
 * @param altitude 视距或高度（米）
 * @param minZoom / maxZoom 合法区间钳制
 */
export function estimateZoomFromAltitude(altitude: number, minZoom: number, maxZoom: number): number {
	const size = Math.max(altitude / IMAGERY_ZOOM_DETAIL_FACTOR, 1);
	let zoom = Math.floor(Math.log2((2 * Math.PI * WGS84_A) / size));
	return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * 根据 bounds 地理跨度估算 Level。
 *
 * 目标：完整范围大约由 `targetTilesPerAxis × targetTilesPerAxis` 块瓦片覆盖，
 * 且总瓦片数不超过 `maxTiles`；若超出则逐级降低 zoom。
 *
 * @param options.targetTilesPerAxis 期望每轴瓦片数，默认 2
 * @param options.maxTiles 总瓦片上限，默认 320
 */
export function estimateZoomFromBounds(
	bounds: GeoBounds,
	minZoom: number,
	maxZoom: number,
	options?: { targetTilesPerAxis?: number; maxTiles?: number }
): number {
	const targetTilesPerAxis = options?.targetTilesPerAxis ?? 2;
	const maxTiles = options?.maxTiles ?? 320;
	const centerLat = (bounds.south + bounds.north) / 2;
	const cosLat = Math.max(Math.cos(centerLat * DEG2RAD), 0.15);
	const lonSpanM = Math.abs(bounds.east - bounds.west) * 111320 * cosLat;
	const latSpanM = Math.abs(bounds.north - bounds.south) * 111320;
	const maxSpanM = Math.max(lonSpanM, latSpanM, 1);

	let zoom = Math.floor(Math.log2((2 * Math.PI * WGS84_A) / (maxSpanM / targetTilesPerAxis)));
	zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

	while (zoom > minZoom) {
		const minTile = lonLatToTile(bounds.west, bounds.north, zoom);
		const maxTile = lonLatToTile(bounds.east, bounds.south, zoom);
		const total = (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1);
		if (total <= maxTiles) break;
		zoom--;
	}

	return zoom;
}

/**
 * 带滞回的影像 Level 选择，减轻缩放时在相邻 Level 间来回跳变。
 *
 * - `currentZoom < 0`：直接返回理想 Level；
 * - 理想 Level 更高：仅当视距足够近才 +1；
 * - 理想 Level 更低：仅当视距足够远才 -1。
 *
 * @param currentZoom 当前已加载 Level，未知时传 `-1`
 * @param viewDistance 相机到目标点距离（米）
 */
export function resolveImageryZoom(currentZoom: number, viewDistance: number, minZoom: number, maxZoom: number): number {
	const ideal = estimateZoomFromAltitude(viewDistance, minZoom, maxZoom);
	if (currentZoom < 0) return ideal;
	if (ideal === currentZoom) return currentZoom;

	if (ideal > currentZoom) {
		const zoomInDistance = viewDistanceForZoomLevel(currentZoom + 0.55);
		return viewDistance < zoomInDistance ? Math.min(currentZoom + 1, maxZoom) : currentZoom;
	}

	const zoomOutDistance = viewDistanceForZoomLevel(currentZoom - 0.45);
	return viewDistance > zoomOutDistance ? Math.max(currentZoom - 1, minZoom) : currentZoom;
}

/**
 * 若 bounds 跨度超过上限，则以中心点重新生成不超过 `maxSpanLon/Lat` 的矩形。
 * 用于视锥求交结果过大时的兜底裁剪。
 *
 * @param maxSpanLon 最大经度跨度（度）
 * @param maxSpanLat 最大纬度跨度（度）
 */
export function clampBoundsAroundCenter(bounds: GeoBounds, centerLon: number, centerLat: number, maxSpanLon: number, maxSpanLat: number): GeoBounds {
	const spanLon = bounds.east - bounds.west;
	const spanLat = bounds.north - bounds.south;

	if (spanLon <= maxSpanLon && spanLat <= maxSpanLat) {
		return bounds;
	}

	const halfLon = maxSpanLon / 2;
	const halfLat = maxSpanLat / 2;

	return {
		west: centerLon - halfLon,
		east: centerLon + halfLon,
		south: centerLat - halfLat,
		north: centerLat + halfLat,
	};
}

/**
 * 生成瓦片范围指纹，供 ImageryLayer 判断本帧是否需要重新规划。
 * 格式：`{zoom}:{minX},{minY},{maxX},{maxY}`
 */
export function getTileRangeKey(bounds: GeoBounds, zoom: number): string {
	const minTile = lonLatToTile(bounds.west, bounds.north, zoom);
	const maxTile = lonLatToTile(bounds.east, bounds.south, zoom);
	return `${zoom}:${minTile.x},${minTile.y},${maxTile.x},${maxTile.y}`;
}

/**
 * 解析瓦片 key（`zoom/x/y`）。
 *
 * @returns 合法时返回索引；格式错误或非有限数时返回 `null`
 */
export function parseTileKey(key: string): { zoom: number; x: number; y: number } | null {
	const parts = key.split("/");
	if (parts.length !== 3) return null;
	const zoom = Number(parts[0]);
	const x = Number(parts[1]);
	const y = Number(parts[2]);
	if (!Number.isFinite(zoom) || !Number.isFinite(x) || !Number.isFinite(y)) return null;
	return { zoom, x, y };
}

/**
 * 判断瓦片 `(zoom,x,y)` 是否落在给定地理 bounds 覆盖的瓦片矩形内。
 * 注意：Y 方向使用「北→南」的 Slippy 索引比较。
 */
export function isTileInRange(zoom: number, x: number, y: number, bounds: GeoBounds): boolean {
	const minTile = lonLatToTile(bounds.west, bounds.north, zoom);
	const maxTile = lonLatToTile(bounds.east, bounds.south, zoom);
	return x >= minTile.x && x <= maxTile.x && y >= minTile.y && y <= maxTile.y;
}

/**
 * 求两个地理 bounds 的并集（外接矩形）。
 */
export function mergeBounds(a: GeoBounds, b: GeoBounds): GeoBounds {
	return {
		west: Math.min(a.west, b.west),
		south: Math.min(a.south, b.south),
		east: Math.max(a.east, b.east),
		north: Math.max(a.north, b.north),
	};
}

/**
 * 求两个地理 bounds 的交集。无重叠时返回 `null`。
 */
export function intersectBounds(a: GeoBounds, b: GeoBounds): GeoBounds | null {
	const west = Math.max(a.west, b.west);
	const south = Math.max(a.south, b.south);
	const east = Math.min(a.east, b.east);
	const north = Math.min(a.north, b.north);
	if (east <= west || north <= south) return null;
	return { west, south, east, north };
}

/**
 * 按瓦片数向外扩展 bounds（四边各扩展 `paddingTiles` 块）。
 * 纬度方向使用近似 `170.1022 / 2^zoom` 度/瓦片（Web 墨卡托可视纬度范围）。
 *
 * @param paddingTiles 扩展的瓦片圈数
 * @param zoom 当前 Level，用于换算每瓦片经纬度跨度
 */
export function expandBounds(bounds: GeoBounds, paddingTiles: number, zoom: number): GeoBounds {
	const n = Math.pow(2, zoom);
	const lonPerTile = 360 / n;
	const latPerTile = 170.1022 / n;

	return {
		west: bounds.west - lonPerTile * paddingTiles,
		south: bounds.south - latPerTile * paddingTiles,
		east: bounds.east + lonPerTile * paddingTiles,
		north: bounds.north + latPerTile * paddingTiles,
	};
}

/**
 * 以环视目标点为中心的稳定视域范围（不随相机旋转抖动）。
 *
 * 半径由视距与透视 FOV 估算，并保证至少覆盖约 2.5 块当前 zoom 瓦片。
 * 用于影像动态加载，避免仅靠视锥四角时旋转导致范围剧烈变化。
 *
 * @param viewDistance 相机到目标点距离（米）
 * @param zoom 当前影像 Level
 */
export function getStableViewBounds(camera: THREE.Camera, target: THREE.Vector3, origin: Wgs84Coord, viewDistance: number, zoom: number): GeoBounds {
	const center = enuToWgs84({ x: target.x, y: target.y, z: target.z }, origin);
	const distance = Math.max(viewDistance, 1);

	let radiusMeters = distance * 0.6;
	if (camera instanceof THREE.PerspectiveCamera) {
		const vFovRad = camera.fov * DEG2RAD;
		const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * camera.aspect);
		const hRadius = distance * Math.tan(hFovRad / 2);
		const vRadius = distance * Math.tan(vFovRad / 2);
		radiusMeters = Math.max(hRadius, vRadius) * 1.25;
	}

	const tileSizeM = getTileSizeMeters(zoom);
	radiusMeters = Math.max(radiusMeters, tileSizeM * 2.5);

	const latRad = center.latitude * DEG2RAD;
	const cosLat = Math.max(Math.cos(latRad), 0.15);
	const latSpan = radiusMeters / 111320;
	const lonSpan = radiusMeters / (111320 * cosLat);

	return {
		west: center.longitude - lonSpan,
		east: center.longitude + lonSpan,
		south: center.latitude - latSpan,
		north: center.latitude + latSpan,
	};
}

/**
 * 根据当前相机视锥与地平面（Y=0）求交，估算地面地理范围。
 *
 * 流程：
 * 1. 对 NDC 四角发射射线，与地平面求交并转为 WGS84；
 * 2. 并入环视目标点；
 * 3. 取点集外接矩形，再按视距限制最大跨度，防止仰视时范围爆炸。
 *
 * @returns 估算的 `GeoBounds`；实现上始终有兜底值（类型保留 `null` 兼容旧调用）
 */
export function getGroundBoundsFromCamera(camera: THREE.Camera, target: THREE.Vector3, origin: Wgs84Coord): GeoBounds | null {
	const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
	const raycaster = new THREE.Raycaster();
	const ndcCorners = [new THREE.Vector2(-1, -1), new THREE.Vector2(1, -1), new THREE.Vector2(1, 1), new THREE.Vector2(-1, 1)];

	const points: Wgs84Coord[] = [];
	const hitPoint = new THREE.Vector3();

	for (const ndc of ndcCorners) {
		raycaster.setFromCamera(ndc, camera);
		if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
			points.push(enuToWgs84({ x: hitPoint.x, y: hitPoint.y, z: hitPoint.z }, origin));
		}
	}

	points.push(enuToWgs84({ x: target.x, y: target.y, z: target.z }, origin));

	if (points.length === 0) {
		const center = enuToWgs84({ x: target.x, y: target.y, z: target.z }, origin);
		const span = Math.max(target.distanceTo(camera.position), 100) / 111320;
		return {
			west: center.longitude - span,
			east: center.longitude + span,
			south: center.latitude - span,
			north: center.latitude + span,
		};
	}

	let west = Infinity;
	let south = Infinity;
	let east = -Infinity;
	let north = -Infinity;

	for (const p of points) {
		west = Math.min(west, p.longitude);
		south = Math.min(south, p.latitude);
		east = Math.max(east, p.longitude);
		north = Math.max(north, p.latitude);
	}

	const center = enuToWgs84({ x: target.x, y: target.y, z: target.z }, origin);
	const viewDistance = camera.position.distanceTo(target);
	const maxSpan = Math.max(0.002, (viewDistance / 111320) * 2.5);

	return clampBoundsAroundCenter({ west, south, east, north }, center.longitude, center.latitude, maxSpan, maxSpan);
}

/**
 * 获取「ECEF → 以给定原点为中心的局部直立坐标系」变换矩阵的拷贝。
 * 输出约定：x=东，y=天，z=南（北取反），与场景坐标一致。
 *
 * 主要用途：把地理参考的 ECEF 几何（如 3D Tiles）摆正为"就地直立"姿态。
 * 外部修改返回值不会影响内部缓存。
 */
export function getEnuMatrix(origin: Wgs84Coord): THREE.Matrix4 {
	ensureEnuMatrices(origin);
	return _enuMatrix!.clone();
}
