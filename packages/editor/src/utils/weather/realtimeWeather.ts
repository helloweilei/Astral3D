import { App, defaultWeatherClouds, defaultWeatherRealtime } from "@astral3d/engine";

export type RealtimeWeatherKind = "sunny" | "partlyCloudy" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

export type WeatherEffectKey = "fog" | "rain" | "snow" | "lightning" | "clouds";

export interface RealtimeWeatherSnapshot {
	kind: RealtimeWeatherKind;
	flags: WeatherFlags;
	temperature: number | null;
	apparentTemperature: number | null;
	humidity: number | null;
	windSpeed: number | null;
	precipitation: number | null;
	cloudCover: number | null;
	code: number;
	isDay: boolean;
	city: string;
	region: string;
}

export interface WeatherFlags {
	fog: boolean;
	rain: boolean;
	snow: boolean;
	lightning: boolean;
	clouds: boolean;
}

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const REVERSE_GEO_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

const cityCache = new Map<string, { city: string; region: string }>();

function geoCacheKey(latitude: number, longitude: number) {
	return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

function pickCityName(json: Record<string, unknown>): { city: string; region: string } {
	const city = String(json.city || json.locality || json.principalSubdivision || "").trim() || "";
	const region = [json.principalSubdivision /*json.countryName*/]
		.map(v => String(v || "").trim())
		.filter(Boolean)
		.join(" · ");
	return { city, region };
}

async function fetchCityName(latitude: number, longitude: number): Promise<{ city: string; region: string }> {
	const key = geoCacheKey(latitude, longitude);
	const cached = cityCache.get(key);
	if (cached) return cached;

	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		localityLanguage: "zh",
	});
	const res = await fetch(`${REVERSE_GEO_URL}?${params.toString()}`);
	if (!res.ok) return { city: "", region: "" };
	const json = (await res.json()) as Record<string, unknown>;
	const place = pickCityName(json);
	if (!place.city) {
		place.city = "西安";
		place.region = place.region || "陕西省";
	}
	cityCache.set(key, place);
	return place;
}

function toFiniteNumber(value: unknown): number | null {
	if (value == null) return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

export function ensureWeatherRealtimeDefaults() {
	if (App.project.getKey("weather.realtime") == null) {
		App.project.setKey("weather.realtime", defaultWeatherRealtime(), false);
	}
	if (App.project.getKey("weather.clouds") == null) {
		App.project.setKey("weather.clouds", defaultWeatherClouds(), false);
	}
}

export function mapWeatherCode(code: number, cloudCover = 0): { kind: RealtimeWeatherKind; flags: WeatherFlags } {
	if (code === 45 || code === 48) {
		return { kind: "fog", flags: { fog: true, rain: false, snow: false, lightning: false, clouds: true } };
	}
	if (code >= 95 && code <= 99) {
		return { kind: "thunder", flags: { fog: false, rain: true, snow: false, lightning: true, clouds: true } };
	}
	if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
		return { kind: "snow", flags: { fog: false, rain: false, snow: true, lightning: false, clouds: true } };
	}
	if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
		return { kind: "rain", flags: { fog: false, rain: true, snow: false, lightning: false, clouds: true } };
	}
	if (code === 3 || cloudCover >= 80) {
		return { kind: "cloudy", flags: { fog: false, rain: false, snow: false, lightning: false, clouds: true } };
	}
	if (code === 1 || code === 2 || cloudCover >= 25) {
		return { kind: "partlyCloudy", flags: { fog: false, rain: false, snow: false, lightning: false, clouds: true } };
	}
	return { kind: "sunny", flags: { fog: false, rain: false, snow: false, lightning: false, clouds: false } };
}

export function applyWeatherFlags(flags: WeatherFlags) {
	const keys: WeatherEffectKey[] = ["fog", "rain", "snow", "lightning", "clouds"];
	const defaults = {
		clouds: defaultWeatherClouds(),
	} as Record<WeatherEffectKey, unknown>;

	for (const key of keys) {
		const current = App.project.getKey(`weather.${key}`) ?? defaults[key];
		if (!current) continue;
		App.project.setKey(`weather.${key}`, { ...current, enabled: flags[key] });
	}
}

export async function fetchRealtimeWeather(latitude: number, longitude: number): Promise<RealtimeWeatherSnapshot> {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,cloud_cover,precipitation,wind_speed_10m",
		timezone: "auto",
		wind_speed_unit: "kmh",
	});
	const [weatherRes, place] = await Promise.all([
		fetch(`${OPEN_METEO_URL}?${params.toString()}`),
		fetchCityName(latitude, longitude).catch(() => ({ city: "", region: "" })),
	]);
	if (!weatherRes.ok) {
		throw new Error(`Open-Meteo ${weatherRes.status}`);
	}
	const json = await weatherRes.json();
	const current = json?.current ?? {};
	const code = Number(current.weather_code ?? 0);
	const cloudCover = toFiniteNumber(current.cloud_cover);
	const { kind, flags } = mapWeatherCode(code, cloudCover ?? 0);
	return {
		kind,
		flags,
		temperature: toFiniteNumber(current.temperature_2m),
		apparentTemperature: toFiniteNumber(current.apparent_temperature),
		humidity: toFiniteNumber(current.relative_humidity_2m),
		windSpeed: toFiniteNumber(current.wind_speed_10m),
		precipitation: toFiniteNumber(current.precipitation),
		cloudCover,
		code,
		isDay: Number(current.is_day ?? 1) === 1,
		city: place.city,
		region: place.region,
	};
}

/** 西安钟楼附近，实时天气默认定位 */
export const DEFAULT_WEATHER_ORIGIN = {
	longitude: 108.94,
	latitude: 34.341,
};

export function resolveWeatherOrigin() {
	return { ...DEFAULT_WEATHER_ORIGIN };
}
