export type ImageryProviderId = "custom" | "osm" | "tianditu_vec" | "tianditu_img";

export interface ImageryProviderOptions {
	url?: string;
	token?: string;
}

const OSM_URL = "https://{switch:a,b,c}.tile-cyclosm.openstreetmap.fr/cyclosm/{zoom}/{x}/{y}.png";
const CUSTOM_URL = "http://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";

export const DEFAULT_OSM_TILE_URL = OSM_URL;
export const DEFAULT_CUSTOM_TILE_URL = CUSTOM_URL;

/** 切换影像源时，将占位/另一源的默认 URL 替换为当前源默认值 */
export function resolveImageryUrlForProvider(provider: ImageryProviderId, currentUrl?: string): string {
	const url = currentUrl?.trim() ?? "";

	switch (provider) {
		case "osm":
			if (!url || url === CUSTOM_URL) return OSM_URL;
			return url;
		case "custom":
			if (!url || url === OSM_URL) return CUSTOM_URL;
			return url;
		default:
			return url;
	}
}

function applyTileTemplate(template: string, z: number, x: number, y: number, token = ""): string {
	return template
		.replace(/\{z\}/g, String(z))
		.replace(/\{zoom\}/g, String(z))
		.replace(/\{x\}/g, String(x))
		.replace(/\{y\}/g, String(y))
		.replace(/\{token\}/g, token);
}

const TIANDITU_IMG_URL = "https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk={token}";
const TIANDITU_VEC_URL = "https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk={token}";

export function buildImageryTileUrl(provider: ImageryProviderId, z: number, x: number, y: number, options: ImageryProviderOptions = {}): string {
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
