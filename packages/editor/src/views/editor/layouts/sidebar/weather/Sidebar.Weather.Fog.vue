<script setup lang="ts">
import {computed, onMounted, reactive, toRaw} from "vue";
import {t} from "@/language";
import {App,Utils} from "@astral3d/engine";
import { useWeatherConfigSync } from "./useWeatherConfigSync";

const fogConfig = reactive(JSON.parse(JSON.stringify(App.project.getKey("weather.fog"))));

useWeatherConfigSync("weather.fog", fogConfig, "sceneFogSettingsChanged");

const disabled = computed(() => !fogConfig.enabled);
const fogType = computed(() => fogConfig.type);

onMounted(() => {
  const viewerLoaded = () => {
    Utils.deepAssign(fogConfig, App.project.getKey("weather.fog"));

    window.viewer.removeEventListener('loaded', viewerLoaded);
  }
  window.viewer.addEventListener('loaded', viewerLoaded);
})

function handleFogSettingsChanged() {
  App.project.setKey("weather.fog",toRaw(fogConfig));
}
</script>

<template>
  <div class="sidebar-config-item">
    <span>{{ t(`other.Enable`) }}</span>
    <div>
      <n-checkbox size="small" v-model:checked="fogConfig.enabled"
                  @update:checked="handleFogSettingsChanged"/>
    </div>
  </div>

  <!-- Fog Type -->
  <div class="sidebar-config-item">
    <span>{{ t(`layout.sider.weather.Type`) }}</span>
    <div>
      <n-radio-group v-model:value="fogConfig.type" :disabled="disabled" name="fogType"
                     @update:value="handleFogSettingsChanged">
        <n-radio value="Fog">Linear</n-radio>
        <n-radio value="FogExp2">Exponential</n-radio>
      </n-radio-group>
    </div>
  </div>

  <!-- Fog Color -->
  <div class="sidebar-config-item">
    <span>{{ t(`layout.sider.weather.Color`) }}</span>
    <div>
      <n-color-picker v-model:value="fogConfig.color" :disabled="disabled"
                      :show-alpha="false" :modes="['hex']" size="small" @update:value="handleFogSettingsChanged"
                      :render-label="() => ''"/>
    </div>
  </div>

  <!-- Fog Near -->
  <div class="sidebar-config-item" v-if="fogType === 'Fog'">
    <span>{{ t(`layout.sider.weather.Near`) }}</span>
    <div>
      <EsInputNumber v-model:value="fogConfig.near" :disabled="disabled" size="tiny"
                     :show-button="false" :min="0" :max="Infinity" :decimal="2" @change="handleFogSettingsChanged"/>
    </div>
  </div>

  <!-- Fog Far -->
  <div class="sidebar-config-item" v-if="fogType === 'Fog'">
    <span>{{ t(`layout.sider.weather.Far`) }}</span>
    <div>
      <EsInputNumber v-model:value="fogConfig.far" :disabled="disabled" size="tiny"
                     :show-button="false" :min="0" :max="Infinity" :decimal="2" @change="handleFogSettingsChanged"/>
    </div>
  </div>

  <!-- Fog Density -->
  <div class="sidebar-config-item" v-if="fogType === 'FogExp2'">
    <span>{{ t(`layout.sider.weather.Density`) }}</span>
    <div>
      <EsInputNumber v-model:value="fogConfig.density" :disabled="disabled" size="tiny"
                     :show-button="false" :min="0" :max="0.1" :decimal="3" @change="handleFogSettingsChanged"/>
    </div>
  </div>
</template>

<style scoped lang="less"></style>