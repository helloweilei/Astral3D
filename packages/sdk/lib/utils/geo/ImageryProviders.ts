export type ImageryProviderId = "custom" | "osm" | "tianditu_vec" | "tianditu_img";

export interface ImageryProviderOptions {
	url?: string;
	token?: string;
}

/** 影像源可选的预置图层 */
export interface ImageryPreset {
	/** 稳定 id，用于匹配当前 URL */
	id: string;
	/** i18n 键：layout.sider.terrain.{nameKey} */
	nameKey: string;
	/** XYZ 瓦片 URL 模板，支持 {x}/{y}/{z}/{zoom}/{token}/{s}/{switch:a,b,c} */
	url: string;
}

/** @deprecated 使用 `ImageryPreset` */
export type CustomImageryPreset = ImageryPreset;

const OSM_URL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
/** 默认自定义源：高德卫星。统一用 https，否则 https 站点下会被当作混合内容拦截 */
const CUSTOM_URL = "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";

export const DEFAULT_OSM_TILE_URL = OSM_URL;
export const DEFAULT_CUSTOM_TILE_URL = CUSTOM_URL;

/** 使用 GCJ-02（国测局加密）坐标系的瓦片源域名特征：高德、腾讯 */
const GCJ02_URL_PATTERN = /autonavi\.com|amap\.com|map\.qq\.com/i;

/**
 * 判断瓦片 URL 是否为 GCJ-02 坐标系的源（高德/腾讯等国内服务）。
 * 这类源的瓦片索引与 WGS84 存在约 100~700 米加偏，
 * `ImageryLayer` 会据此在选瓦片/摆瓦片时做正反纠偏，保证与地理参考模型对齐。
 */
export function isGcj02ImageryUrl(url: string | undefined): boolean {
	return !!url && GCJ02_URL_PATTERN.test(url);
}

/** Esri ArcGIS Online 公开底图服务前缀，瓦片路径为 `{z}/{y}/{x}` */
const ESRI_BASE = "https://server.arcgisonline.com/ArcGIS/rest/services";

/**
 * OSM 源可选的预置图层。
 *
 * 均为公开、免 token、带 `Access-Control-Allow-Origin: *` 的 XYZ 栅格瓦片服务，
 * 选择后写入 `imagery.url`。这里未收录 tile.openstreetmap.org、CARTO、
 * OpenTopoMap 等——它们在国内网络下普遍连不通，放进来只会得到一片空白瓦片。
 */
export const OSM_IMAGERY_PRESETS: ImageryPreset[] = [
	{
		id: "osm_humanitarian",
		nameKey: "OSM Humanitarian",
		url: OSM_URL,
	},
	{
		id: "osm_france",
		nameKey: "OSM France",
		url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
	},
	{
		id: "osm_cyclosm",
		nameKey: "CyclOSM",
		url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
	},
	{
		id: "esri_imagery",
		nameKey: "Esri Imagery",
		url: `${ESRI_BASE}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
	},
	{
		id: "esri_street",
		nameKey: "Esri Street",
		url: `${ESRI_BASE}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
	},
	{
		id: "esri_topo",
		nameKey: "Esri Topo",
		url: `${ESRI_BASE}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`,
	},
	{
		id: "esri_relief",
		nameKey: "Esri Shaded Relief",
		url: `${ESRI_BASE}/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}`,
	},
	{
		id: "esri_natgeo",
		nameKey: "Esri NatGeo",
		url: `${ESRI_BASE}/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}`,
	},
	{
		id: "esri_light_gray",
		nameKey: "Esri Light Gray",
		url: `${ESRI_BASE}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
	},
	{
		id: "esri_dark_gray",
		nameKey: "Esri Dark Gray",
		url: `${ESRI_BASE}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
	},
];

/**
 * 自定义 URL 可选的预置图层（高德等）。
 * 选择后写入 `imagery.url`，仍走 custom provider。
 */
export const CUSTOM_IMAGERY_PRESETS: ImageryPreset[] = [
	{
		id: "gaode_satellite",
		nameKey: "Gaode Satellite",
		url: CUSTOM_URL,
	},
	{
		id: "gaode_road",
		nameKey: "Gaode Road",
		url: "https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
	},
	{
		id: "gaode_vector",
		nameKey: "Gaode Vector",
		url: "https://wprd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}",
	},
	{
		id: "gaode_label",
		nameKey: "Gaode Label",
		url: "https://webst02.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
	},
];

