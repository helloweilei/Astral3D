<script setup lang="ts">
import { CaretForwardOutline } from "@vicons/ionicons5";
import { t } from "@/language";
import { App, Utils, Hooks } from "@astral3d/engine";
import { onBeforeUnmount, onMounted, reactive, toRaw } from "vue";
import Origin from "./terrain/Sidebar.Terrain.Origin.vue";
import MiniMap from "./terrain/Sidebar.Terrain.MiniMap.vue";
import Imagery from "./terrain/Sidebar.Terrain.Imagery.vue";
import Tiles3D from "./terrain/Sidebar.Terrain.Tiles3D.vue";

const terrainConfig = reactive(
	JSON.parse(JSON.stringify(App.project.getKey("terrain")))
);
ensureTerrainDefaults(terrainConfig);

function syncTerrainConfig() {
	Utils.deepAssign(terrainConfig, App.project.getKey("terrain"));
	ensureTerrainDefaults(terrainConfig);
}

function ensureTerrainDefaults(config: IAppProject.Terrain) {
	if (!config.origin) {
		config.origin = { longitude: 116.391, latitude: 39.907, height: 0 };
	}
	if (!config.imagery) {
		config.imagery = App.project.getKey("terrain.imagery");
	}
	if (!config.imagery.bounds) {
		config.imagery.bounds = { west: 116.38, south: 39.9, east: 116.4, north: 39.92 };
	}
	if (config.imagery.lockLevel === undefined) config.imagery.lockLevel = false;
	if (config.imagery.minZoom === undefined) config.imagery.minZoom = 10;
	if (config.imagery.maxZoom === undefined) config.imagery.maxZoom = 18;
	if (config.imagery.lockedLevel === undefined) {
		config.imagery.lockedLevel = Utils.estimateZoomFromBounds(
			config.imagery.bounds,
			config.imagery.minZoom,
			config.imagery.maxZoom
		);
	} else {
		const suggested = Utils.estimateZoomFromBounds(
			config.imagery.bounds,
			config.imagery.minZoom,
			config.imagery.maxZoom
		);
		if (config.imagery.lockedLevel > suggested) {
			config.imagery.lockedLevel = suggested;
		}
	}
	if (config.imagery.tilePadding === undefined) config.imagery.tilePadding = 2;
	if (config.imagery.fixedBounds === undefined) config.imagery.fixedBounds = false;
	if (config.imagery.provider === "osm" || config.imagery.provider === "custom") {
		config.imagery.url = Utils.resolveImageryUrlForProvider(
			config.imagery.provider,
			config.imagery.url
		);
	}
}

function handleViewerLoaded() {
	syncTerrainConfig();
}

function bindViewerEvents(viewer: typeof window.viewer) {
	syncTerrainConfig();
	viewer.addEventListener("loaded", handleViewerLoaded);
}

function handleViewerInit(viewer: typeof window.viewer) {
	bindViewerEvents(viewer);
}

onMounted(() => {
	if (window.viewer) {
		bindViewerEvents(window.viewer);
	} else {
		Hooks.useAddOnceSignal("viewerInitCompleted", handleViewerInit);
	}
});

onBeforeUnmount(() => {
	window.viewer?.removeEventListener("loaded", handleViewerLoaded);
});

function handleChange() {
	App.project.setKey("terrain", toRaw(terrainConfig));
}

function flyToRegion() {
	window.viewer?.modules?.terrain?.flyToRegion();
}
</script>

<template>
	<div class="sidebar-terrain">
	<div class="sidebar-config-item">
		<span>{{ t("other.Enable") }}</span>
		<div>
			<n-checkbox
				size="small"
				v-model:checked="terrainConfig.enabled"
				@update:checked="handleChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Hide Grid") }}</span>
		<div>
			<n-checkbox
				size="small"
				v-model:checked="terrainConfig.hideGrid"
				:disabled="!terrainConfig.enabled"
				@update:checked="handleChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Fly To Region") }}</span>
		<div>
			<n-button size="tiny" :disabled="!terrainConfig.enabled" @click="flyToRegion">
				{{ t("layout.sider.terrain.Fly") }}
			</n-button>
		</div>
	</div>

	<MiniMap v-model="terrainConfig" @change="handleChange" />

	<n-collapse display-directive="show" :default-expanded-names="['origin', 'imagery', 'tiles3d']">
		<template #arrow>
			<n-icon>
				<CaretForwardOutline />
			</n-icon>
		</template>

		<n-collapse-item :title="t('layout.sider.terrain.Origin')" name="origin">
			<Origin v-model="terrainConfig" @change="handleChange" />
		</n-collapse-item>

		<n-collapse-item :title="t('layout.sider.terrain.Imagery')" name="imagery">
			<Imagery v-model="terrainConfig" @change="handleChange" />
		</n-collapse-item>

		<n-collapse-item :title="t('layout.sider.terrain.Tiles3D')" name="tiles3d">
			<Tiles3D v-model="terrainConfig" @change="handleChange" />
		</n-collapse-item>
	</n-collapse>
	</div>
</template>

<style scoped lang="less">
.sidebar-terrain {
	width: 100%;
}
</style>
