<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from "vue";
import { Cloudy, CloudRain, Fog, Moon, PartlyCloudy, PartlyCloudyNight, Snow, Sunny, Thunderstorm } from "@vicons/carbon";
import { useThemeVars } from "naive-ui";
import { App, Hooks } from "@astral3d/engine";
import { t } from "@/language";
import {
	applyWeatherFlags,
	ensureWeatherRealtimeDefaults,
	fetchRealtimeWeather,
	resolveWeatherOrigin,
	type RealtimeWeatherKind,
	type RealtimeWeatherSnapshot,
} from "@/utils/weather/realtimeWeather";

const visible = ref(false);
const loading = ref(false);
const snapshot = ref<RealtimeWeatherSnapshot | null>(null);
const themeVars = useThemeVars();
const primaryColor = computed(() => themeVars.value.primaryColor);

let pollTimer: ReturnType<typeof setInterval> | null = null;
let fetchSeq = 0;

const kind = computed<RealtimeWeatherKind>(() => snapshot.value?.kind ?? "sunny");
const isDay = computed(() => snapshot.value?.isDay !== false);

const weatherIcon = computed<Component>(() => {
	switch (kind.value) {
		case "partlyCloudy":
			return isDay.value ? PartlyCloudy : PartlyCloudyNight;
		case "cloudy":
			return Cloudy;
		case "fog":
			return Fog;
		case "rain":
			return CloudRain;
		case "snow":
			return Snow;
		case "thunder":
			return Thunderstorm;
		default:
			return isDay.value ? Sunny : Moon;
	}
});

/** 图标色随天气类型变化 */
const iconColor = computed(() => {
	if (!isDay.value && (kind.value === "sunny" || kind.value === "partlyCloudy")) return "#C5D0FF";
	switch (kind.value) {
		case "sunny":
			return "#FFC53D";
		case "partlyCloudy":
			return "#FFD666";
		case "cloudy":
			return "#A8B4C4";
		case "fog":
			return "#C5CDD6";
		case "rain":
			return "#4DA3FF";
		case "snow":
			return "#8FE3FF";
		case "thunder":
			return "#B37FEB";
		default:
			return "#FFC53D";
	}
});

/** 温度色随气温分段：冷蓝 → 适中绿 → 暖橙 → 热红 */
const temperatureColor = computed(() => {
	const temp = snapshot.value?.temperature;
	if (temp == null) return "#FFFFFF";
	if (temp <= 0) return "#5B8FF9";
	if (temp <= 10) return "#69C0FF";
	if (temp <= 18) return "#73D13D";
	if (temp <= 26) return "#FFC53D";
	if (temp <= 33) return "#FF7A45";
	return "#F5222D";
});

const temperatureText = computed(() => {
	if (loading.value && snapshot.value?.temperature == null) return "--";
	if (snapshot.value?.temperature == null) return "--";
	return `${Math.round(snapshot.value.temperature)}°`;
});

const locationText = computed(() => {
	const city = snapshot.value?.city?.trim();
	const region = snapshot.value?.region?.trim();
	if (city && region && !region.startsWith(city)) return `${city} · ${region}`;
	return city || region || t("layout.sider.weather['Unknown place']");
});

const kindLabel = computed(() => {
	const map: Record<RealtimeWeatherKind, string> = {
		sunny: t("layout.sider.weather.Sunny"),
		partlyCloudy: t("layout.sider.weather['Partly Cloudy']"),
		cloudy: t("layout.sider.weather.Overcast"),
		fog: t("layout.sider.weather.Fog"),
		rain: t("layout.sider.weather.Rain"),
		snow: t("layout.sider.weather.Snow"),
		thunder: t("layout.sider.weather.Thunderstorm"),
	};
	return map[kind.value];
});

function formatNumber(value: number | null | undefined, digits = 0, suffix = "") {
	if (value == null || Number.isNaN(value)) return "--";
	return `${value.toFixed(digits)}${suffix}`;
}

function clearPoll() {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
}

function onTerrainChanged() {
	if (visible.value) refreshWeather();
}

