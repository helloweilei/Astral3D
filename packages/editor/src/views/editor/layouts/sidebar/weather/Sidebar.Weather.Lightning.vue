<script setup lang="ts">
import { computed, onMounted, reactive, toRaw } from "vue";
import { t } from "@/language";
import { App, Utils } from "@astral3d/engine";

const lightningConfig = reactive(JSON.parse(JSON.stringify(App.project.getKey("weather.lightning"))));
const disabled = computed(() => !lightningConfig.enabled);

onMounted(() => {
    const viewerLoaded = () => {
        Utils.deepAssign(lightningConfig, App.project.getKey("weather.lightning"));

        window.viewer.removeEventListener('loaded', viewerLoaded);
    }
    window.viewer.addEventListener('loaded', viewerLoaded);
})

function handleLightningSettingsChanged() {
    App.project.setKey("weather.lightning", toRaw(lightningConfig));
}
</script>

<template>
    <div class="sidebar-config-item">
        <span>{{ t(`other.Enable`) }}</span>
        <div>
            <n-checkbox size="small" v-model:checked="lightningConfig.enabled"
                @update:checked="handleLightningSettingsChanged" />
        </div>
    </div>

    <!-- Lightning Speed -->
    <div class="sidebar-config-item">
        <span>{{ t(`layout.sider.weather.Speed`) }}</span>
        <div>
            <EsInputNumber v-model:value="lightningConfig.speed" :disabled="disabled" size="tiny" :show-button="false"
                :min="0" :max="10" :decimal="1" @change="handleLightningSettingsChanged" />
        </div>
    </div>

    <!-- Lightning Density -->
    <div class="sidebar-config-item">
        <span>{{ t(`layout.sider.weather.Density`) }}</span>
        <div>
            <EsInputNumber v-model:value="lightningConfig.density" :disabled="disabled" size="tiny" :show-button="false"
                :min="0" :max="10" :decimal="1" @change="handleLightningSettingsChanged" />
        </div>
    </div>

    <!-- Lightning Size -->
    <div class="sidebar-config-item">
        <span>{{ t(`layout.sider.weather.Size`) }}</span>
        <div>
            <EsInputNumber v-model:value="lightningConfig.size" :disabled="disabled" size="tiny" :show-button="false"
                :min="0" :max="1" :decimal="2" @change="handleLightningSettingsChanged" />
        </div>
    </div>

    <!-- Lightning Alpha -->
    <div class="sidebar-config-item">
        <span>{{ t(`layout.sider.weather.Alpha`) }}</span>
        <div>
            <EsInputNumber v-model:value="lightningConfig.alpha" :disabled="disabled" size="tiny" :show-button="false"
                :min="0" :max="1" :decimal="1" @change="handleLightningSettingsChanged" />
        </div>
    </div>

    <!-- Snow Accumulation TODO:20250519:雪堆积效果错误，待修改 -->
    <!--    <div class="sidebar-config-item">-->
    <!--        <span>{{ t(`layout.sider.weather.Accumulation`) }}</span>-->
    <!--        <div>-->
    <!--            <n-checkbox size="small" :disabled="disabled" v-model:checked="snowConfig.accumulation"-->
    <!--                @update:checked="handleLightningSettingsChanged" />-->
    <!--        </div>-->
    <!--    </div>-->
</template>

<style scoped lang="less"></style>