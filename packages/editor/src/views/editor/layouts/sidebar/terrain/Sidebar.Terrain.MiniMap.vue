<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { t } from "@/language";
import EsInputNumber from "@/components/es/EsInputNumber.vue";
import { Information } from '@vicons/carbon';

let terrainConfig = defineModel<IAppProject.Terrain>({ required: true });
const emit = defineEmits<{ change: [] }>();

const mapEl = ref<HTMLDivElement | null>(null);
const currentLevel = ref(-1);
let levelTimer: ReturnType<typeof setInterval> | null = null;

let map: L.Map | null = null;
let originMarker: L.Marker | null = null;
let boundsRect: L.Rectangle | null = null;
const cornerMarkers: L.Marker[] = [];
let resizeObserver: ResizeObserver | null = null;
let initialFitDone = false;
const fitTimers: ReturnType<typeof setTimeout>[] = [];

/** 同步外部配置时避免回写循环 */
let syncingFromConfig = false;
/** 用户正在拖拽时，忽略外部 watch 重绘 */
let interacting = false;

const disabled = computed(() => !terrainConfig.value.enabled);

const DEFAULT_BOUNDS = {
	west: 116.38,
	south: 39.9,
	east: 116.4,
	north: 39.92,
};

const DEFAULT_ORIGIN = {
	longitude: 116.391,
	latitude: 39.907,
	height: 0,
};

/** 小地图底图：独立 OSM，不依赖场景影像源 */
const BASE_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

function getImageryBounds() {
	return terrainConfig.value.imagery?.bounds ?? DEFAULT_BOUNDS;
}

function getOrigin() {
	return terrainConfig.value.origin ?? DEFAULT_ORIGIN;
}

function normalizeBounds(bounds: IAppProject.Terrain["imagery"]["bounds"]) {
	const west = Math.min(bounds.west, bounds.east);
	const east = Math.max(bounds.west, bounds.east);
	const south = Math.min(bounds.south, bounds.north);
	const north = Math.max(bounds.south, bounds.north);
	return {
		west: Number(west.toFixed(6)),
		east: Number(east.toFixed(6)),
		south: Number(south.toFixed(6)),
		north: Number(north.toFixed(6)),
	};
}

function createOriginIcon() {
	return L.divIcon({
		className: "terrain-minimap-origin-icon",
		html: `<div class="terrain-minimap-origin-icon__inner"></div>`,
		iconSize: [18, 18],
		iconAnchor: [9, 9],
	});
}

function createCornerIcon() {
	return L.divIcon({
		className: "terrain-minimap-corner-icon",
		html: `<div class="terrain-minimap-corner-icon__inner"></div>`,
		iconSize: [10, 10],
		iconAnchor: [5, 5],
	});
}

function getLeafletBounds(): L.LatLngBounds {
	const b = getImageryBounds();
	return L.latLngBounds(
		[b.south, b.west],
		[b.north, b.east]
	);
}

function emitConfigChange() {
	emit("change");
}

function applyOrigin(lon: number, lat: number, recenterBounds = false) {
	const origin = getOrigin();
	origin.longitude = Number(lon.toFixed(6));
	origin.latitude = Number(lat.toFixed(6));

	if (recenterBounds) {
		const bounds = getImageryBounds();
		const halfLon = Math.max((bounds.east - bounds.west) / 2, 0.0005);
		const halfLat = Math.max((bounds.north - bounds.south) / 2, 0.0005);
		Object.assign(
			bounds,
			normalizeBounds({
				west: lon - halfLon,
				east: lon + halfLon,
				south: lat - halfLat,
				north: lat + halfLat,
			})
		);
	}

	emitConfigChange();
	syncOverlaysFromConfig(false);
}

function applyBoundsFromCorners() {
	if (cornerMarkers.length !== 4) return;

	const lats = cornerMarkers.map(m => m.getLatLng().lat);
	const lngs = cornerMarkers.map(m => m.getLatLng().lng);
	const next = normalizeBounds({
		west: Math.min(...lngs),
		east: Math.max(...lngs),
		south: Math.min(...lats),
		north: Math.max(...lats),
	});

	Object.assign(getImageryBounds(), next);
	emitConfigChange();
	syncOverlaysFromConfig(false);
}

function getViewBounds(): L.LatLngBounds {
	const origin = getOrigin();
	const viewBounds = getLeafletBounds();
	viewBounds.extend([origin.latitude, origin.longitude]);
	// 极小范围时扩大一点，避免 zoom 过高导致看不清
	if (viewBounds.getNorthEast().distanceTo(viewBounds.getSouthWest()) < 80) {
		return viewBounds.pad(2);
	}
	return viewBounds.pad(0.25);
}

function fitOriginAndBounds() {
	if (!map || !mapEl.value) return false;
	if (mapEl.value.clientWidth < 8 || mapEl.value.clientHeight < 8) return false;

	map.invalidateSize({ animate: false });
	map.fitBounds(getViewBounds(), {
		animate: false,
		maxZoom: 17,
		padding: [20, 20],
	});
	initialFitDone = true;
	return true;
}

