import * as THREE from "three";
import proj4 from "proj4";

const WGS84 = "EPSG:4326";
const WEB_MERCATOR = "EPSG:3857";

proj4.defs(WEB_MERCATOR, "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs");

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const WGS84_A = 6378137;
const WGS84_E2 = 0.00669437999014;

export interface Wgs84Coord {
	longitude: number;
	latitude: number;
	height: number;
}

export interface EnuCoord {
	x: number;
	y: number;
	z: number;
}

function wgs84ToEcef(lon: number, lat: number, height: number): THREE.Vector3 {
	const lonRad = lon * DEG2RAD;
	const latRad = lat * DEG2RAD;
	const sinLat = Math.sin(latRad);
	const cosLat = Math.cos(latRad);
	const sinLon = Math.sin(lonRad);
	const cosLon = Math.cos(lonRad);
	const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);

	return new THREE.Vector3(
		(n + height) * cosLat * cosLon,
		(n + height) * cosLat * sinLon,
		(n * (1 - WGS84_E2) + height) * sinLat
	);
}

function buildEnuMatrix(origin: Wgs84Coord): THREE.Matrix4 {
	const lonRad = origin.longitude * DEG2RAD;
	const latRad = origin.latitude * DEG2RAD;
	const sinLat = Math.sin(latRad);
	const cosLat = Math.cos(latRad);
	const sinLon = Math.sin(lonRad);
	const cosLon = Math.cos(lonRad);

	const originEcef = wgs84ToEcef(origin.longitude, origin.latitude, origin.height);

	const east = new THREE.Vector3(-sinLon, cosLon, 0);
	const north = new THREE.Vector3(-sinLat * cosLon, -sinLat * sinLon, cosLat);
	const up = new THREE.Vector3(cosLat * cosLon, cosLat * sinLon, sinLat);

	const rotation = new THREE.Matrix4().makeBasis(east, up, north);
	const translation = new THREE.Matrix4().makeTranslation(-originEcef.x, -originEcef.y, -originEcef.z);

	return new THREE.Matrix4().multiplyMatrices(rotation, translation);
}

let _enuMatrix: THREE.Matrix4 | null = null;
let _enuInverse: THREE.Matrix4 | null = null;
let _originKey = "";

function ensureEnuMatrices(origin: Wgs84Coord) {
	const key = `${origin.longitude},${origin.latitude},${origin.height}`;
	if (_originKey === key && _enuMatrix && _enuInverse) return;

	_originKey = key;
	_enuMatrix = buildEnuMatrix(origin);
	_enuInverse = _enuMatrix.clone().invert();
}

export function setEnuOrigin(origin: Wgs84Coord) {
	ensureEnuMatrices(origin);
}

export function wgs84ToEnu(coord: Wgs84Coord, origin: Wgs84Coord): EnuCoord {
	ensureEnuMatrices(origin);
	const ecef = wgs84ToEcef(coord.longitude, coord.latitude, coord.height);
	ecef.applyMatrix4(_enuMatrix!);
	return { x: ecef.x, y: ecef.y, z: ecef.z };
}