/** 比较预置 URL 时忽略协议，兼容历史配置里存下来的 http 地址 */
function normalizePresetUrl(url: string): string {
	return url.trim().replace(/^https?:/i, "");
}

/** 取得指定影像源可选的预置图层，无预置时返回空数组 */
export function getImageryPresets(provider: ImageryProviderId): ImageryPreset[] {
	switch (provider) {
		case "osm":
			return OSM_IMAGERY_PRESETS;
		case "custom":
			return CUSTOM_IMAGERY_PRESETS;
		default:
			return [];
	}
}

/** 根据当前 URL 匹配预置图层 id，未匹配返回 null */
export function findImageryPresetId(provider: ImageryProviderId, url?: string): string | null {
	const normalized = normalizePresetUrl(url ?? "");
	if (!normalized) return null;
	const found = getImageryPresets(provider).find(item => normalizePresetUrl(item.url) === normalized);
	return found?.id ?? null;
}

/** @deprecated 使用 `findImageryPresetId("custom", url)` */
export function findCustomImageryPresetId(url?: string): string | null {
	return findImageryPresetId("custom", url);
}

/** 切换影像源时，将占位/另一源的默认 URL 替换为当前源默认值 */
export function resolveImageryUrlForProvider(provider: ImageryProviderId, currentUrl?: string): string {
	const url = currentUrl?.trim() ?? "";

	if (provider !== "osm" && provider !== "custom") return url;

	const otherProvider: ImageryProviderId = provider === "osm" ? "custom" : "osm";
	const belongsToOther = findImageryPresetId(otherProvider, url) !== null;

	if (!url || belongsToOther) {
		return provider === "osm" ? OSM_URL : CUSTOM_URL;
	}
	return url;
}

/** `{s}` 占位符默认可用的子域名 */
const DEFAULT_SUBDOMAINS = ["a", "b", "c"];

function applyTileTemplate(template: string, z: number, x: number, y: number, token = ""): string {
	return template
		// {switch:a,b,c} / {s}：按瓦片索引轮询子域名，分散并发请求
		.replace(/\{switch:([^}]*)\}/g, (_, list: string) => {
			const items = list
				.split(",")
				.map(item => item.trim())
				.filter(Boolean);
			return items.length > 0 ? items[(x + y) % items.length] : "";
		})
		.replace(/\{s\}/g, DEFAULT_SUBDOMAINS[(x + y) % DEFAULT_SUBDOMAINS.length])
		.replace(/\{z\}/g, String(z))
		.replace(/\{zoom\}/g, String(z))
		.replace(/\{x\}/g, String(x))
		.replace(/\{y\}/g, String(y))
		.replace(/\{token\}/g, token);
}

const TIANDITU_IMG_URL = "https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk={token}";
const TIANDITU_VEC_URL = "https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk={token}";

export function buildImageryTileUrl(
	provider: ImageryProviderId,
	z: number,
	x: number,
	y: number,
	options: ImageryProviderOptions = {}
): string {
	const sub = (x + y) % 8;

	switch (provider) {
		case "osm":
			return applyTileTemplate(options.url?.trim() || OSM_URL, z, x, y);
		case "tianditu_img":
			return TIANDITU_IMG_URL.replace("{s}", String(sub))
				.replace("{x}", String(x))
				.replace("{y}", String(y))
				.replace("{z}", String(z))
				.replace("{token}", options.token || "");
		case "tianditu_vec":
			return TIANDITU_VEC_URL.replace("{s}", String(sub))
				.replace("{x}", String(x))
				.replace("{y}", String(y))
				.replace("{z}", String(z))
				.replace("{token}", options.token || "");
		case "custom":
		default:
			return applyTileTemplate(options.url?.trim() || CUSTOM_URL, z, x, y, options.token || "");
	}
}

export const IMAGERY_PROVIDER_LABELS: Record<ImageryProviderId, string> = {
	custom: "Custom URL",
	osm: "OpenStreetMap",
	tianditu_vec: "Tianditu Vector",
	tianditu_img: "Tianditu Imagery",
};
