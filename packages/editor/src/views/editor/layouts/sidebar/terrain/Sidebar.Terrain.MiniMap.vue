<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { t } from "@/language";
import { Utils } from "@astral3d/engine";
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let terrainConfig = defineModel<IAppProject.Terrain>({ required: true });
const emit = defineEmits<{ change: [] }>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const currentLevel = ref(-1);
let levelTimer: ReturnType<typeof setInterval> | null = null;

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

function getImageryBounds() {
	return terrainConfig.value.imagery?.bounds ?? DEFAULT_BOUNDS;
}

function getOrigin() {
	return terrainConfig.value.origin ?? DEFAULT_ORIGIN;
}

const mapBounds = computed(() => {
	const bounds = getImageryBounds();
	const origin = getOrigin();
	const lonSpan = Math.max(bounds.east - bounds.west, 0.001);
	const latSpan = Math.max(bounds.north - bounds.south, 0.001);
	const margin = Math.max(lonSpan, latSpan) * 0.15;

	return {
		west: bounds.west - margin,
		east: bounds.east + margin,
		south: bounds.south - margin,
		north: bounds.north + margin,
		originLon: origin.longitude,
		originLat: origin.latitude,
	};
});

function lonLatToCanvas(lon: number, lat: number, width: number, height: number) {
	const b = mapBounds.value;
	const x = ((lon - b.west) / (b.east - b.west)) * width;
	const y = ((b.north - lat) / (b.north - b.south)) * height;
	return { x, y };
}

function canvasToLonLat(x: number, y: number, width: number, height: number) {
	const b = mapBounds.value;
	const lon = b.west + (x / width) * (b.east - b.west);
	const lat = b.north - (y / height) * (b.north - b.south);
	return { lon, lat };
}

function drawMiniMap() {
	const canvas = canvasRef.value;
	if (!canvas) return;

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const width = canvas.width;
	const height = canvas.height;
	const b = mapBounds.value;
	const bounds = getImageryBounds();
	const origin = getOrigin();
	const imagery = terrainConfig.value.imagery;

	ctx.fillStyle = "#1a2332";
	ctx.fillRect(0, 0, width, height);

	const previewZoom = Math.max(
		8,
		Math.min(14, Math.round(Math.log2(360 / Math.max(b.east - b.west, 0.001)) - 1))
	);
	const minTileX = Math.floor(((b.west + 180) / 360) * Math.pow(2, previewZoom));
	const maxTileX = Math.floor(((b.east + 180) / 360) * Math.pow(2, previewZoom));
	const minTileY = Math.floor(
		((1 - Math.log(Math.tan((b.north * Math.PI) / 180) + 1 / Math.cos((b.north * Math.PI) / 180)) / Math.PI) / 2) *
		Math.pow(2, previewZoom)
	);
	const maxTileY = Math.floor(
		((1 - Math.log(Math.tan((b.south * Math.PI) / 180) + 1 / Math.cos((b.south * Math.PI) / 180)) / Math.PI) / 2) *
		Math.pow(2, previewZoom)
	);

	for (let tx = minTileX; tx <= maxTileX; tx++) {
		for (let ty = minTileY; ty <= maxTileY; ty++) {
			const n = Math.pow(2, previewZoom);
			const west = (tx / n) * 360 - 180;
			const east = ((tx + 1) / n) * 360 - 180;
			const northRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
			const southRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty + 1)) / n)));
			const north = (northRad * 180) / Math.PI;
			const south = (southRad * 180) / Math.PI;

			const topLeft = lonLatToCanvas(west, north, width, height);
			const bottomRight = lonLatToCanvas(east, south, width, height);
			const tileW = bottomRight.x - topLeft.x;
			const tileH = bottomRight.y - topLeft.y;

			const url = Utils.buildImageryTileUrl(
				imagery?.provider ?? "osm",
				previewZoom,
				tx,
				ty,
				{ url: imagery?.url, token: imagery?.token }
			);

			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				ctx.drawImage(img, topLeft.x, topLeft.y, tileW, tileH);
			};
			img.src = url;
		}
	}

	const boundsTL = lonLatToCanvas(bounds.west, bounds.north, width, height);
	const boundsBR = lonLatToCanvas(bounds.east, bounds.south, width, height);
	ctx.strokeStyle = "#4caf50";
	ctx.lineWidth = 2;
	ctx.strokeRect(boundsTL.x, boundsTL.y, boundsBR.x - boundsTL.x, boundsBR.y - boundsTL.y);

	const originPos = lonLatToCanvas(origin.longitude, origin.latitude, width, height);
	ctx.fillStyle = "#ff4444";
	ctx.beginPath();
	ctx.arc(originPos.x, originPos.y, 5, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.moveTo(originPos.x - 8, originPos.y);
	ctx.lineTo(originPos.x + 8, originPos.y);
	ctx.moveTo(originPos.x, originPos.y - 8);
	ctx.lineTo(originPos.x, originPos.y + 8);
	ctx.stroke();
}

function handleCanvasClick(event: MouseEvent) {
	if (disabled.value) return;

	const canvas = canvasRef.value;
	if (!canvas) return;

	const rect = canvas.getBoundingClientRect();
	const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
	const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
	const { lon, lat } = canvasToLonLat(x, y, canvas.width, canvas.height);

	terrainConfig.value.origin.longitude = Number(lon.toFixed(6));
	terrainConfig.value.origin.latitude = Number(lat.toFixed(6));
	emit("change");
	drawMiniMap();
}

function refreshCurrentLevel() {
	currentLevel.value = window.viewer?.modules?.terrain?.getCurrentImageryLevel?.() ?? -1;
}

function onConfigChange() {
	if (terrainConfig.value.imagery.lockLevel && currentLevel.value >= 0) {
		terrainConfig.value.imagery.lockedLevel = currentLevel.value;
	}
	emit("change");
	requestAnimationFrame(() => drawMiniMap());
}

watch(
	() => [
		terrainConfig.value.imagery?.bounds,
		terrainConfig.value.imagery?.provider,
		terrainConfig.value.origin?.longitude,
		terrainConfig.value.origin?.latitude,
	],
	() => drawMiniMap(),
	{ deep: true }
);

onMounted(() => {
	drawMiniMap();
	refreshCurrentLevel();
	levelTimer = setInterval(refreshCurrentLevel, 500);
});

onBeforeUnmount(() => {
	if (levelTimer) clearInterval(levelTimer);
});
</script>

<template>
	<div class="terrain-minimap">
		<div class="sidebar-config-item">
			<span>{{ t("layout.sider.terrain.Mini Map") }}</span>
			<div class="text-xs text-gray-400">{{ t("layout.sider.terrain.Click To Set Origin") }}</div>
		</div>

		<canvas ref="canvasRef" class="terrain-minimap__canvas mb-2" width="280" height="180"
			:class="{ 'is-disabled': disabled }" @click="handleCanvasClick" />

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

	&__canvas {
		width: 100%;
		height: 180px;
		border-radius: 4px;
		border: 1px solid var(--n-border-color);
		cursor: crosshair;
		display: block;

		&.is-disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
}
</style>
