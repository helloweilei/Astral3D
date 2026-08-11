<script setup lang="ts">
import { CaretForwardOutline } from "@vicons/ionicons5";
import { t } from "@/language";
import Fog from "./weather/Sidebar.Weather.Fog.vue";
import Rain from "./weather/Sidebar.Weather.Rain.vue";
import Snow from "./weather/Sidebar.Weather.Snow.vue";
import Lightning from "./weather/Sidebar.Weather.Lightning.vue";
import Clouds from "./weather/Sidebar.Weather.Clouds.vue";

</script>

<template>
    <n-collapse display-directive="show" :default-expanded-names="['fog', 'rain', 'snow', 'lightning', 'clouds']">
        <template #arrow>
            <n-icon>
                <CaretForwardOutline />
            </n-icon>
        </template>

        <!--  fog  -->
        <n-collapse-item :title="t('layout.sider.weather.Fog')" name="fog">
            <Fog />
        </n-collapse-item>

        <!--  Rain  -->
        <n-collapse-item :title="t('layout.sider.weather.Rain')" name="rain">
            <Rain />
        </n-collapse-item>

        <!--  Snow  -->
        <n-collapse-item :title="t('layout.sider.weather.Snow')" name="snow">
            <Snow />
        </n-collapse-item>

        <!--  lightning  -->
        <n-collapse-item :title="t('layout.sider.weather.Lightning')" name="lightning">
            <Lightning />
        </n-collapse-item>

        <!--  clouds  -->
        <n-collapse-item :title="t('layout.sider.weather.Clouds')" name="clouds">
            <Clouds />
        </n-collapse-item>
    </n-collapse>
</template>

<style lang="less"></style>