export function enuToWgs84(enu: EnuCoord, origin: Wgs84Coord): Wgs84Coord {
	ensureEnuMatrices(origin);
	const ecef = new THREE.Vector3(enu.x, enu.y, enu.z);
	ecef.applyMatrix4(_enuInverse!);

	const x = ecef.x;
	const y = ecef.y;
	const z = ecef.z;
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

export function lonLatToMercatorMeters(lon: number, lat: number): { x: number; y: number } {
	const [x, y] = proj4(WGS84, WEB_MERCATOR, [lon, lat]);
	return { x, y };
}

export function mercatorMetersToLonLat(x: number, y: number): { lon: number; lat: number } {
	const [lon, lat] = proj4(WEB_MERCATOR, WGS84, [x, y]);
	return { lon, lat };
}

export function lonLatToTile(lon: number, lat: number, zoom: number): { x: number; y: number } {
	const n = Math.pow(2, zoom);
	const x = Math.floor(((lon + 180) / 360) * n);
	const latRad = lat * DEG2RAD;
	const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
	return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

export function tileToLonLatBounds(
	x: number,
	y: number,
	z: number
): { west: number; south: number; east: number; north: number } {
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

export function getTileSizeMeters(zoom: number): number {
	return (2 * Math.PI * WGS84_A) / Math.pow(2, zoom);
}

export function estimateZoomFromAltitude(altitude: number, minZoom: number, maxZoom: number): number {
	const size = Math.max(altitude, 1);
	let zoom = Math.floor(Math.log2((2 * Math.PI * WGS84_A) / size));
	return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * 根据 bounds 地理跨度估算 Level，使完整范围约 2×2 块瓦片覆盖，且不超过 maxTiles。
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

export function resolveImageryZoom(
	currentZoom: number,
	viewDistance: number,
	minZoom: number,
	maxZoom: number
): number {
	const ideal = estimateZoomFromAltitude(viewDistance, minZoom, maxZoom);
	if (currentZoom < 0) return ideal;
	if (ideal === currentZoom) return currentZoom;

	const worldSize = 2 * Math.PI * WGS84_A;

	if (ideal > currentZoom) {
		const zoomInDistance = worldSize / Math.pow(2, currentZoom + 0.55);
		return viewDistance < zoomInDistance ? Math.min(currentZoom + 1, maxZoom) : currentZoom;
	}

	const zoomOutDistance = worldSize / Math.pow(2, currentZoom - 0.45);
	return viewDistance > zoomOutDistance ? Math.max(currentZoom - 1, minZoom) : currentZoom;
}

export function clampBoundsAroundCenter(
	bounds: GeoBounds,
	centerLon: number,
	centerLat: number,
	maxSpanLon: number,
	maxSpanLat: number
): GeoBounds {
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

export function getTileRangeKey(bounds: GeoBounds, zoom: number): string {
	const minTile = lonLatToTile(bounds.west, bounds.north, zoom);
	const maxTile = lonLatToTile(bounds.east, bounds.south, zoom);
	return `${zoom}:${minTile.x},${minTile.y},${maxTile.x},${maxTile.y}`;
}

export function parseTileKey(key: string): { zoom: number; x: number; y: number } | null {
	const parts = key.split("/");
	if (parts.length !== 3) return null;
	const zoom = Number(parts[0]);
	const x = Number(parts[1]);
	const y = Number(parts[2]);
	if (!Number.isFinite(zoom) || !Number.isFinite(x) || !Number.isFinite(y)) return null;
	return { zoom, x, y };
}

export function isTileInRange(
	zoom: number,
	x: number,
	y: number,
	bounds: GeoBounds
): boolean {
	const minTile = lonLatToTile(bounds.west, bounds.north, zoom);
	const maxTile = lonLatToTile(bounds.east, bounds.south, zoom);
	return x >= minTile.x && x <= maxTile.x && y >= minTile.y && y <= maxTile.y;
}

export interface GeoBounds {
	west: number;
	south: number;
	east: number;
	north: number;
}

export function mergeBounds(a: GeoBounds, b: GeoBounds): GeoBounds {
	return {
		west: Math.min(a.west, b.west),
		south: Math.min(a.south, b.south),
		east: Math.max(a.east, b.east),
		north: Math.max(a.north, b.north),
	};
}

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
 * 以目标点为中心的稳定视域范围，不随相机旋转抖动。
 * 半径由视距与 FOV 估算，并保证至少覆盖若干当前 zoom 瓦片。
 */
export function getStableViewBounds(
	camera: THREE.Camera,
	target: THREE.Vector3,
	origin: Wgs84Coord,
	viewDistance: number,
	zoom: number
): GeoBounds {
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

export function getGroundBoundsFromCamera(
	camera: THREE.Camera,
	target: THREE.Vector3,
	origin: Wgs84Coord
): GeoBounds | null {
	const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
	const raycaster = new THREE.Raycaster();
	const ndcCorners = [
		new THREE.Vector2(-1, -1),
		new THREE.Vector2(1, -1),
		new THREE.Vector2(1, 1),
		new THREE.Vector2(-1, 1),
	];

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

	return clampBoundsAroundCenter(
		{ west, south, east, north },
		center.longitude,
		center.latitude,
		maxSpan,
		maxSpan
	);
}

export function getEnuMatrix(origin: Wgs84Coord): THREE.Matrix4 {
	ensureEnuMatrices(origin);
	return _enuMatrix!.clone();
}