function scheduleFitView() {
	const attempt = () => {
		fitOriginAndBounds();
	};

	nextTick(() => {
		requestAnimationFrame(() => {
			attempt();
			[50, 150, 320].forEach(delay => {
				const timer = setTimeout(attempt, delay);
				fitTimers.push(timer);
			});
		});
	});
}

function syncOverlaysFromConfig(fitView: boolean) {
	if (!map) return;

	syncingFromConfig = true;
	const origin = getOrigin();
	const bounds = getLeafletBounds();

	if (originMarker) {
		originMarker.setLatLng([origin.latitude, origin.longitude]);
	}

	if (boundsRect) {
		boundsRect.setBounds(bounds);
	}

	const corners: L.LatLngExpression[] = [
		[bounds.getNorth(), bounds.getWest()],
		[bounds.getNorth(), bounds.getEast()],
		[bounds.getSouth(), bounds.getEast()],
		[bounds.getSouth(), bounds.getWest()],
	];

	corners.forEach((latlng, index) => {
		cornerMarkers[index]?.setLatLng(latlng);
	});

	if (fitView) {
		scheduleFitView();
	}

	nextTick(() => {
		syncingFromConfig = false;
	});
}

function initMap() {
	if (!mapEl.value || map) return;

	const origin = getOrigin();
	map = L.map(mapEl.value, {
		center: [origin.latitude, origin.longitude],
		zoom: 14,
		zoomControl: true,
		attributionControl: false,
	});

	L.tileLayer(BASE_TILE_URL, {
		maxZoom: 19,
		crossOrigin: true,
	}).addTo(map);

	boundsRect = L.rectangle(getLeafletBounds(), {
		color: "#4caf50",
		weight: 2,
		fillColor: "#4caf50",
		fillOpacity: 0.12,
		interactive: false,
	}).addTo(map);

	const cornerPositions: L.LatLngExpression[] = [
		[getImageryBounds().north, getImageryBounds().west],
		[getImageryBounds().north, getImageryBounds().east],
		[getImageryBounds().south, getImageryBounds().east],
		[getImageryBounds().south, getImageryBounds().west],
	];

	cornerPositions.forEach((latlng, index) => {
		const marker = L.marker(latlng, {
			draggable: !disabled.value,
			icon: createCornerIcon(),
			zIndexOffset: 500,
		}).addTo(map!);

		marker.on("dragstart", () => {
			interacting = true;
		});
		marker.on("drag", () => {
			if (!boundsRect || cornerMarkers.length !== 4) return;
			const lats = cornerMarkers.map(m => m.getLatLng().lat);
			const lngs = cornerMarkers.map(m => m.getLatLng().lng);
			boundsRect.setBounds(
				L.latLngBounds(
					[Math.min(...lats), Math.min(...lngs)],
					[Math.max(...lats), Math.max(...lngs)]
				)
			);
		});
		marker.on("dragend", () => {
			interacting = false;
			if (disabled.value || syncingFromConfig) return;
			applyBoundsFromCorners();
		});

		cornerMarkers[index] = marker;
	});

	originMarker = L.marker([origin.latitude, origin.longitude], {
		draggable: !disabled.value,
		icon: createOriginIcon(),
		zIndexOffset: 1000,
		title: t("layout.sider.terrain.Origin"),
	}).addTo(map);

	originMarker.on("dragstart", () => {
		interacting = true;
	});
	originMarker.on("dragend", () => {
		interacting = false;
		if (disabled.value || syncingFromConfig || !originMarker) return;
		const { lat, lng } = originMarker.getLatLng();
		applyOrigin(lng, lat, false);
	});

	map.on("click", (event: L.LeafletMouseEvent) => {
		if (disabled.value || syncingFromConfig) return;
		applyOrigin(event.latlng.lng, event.latlng.lat, true);
	});

	map.whenReady(() => {
		scheduleFitView();
	});

	if (mapEl.value && typeof ResizeObserver !== "undefined") {
		resizeObserver = new ResizeObserver(() => {
			if (!map) return;
			map.invalidateSize({ animate: false });
			if (!initialFitDone) {
				fitOriginAndBounds();
			}
		});
		resizeObserver.observe(mapEl.value);
	}

	syncOverlaysFromConfig(true);
}

function destroyMap() {
	fitTimers.forEach(timer => clearTimeout(timer));
	fitTimers.length = 0;
	resizeObserver?.disconnect();
	resizeObserver = null;
	initialFitDone = false;

	if (map) {
		map.remove();
		map = null;
	}
	originMarker = null;
	boundsRect = null;
	cornerMarkers.length = 0;
}

function setOverlayInteractive(enabled: boolean) {
	const dragging = originMarker?.dragging;
	if (dragging) {
		enabled ? dragging.enable() : dragging.disable();
	}
	cornerMarkers.forEach(marker => {
		const cornerDragging = marker.dragging;
		if (!cornerDragging) return;
		enabled ? cornerDragging.enable() : cornerDragging.disable();
	});
}

function fitToMarkers() {
	syncOverlaysFromConfig(false);
	initialFitDone = false;
	scheduleFitView();
}

