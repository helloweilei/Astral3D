<script setup lang="ts">
import { computed } from "vue";
import { t } from "@/language";
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let terrainConfig = defineModel<IAppProject.Terrain>({ required: true });
const emit = defineEmits<{ change: [] }>();

const disabled = computed(() => !terrainConfig.value.enabled);

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

/** 原点经纬度变更时，保持原范围大小并将边界居中到新原点 */
function syncBoundsToOrigin() {
	const origin = terrainConfig.value.origin;
	const bounds = terrainConfig.value.imagery.bounds;
	if (!origin || !bounds) return;

	const halfLon = Math.max((bounds.east - bounds.west) / 2, 0.0005);
	const halfLat = Math.max((bounds.north - bounds.south) / 2, 0.0005);

	Object.assign(
		bounds,
		normalizeBounds({
			west: origin.longitude - halfLon,
			east: origin.longitude + halfLon,
			south: origin.latitude - halfLat,
			north: origin.latitude + halfLat,
		})
	);
}

function onOriginLonLatChange() {
	syncBoundsToOrigin();
	emit("change");
}

function onChange() {
	emit("change");
}
</script>

<template>
	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Longitude") }}</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.origin.longitude"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:min="-180"
				:max="180"
				:decimal="6"
				@change="onOriginLonLatChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Latitude") }}</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.origin.latitude"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:min="-90"
				:max="90"
				:decimal="6"
				@change="onOriginLonLatChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Height") }}</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.origin.height"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>
</template>

<style scoped lang="less"></style>
