<script setup lang="ts">
import {computed, onMounted, reactive, toRaw} from "vue";
import { t } from "@/language";
import {App,Utils} from "@astral3d/engine";
import { useWeatherConfigSync } from "./useWeatherConfigSync";

const snowConfig = reactive(JSON.parse(JSON.stringify(App.project.getKey("weather.snow"))));

useWeatherConfigSync("weather.snow", snowConfig, "sceneSnowSettingsChanged");

const disabled = computed(() => !snowConfig.enabled);

onMounted(() => {
  const viewerLoaded = () => {
    Utils.deepAssign(snowConfig, App.project.getKey("weather.snow"));

    window.viewer.removeEventListener('loaded', viewerLoaded);
  }
  window.viewer.addEventListener('loaded', viewerLoaded);
})

function handleSnowSettingsChanged() {
  App.project.setKey("weather.snow",toRaw(snowConfig));
}
</script>

<template>
    <div class="sidebar-config-item">
        <span>{{ t(`other.Enable`) }}</span>
        <div>
            <n-checkbox size="small" v-model:checked="snowConfig.enabled"
                @update:checked="handleSnowSettingsChanged" />
        </div>
    </div>

    <!-- Snow Speed -->
    <div class="sidebar-config-item">
        <span>{{ t(`layout.sider.weather.Speed`) }}</span>
        <div>
            <EsInputNumber v-model:value="snowConfig.speed" :disabled="disabled" size="tiny"
                :show-button="false" :min="0" :max="10" :decimal="1" @change="handleSnowSettingsChanged" />
        </div>
    </div>

    <!-- Snow Density -->
    <div class="sidebar-config-item">
        <span>{{ t(`layout.sider.weather.Density`) }}</span>
        <div>
            <EsInputNumber v-model:value="snowConfig.density" :disabled="disabled" size="tiny"
                :show-button="false" :min="0" :max="10" :decimal="1" @change="handleSnowSettingsChanged" />
        </div>
    </div>

    <!-- Snow Size -->
    <div class="sidebar-config-item">
        <span>{{ t(`layout.sider.weather.Size`) }}</span>
        <div>
            <EsInputNumber v-model:value="snowConfig.size" :disabled="disabled" size="tiny"
                :show-button="false" :min="0" :max="1" :decimal="2" @change="handleSnowSettingsChanged" />
        </div>
    </div>

    <!-- Snow Alpha -->
    <div class="sidebar-config-item">
        <span>{{ t(`layout.sider.weather.Alpha`) }}</span>
        <div>
            <EsInputNumber v-model:value="snowConfig.alpha" :disabled="disabled" size="tiny"
                :show-button="false" :min="0" :max="1" :decimal="1" @change="handleSnowSettingsChanged" />
        </div>
    </div>

    <!-- Snow Accumulation TODO:20250519:雪堆积效果错误，待修改 -->
<!--    <div class="sidebar-config-item">-->
<!--        <span>{{ t(`layout.sider.weather.Accumulation`) }}</span>-->
<!--        <div>-->
<!--            <n-checkbox size="small" :disabled="disabled" v-model:checked="snowConfig.accumulation"-->
<!--                @update:checked="handleSnowSettingsChanged" />-->
<!--        </div>-->
<!--    </div>-->
</template>

<style scoped lang="less"></style>