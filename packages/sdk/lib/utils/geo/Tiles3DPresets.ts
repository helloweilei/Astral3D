/**
 * 3D Tiles 预置数据集。
 *
 * 收录条件：公开可直连、https、带 `Access-Control-Allow-Origin: *`。
 * mars3d 示例数据（data.mars3d.cn）仅有 http 端点，在 https 站点下会被
 * 混合内容策略拦截，故未收录；Cesium ion / Google 3D Tiles 需要 token，同样不收。
 */

export interface Tiles3DPreset {
	/** 稳定 id，用于匹配当前 URL */
	id: string;
	/** i18n 键：layout.sider.terrain.{nameKey} */
	nameKey: string;
	/** tileset.json 地址 */
	url: string;
	/**
	 * 数据集地理位置（从 tileset 根节点 transform 解算的 WGS84 坐标）。
	 * 应用预置时需同步设置地形原点，否则模型会落在离场景原点极远的位置。
	 */
	origin: { longitude: number; latitude: number; height: number };
}

export const TILES3D_PRESETS: Tiles3DPreset[] = [
	{
		id: "dayanta",
		nameKey: "Dayanta Photogrammetry",
		url: "https://resource.dvgis.cn/data/3dtiles/dayanta/tileset.json",
		origin: { longitude: 108.9594, latitude: 34.2196, height: 445 },
	},
	{
		id: "lujiazui",
		nameKey: "Lujiazui Buildings",
		url: "https://resource.dvgis.cn/data/3dtiles/ljz/tileset.json",
		origin: { longitude: 121.5106, latitude: 31.2363, height: 0 },
	},
	{
		id: "cesium_lod_sample",
		nameKey: "Cesium LOD Sample",
		url: "https://raw.githubusercontent.com/CesiumGS/3d-tiles-samples/main/1.0/TilesetWithDiscreteLOD/tileset.json",
		origin: { longitude: -75.6121, latitude: 40.0425, height: 503.75 },
	},
];

/** 根据当前 URL 匹配预置数据集 id，未匹配返回 null */
export function findTiles3DPresetId(url?: string): string | null {
	const normalized = url?.trim() ?? "";
	if (!normalized) return null;
	const found = TILES3D_PRESETS.find(item => item.url === normalized);
	return found?.id ?? null;
}
