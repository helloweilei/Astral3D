<script setup lang="ts">
import { computed, onMounted, reactive, toRaw } from "vue";
import { t } from "@/language";
import { App, Utils, defaultWeatherClouds } from "@astral3d/engine";
import EsInputNumber from "@/components/es/EsInputNumber.vue";
import { useWeatherConfigSync } from "./useWeatherConfigSync";

const cloudsConfig = reactive(
	JSON.parse(JSON.stringify(App.project.getKey("weather.clouds") ?? defaultWeatherClouds()))
);

useWeatherConfigSync("weather.clouds", cloudsConfig, "sceneCloudSettingsChanged");

const disabled = computed(() => !cloudsConfig.enabled);

onMounted(() => {
	const viewerLoaded = () => {
		Utils.deepAssign(cloudsConfig, App.project.getKey("weather.clouds") ?? defaultWeatherClouds());
		window.viewer.removeEventListener("loaded", viewerLoaded);
	};
	window.viewer?.addEventListener("loaded", viewerLoaded);
});

function handleCloudsSettingsChanged() {
	App.project.setKey("weather.clouds", toRaw(cloudsConfig));
}
</script>

<template>
	<div class="sidebar-config-item">
		<span>{{ t("other.Enable") }}</span>
		<div>
			<n-checkbox size="small" v-model:checked="cloudsConfig.enabled"
				@update:checked="handleCloudsSettingsChanged" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.weather.Color") }}</span>
		<div>
			<n-color-picker v-model:value="cloudsConfig.color" :disabled="disabled" :show-alpha="false" :modes="['hex']"
				size="small" :render-label="() => ''" @update:value="handleCloudsSettingsChanged" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.weather.Thickness") }}</span>
		<div>
			<EsInputNumber v-model:value="cloudsConfig.thickness" :disabled="disabled" size="tiny" :show-button="false"
				:min="0" :max="1" :decimal="2" @change="handleCloudsSettingsChanged" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.weather.Height") }}</span>
		<div>
			<EsInputNumber v-model:value="cloudsConfig.height" :disabled="disabled" size="tiny" :show-button="false"
				:min="-1000" :max="500000" :decimal="0" @change="handleCloudsSettingsChanged" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.weather.Speed") }}</span>
		<div>
			<EsInputNumber v-model:value="cloudsConfig.speed" :disabled="disabled" size="tiny" :show-button="false"
				:min="0" :max="10" :decimal="2" @change="handleCloudsSettingsChanged" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.weather.Density") }}</span>
		<div>
			<EsInputNumber v-model:value="cloudsConfig.density" :disabled="disabled" size="tiny" :show-button="false"
				:min="0" :max="1" :decimal="2" @change="handleCloudsSettingsChanged" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.weather.Alpha") }}</span>
		<div>
			<EsInputNumber v-model:value="cloudsConfig.alpha" :disabled="disabled" size="tiny" :show-button="false"
				:min="0" :max="1" :decimal="2" @change="handleCloudsSettingsChanged" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.weather.Scale") }}</span>
		<div>
			<EsInputNumber v-model:value="cloudsConfig.scale" :disabled="disabled" size="tiny" :show-button="false"
				:min="0.1" :max="10" :decimal="1" @change="handleCloudsSettingsChanged" />
		</div>
	</div>
</template>
