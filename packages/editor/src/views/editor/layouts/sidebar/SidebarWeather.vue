<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { CaretForwardOutline } from "@vicons/ionicons5";
import { App, Hooks } from "@astral3d/engine";
import { t } from "@/language";
import Fog from "./weather/Sidebar.Weather.Fog.vue";
import Rain from "./weather/Sidebar.Weather.Rain.vue";
import Snow from "./weather/Sidebar.Weather.Snow.vue";
import Lightning from "./weather/Sidebar.Weather.Lightning.vue";
import Clouds from "./weather/Sidebar.Weather.Clouds.vue";
import { ensureWeatherRealtimeDefaults } from "@/utils/weather/realtimeWeather";

const realtimeEnabled = ref(false);

function syncRealtime() {
	ensureWeatherRealtimeDefaults();
	realtimeEnabled.value = !!App.project.getKey("weather.realtime.enabled");
}

function handleRealtimeToggle(value: boolean) {
	ensureWeatherRealtimeDefaults();
	App.project.setKey("weather.realtime", { enabled: value });
}

onMounted(() => {
	syncRealtime();
	Hooks.useAddSignal("sceneWeatherRealtimeChanged", syncRealtime);
	Hooks.useAddSignal("sceneCleared", syncRealtime);
});

onBeforeUnmount(() => {
	Hooks.useRemoveSignal("sceneWeatherRealtimeChanged", syncRealtime);
	Hooks.useRemoveSignal("sceneCleared", syncRealtime);
});
</script>

<template>
	<div class="sidebar-config-item mb-8px">
		<span>{{ t("layout.sider.weather.Realtime") }}</span>
		<div>
			<n-switch size="small" :value="realtimeEnabled" @update:value="handleRealtimeToggle" />
		</div>
	</div>

	<n-collapse display-directive="show" :default-expanded-names="['fog', 'rain', 'snow', 'lightning', 'clouds']">
		<template #arrow>
			<n-icon>
				<CaretForwardOutline />
			</n-icon>
		</template>

		<n-collapse-item :title="t('layout.sider.weather.Fog')" name="fog">
			<Fog />
		</n-collapse-item>

		<n-collapse-item :title="t('layout.sider.weather.Rain')" name="rain">
			<Rain />
		</n-collapse-item>

		<n-collapse-item :title="t('layout.sider.weather.Snow')" name="snow">
			<Snow />
		</n-collapse-item>

		<n-collapse-item :title="t('layout.sider.weather.Lightning')" name="lightning">
			<Lightning />
		</n-collapse-item>

		<n-collapse-item :title="t('layout.sider.weather.Clouds')" name="clouds">
			<Clouds />
		</n-collapse-item>
	</n-collapse>
</template>