function refreshCurrentLevel() {
	currentLevel.value = window.viewer?.modules?.terrain?.getCurrentImageryLevel?.() ?? -1;
}

function onConfigChange() {
	if (terrainConfig.value.imagery.lockLevel && currentLevel.value >= 0) {
		terrainConfig.value.imagery.lockedLevel = currentLevel.value;
	}
	emitConfigChange();
}

watch(disabled, isDisabled => {
	setOverlayInteractive(!isDisabled);
});

watch(
	() => [
		terrainConfig.value.imagery?.bounds?.west,
		terrainConfig.value.imagery?.bounds?.east,
		terrainConfig.value.imagery?.bounds?.south,
		terrainConfig.value.imagery?.bounds?.north,
		terrainConfig.value.origin?.longitude,
		terrainConfig.value.origin?.latitude,
	],
	() => {
		if (interacting || syncingFromConfig) return;
		syncOverlaysFromConfig(false);
	}
);

onMounted(() => {
	initMap();
	refreshCurrentLevel();
	levelTimer = setInterval(refreshCurrentLevel, 500);
});

onBeforeUnmount(() => {
	if (levelTimer) clearInterval(levelTimer);
	destroyMap();
});
</script>

<template>
	<div class="terrain-minimap" :class="{ 'is-disabled': disabled }">
		<div class="sidebar-config-item">
			<span>{{ t("layout.sider.terrain.markOrigin") }}</span>
			<n-tooltip>
				<template #trigger>
					<n-icon class="w-auto!">
						<Information />
					</n-icon>
				</template>
				{{ t('layout.sider.terrain.Mini Map Hint') }}
			</n-tooltip>
		</div>
		<div class="relative">
			<div ref="mapEl" class="terrain-minimap__map" />
			<div class="terrain-minimap__toolbar absolute right-1 top-1">
				<n-button size="tiny" quaternary :disabled="disabled" @click="fitToMarkers">
					{{ t("layout.sider.terrain.Fit Mini Map") }}
				</n-button>
			</div>
		</div>
		<div class="sidebar-config-item">
			<span class="w-60%!">{{ t("layout.sider.terrain.Current Level") }}</span>
			<div>
				<n-tag size="small" type="info">
					{{ currentLevel >= 0 ? currentLevel : "-" }}
				</n-tag>
			</div>
		</div>

		<div class="sidebar-config-item">
			<span class="w-60%!">{{ t("layout.sider.terrain.Lock Level") }}</span>
			<div>
				<n-checkbox size="small" v-model:checked="terrainConfig.imagery.lockLevel" :disabled="disabled"
					@update:checked="onConfigChange" />
			</div>
		</div>

		<div class="sidebar-config-item" v-if="terrainConfig.imagery.lockLevel">
			<span>{{ t("layout.sider.terrain.Locked Level") }}</span>
			<div>
				<EsInputNumber v-model:value="terrainConfig.imagery.lockedLevel" :disabled="disabled" size="tiny"
					:show-button="false" :min="terrainConfig.imagery.minZoom" :max="terrainConfig.imagery.maxZoom"
					:decimal="0" @change="onConfigChange" />
			</div>
		</div>

		<div class="sidebar-config-item">
			<span>{{ t("layout.sider.terrain.Tile Padding") }}</span>
			<div>
				<EsInputNumber v-model:value="terrainConfig.imagery.tilePadding" :disabled="disabled" size="tiny"
					:show-button="false" :min="0" :max="8" :decimal="0" @change="onConfigChange" />
			</div>
		</div>
	</div>
</template>

<style scoped lang="less">
.terrain-minimap {
	margin-bottom: 12px;

	&__hint {
		text-align: right;
		line-height: 1.3;
	}

	&__toolbar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 4px;
	}

	&__map {
		width: 100%;
		height: 220px;
		border-radius: 4px;
		border: 1px solid var(--n-border-color);
		overflow: hidden;
		z-index: 0;
		cursor: crosshair;
		margin-bottom: 8px;

		:deep(.leaflet-control-zoom) {
			border: none;
			box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
		}

		:deep(.leaflet-bar a) {
			background: rgba(30, 30, 30, 0.88);
			color: #ddd;
			border-bottom-color: rgba(255, 255, 255, 0.08);
		}

		:deep(.leaflet-bar a:hover) {
			background: rgba(50, 50, 50, 0.95);
			color: #fff;
		}
	}

	&.is-disabled &__map {
		opacity: 0.55;
		pointer-events: none;
	}
}
</style>

<style lang="less">
.terrain-minimap-origin-icon {
	background: transparent !important;
	border: none !important;

	&__inner {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #ff4444;
		border: 2px solid #fff;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
		position: relative;

		&::before,
		&::after {
			content: "";
			position: absolute;
			background: #fff;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
		}

		&::before {
			width: 10px;
			height: 2px;
		}

		&::after {
			width: 2px;
			height: 10px;
		}
	}
}

.terrain-minimap-corner-icon {
	background: transparent !important;
	border: none !important;

	&__inner {
		width: 10px;
		height: 10px;
		background: #4caf50;
		border: 2px solid #fff;
		border-radius: 2px;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
		cursor: nwse-resize;
	}
}
</style>