async function refreshWeather() {
	if (!visible.value) return;
	const seq = ++fetchSeq;
	loading.value = true;
	try {
		const origin = resolveWeatherOrigin();
		const next = await fetchRealtimeWeather(origin.latitude, origin.longitude);
		if (seq !== fetchSeq || !visible.value) return;
		snapshot.value = next;
		applyWeatherFlags(next.flags);
	} catch {
		if (seq !== fetchSeq) return;
	} finally {
		if (seq === fetchSeq) loading.value = false;
	}
}

function syncFromProject() {
	ensureWeatherRealtimeDefaults();
	const enabled = !!App.project.getKey("weather.realtime.enabled");
	visible.value = enabled;
	if (!enabled) {
		clearPoll();
		snapshot.value = null;
		return;
	}
	refreshWeather();
	clearPoll();
	pollTimer = setInterval(refreshWeather, 10 * 60 * 1000);
}

onMounted(() => {
	syncFromProject();
	Hooks.useAddSignal("sceneWeatherRealtimeChanged", syncFromProject);
	Hooks.useAddSignal("sceneTerrainSettingsChanged", onTerrainChanged);
	Hooks.useAddSignal("sceneCleared", syncFromProject);
});

onBeforeUnmount(() => {
	clearPoll();
	Hooks.useRemoveSignal("sceneWeatherRealtimeChanged", syncFromProject);
	Hooks.useRemoveSignal("sceneTerrainSettingsChanged", onTerrainChanged);
	Hooks.useRemoveSignal("sceneCleared", syncFromProject);
});
</script>

<template>
	<div v-if="visible" class="viewport-realtime-weather">
		<n-tooltip placement="bottom" trigger="hover">
			<template #trigger>
				<div class="viewport-realtime-weather__pill">
					<n-icon class="viewport-realtime-weather__icon" :size="20" :color="iconColor">
						<component :is="weatherIcon" />
					</n-icon>
					<span class="viewport-realtime-weather__temp" :style="{ color: temperatureColor }">{{ temperatureText }}</span>
				</div>
			</template>
			<div class="viewport-realtime-weather__tip" :style="{ '--weather-value-color': primaryColor }">
				<div class="viewport-realtime-weather__city">{{ locationText }}</div>
				<div class="viewport-realtime-weather__kind">{{ kindLabel }}</div>
				<div class="viewport-realtime-weather__rows">
					<div>
						<span>{{ t("layout.sider.weather['Feels like']") }}</span>
						<em>{{ formatNumber(snapshot?.apparentTemperature, 0, "°") }}</em>
					</div>
					<div>
						<span>{{ t("layout.sider.weather.Humidity") }}</span>
						<em>{{ formatNumber(snapshot?.humidity, 0, "%") }}</em>
					</div>
					<div>
						<span>{{ t("layout.sider.weather.Wind") }}</span>
						<em>{{ formatNumber(snapshot?.windSpeed, 0, " km/h") }}</em>
					</div>
					<div>
						<span>{{ t("layout.sider.weather.Precipitation") }}</span>
						<em>{{ formatNumber(snapshot?.precipitation, 1, " mm") }}</em>
					</div>
					<div>
						<span>{{ t("layout.sider.weather['Cloud cover']") }}</span>
						<em>{{ formatNumber(snapshot?.cloudCover, 0, "%") }}</em>
					</div>
				</div>
			</div>
		</n-tooltip>
	</div>
</template>

<style scoped lang="less">
.viewport-realtime-weather {
	position: absolute;
	top: 8px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 13;
	user-select: none;
}

.viewport-realtime-weather__pill {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 8px 2px 6px;
	border-radius: 999px;
	background: rgba(0, 0, 0, 0.18);
	cursor: default;
}

.viewport-realtime-weather__icon {
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
}

.viewport-realtime-weather__temp {
	font-size: 13px;
	line-height: 1;
	font-weight: 600;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.viewport-realtime-weather__tip {
	min-width: 168px;
	padding: 2px 0;
}

.viewport-realtime-weather__city {
	font-size: 13px;
	font-weight: 600;
	line-height: 1.3;
}

.viewport-realtime-weather__kind {
	margin: 2px 0 8px;
	font-size: 12px;
	opacity: 0.78;
}

.viewport-realtime-weather__rows {
	display: grid;
	gap: 4px;

	div {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		font-size: 12px;
		line-height: 1.4;
	}

	span {
		opacity: 0.72;
	}

	em {
		font-style: normal;
		font-weight: 600;
		color: var(--weather-value-color);
	}
}
</style>
