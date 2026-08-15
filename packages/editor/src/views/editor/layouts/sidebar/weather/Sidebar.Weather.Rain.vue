<script setup lang="ts">
import {computed, onMounted, reactive, toRaw} from "vue";
import {t} from "@/language";
import {App,Utils} from "@astral3d/engine";
import { useWeatherConfigSync } from "./useWeatherConfigSync";

const rainConfig = reactive(JSON.parse(JSON.stringify(App.project.getKey("weather.rain"))));

useWeatherConfigSync("weather.rain", rainConfig, "sceneRainSettingsChanged");

const disabled = computed(() => !rainConfig.enabled);

onMounted(() => {
  const viewerLoaded = () => {
    Utils.deepAssign(rainConfig, App.project.getKey("weather.rain"));

    window.viewer.removeEventListener('loaded', viewerLoaded);
  }
  window.viewer.addEventListener('loaded', viewerLoaded);
})


function handleRainSettingsChanged() {
  App.project.setKey("weather.rain",toRaw(rainConfig));
}
</script>

<template>
  <div class="sidebar-config-item">
    <span>{{ t(`other.Enable`) }}</span>
    <div>
      <n-checkbox size="small" v-model:checked="rainConfig.enabled"
                  @update:checked="handleRainSettingsChanged"/>
    </div>
  </div>

  <!-- Rain Speed -->
  <div class="sidebar-config-item">
    <span>{{ t(`layout.sider.weather.Speed`) }}</span>
    <div>
      <EsInputNumber v-model:value="rainConfig.speed" :disabled="disabled" size="tiny"
                     :show-button="false" :min="0" :max="10" :decimal="1" @change="handleRainSettingsChanged"/>
    </div>
  </div>

  <!-- Rain Color -->
  <div class="sidebar-config-item">
    <span>{{ t(`layout.sider.weather.Color`) }}</span>
    <div>
      <n-color-picker v-model:value="rainConfig.color" :disabled="disabled"
                      :show-alpha="false" :modes="['hex']" size="small" @update:value="handleRainSettingsChanged"
                      :render-label="() => ''"/>
    </div>
  </div>

  <!-- Rain Size -->
  <div class="sidebar-config-item">
    <span>{{ t(`layout.sider.weather.Size`) }}</span>
    <div>
      <EsInputNumber v-model:value="rainConfig.size" :disabled="disabled" size="tiny"
                     :show-button="false" :min="0" :max="1" :decimal="2" @change="handleRainSettingsChanged"/>
    </div>
  </div>

  <!-- Rain Radian -->
  <div class="sidebar-config-item">
    <span>{{ t(`layout.sider.weather.Radian`) }}</span>
    <div>
      <EsInputNumber v-model:value="rainConfig.radian" :disabled="disabled" size="tiny"
                     :show-button="false" :min="0" :max="360" :decimal="0" @change="handleRainSettingsChanged"/>
    </div>
  </div>

  <!-- Rain Alpha -->
  <div class="sidebar-config-item">
    <span>{{ t(`layout.sider.weather.Alpha`) }}</span>
    <div>
      <EsInputNumber v-model:value="rainConfig.alpha" :disabled="disabled" size="tiny"
                     :show-button="false" :min="0" :max="1" :decimal="1" @change="handleRainSettingsChanged"/>
    </div>
  </div>
</template>

<style scoped lang="less"></style>