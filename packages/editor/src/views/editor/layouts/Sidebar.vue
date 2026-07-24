<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, markRaw, nextTick } from "vue";
import type { TabsInst } from "naive-ui";
import {
  EarthFilled,
  Cube,
  GroupObjects,
  Image,
  ResultOld,
  Script,
  Draw,
  MagicWandFilled,
  CloudSnow,
  HeatMap,
  Opacity,
  ImageReference,
  LocationHeart,
  LocationCompany,
  Globe,
} from "@vicons/carbon";

import { Utils, Hooks } from "@astral3d/engine";
import SidebarScene from "./sidebar/SidebarScene.vue";
import SidebarRenderer from "./sidebar/SidebarRenderer.vue";
import SidebarEffect from "./sidebar/SidebarEffect.vue";
import SidebarWeather from "./sidebar/SidebarWeather.vue";
import SidebarTerrain from "./sidebar/SidebarTerrain.vue";
import SidebarHistory from "./sidebar/SidebarHistory.vue";
import SidebarObject from "./sidebar/SidebarObject.vue";
import SidebarGeometry from "./sidebar/SidebarGeometry.vue";
import SidebarMaterial from "./sidebar/SidebarMaterial.vue";
import SidebarAnimations from "./sidebar/SidebarAnimations.vue";
import SidebarScript from "./sidebar/SidebarScript.vue";
import SidebarDrawing from "./sidebar/SidebarDrawing.vue";
import SidebarParticle from "./sidebar/SidebarParticle.vue";
import SidebarBillboard from "./sidebar/SidebarBillboard.vue";
import SidebarHtmlPanel from "./sidebar/SidebarHtmlPanel.vue";
import SidebarTabIcon from "./sidebar/SidebarTabIcon.vue";

const tabsInstRef = ref<TabsInst | null>(null);
const tabs = ref<Array<any>>([]);
const current = ref<string>("scene");

function setTabs(object) {
  const sceneTabs = [
      { name: "scene", icon: { text: 'Scene config',color:"#A9A9A9", component: markRaw(EarthFilled) }, component: markRaw(SidebarScene) },
      { name: "terrain", icon: { text: 'Terrain config', color: "#4CAF50", component: markRaw(Globe) }, component: markRaw(SidebarTerrain) },
      { name: "renderer", icon: { text: 'Renderer config',color:"#A9A9A9", component: markRaw(ImageReference) }, component: markRaw(SidebarRenderer) },
      { name: "effect", icon: { text: 'Post processing',color:"#A9A9A9", component: markRaw(MagicWandFilled) }, component: markRaw(SidebarEffect) },
      { name: "weather", icon: { text: 'Weather',color:"#A9A9A9", component: markRaw(CloudSnow) }, component: markRaw(SidebarWeather) },
      { name: "history", icon: { text: 'History',color:"#A9A9A9", component: markRaw(ResultOld) }, component: markRaw(SidebarHistory) },
      { name: "drawing", icon: { text: 'Scene drawing',color:"#A9A9A9", component: markRaw(Image) }, component: markRaw(SidebarDrawing) },
  ];
  const object3DTabs = [
      { name: "object", icon: { text: 'Object', color:"#B97D4C", component: markRaw(Cube) }, component: markRaw(SidebarObject) },
      { name: "geometry", icon: { text: 'Geometry',color:"#6287D1", component: markRaw(GroupObjects) }, component: markRaw(SidebarGeometry) },
      { name: "material", icon: { text: 'Material',color:"#6287D1", component: markRaw(Opacity) }, component: markRaw(SidebarMaterial) },
      { name: "animations", icon: { text: 'Animations',color:"#06AF88", component: markRaw(Draw) }, component: markRaw(SidebarAnimations) },
      { name: "script", icon: { text: 'Script',color:"#06AF88", component: markRaw(Script) }, component: markRaw(SidebarScript) },
  ]

  if(object){
    switch (object.type) {
      case "Particle":
        // 如果选中的对象是粒子，就添加粒子相关的操作侧边栏
        object3DTabs.push({ name: 'particle', icon: { text: 'Particle',color:"#A9575F", component: markRaw(HeatMap) }, component: markRaw(SidebarParticle) })

        current.value = 'particle';
        break;
      case "Billboard":
        // 如果选中的对象是广告牌，就添加广告牌相关的操作侧边栏
        object3DTabs.push({ name: 'billboard', icon: { text: 'Billboard',color:"#A9575F", component: markRaw(LocationHeart) }, component: markRaw(SidebarBillboard) })

        current.value = 'billboard';
        break;
      case "HtmlPanel":
      case "HtmlSprite":
        // 如果选中的对象是HtmlPanel，就添HtmlPanel相关的操作侧边栏
        object3DTabs.push({ name: 'htmlPanel', icon: { text: 'Html panel',color:"#A9575F", component: markRaw(LocationCompany) }, component: markRaw(SidebarHtmlPanel) })

        current.value = 'htmlPanel';
        break;
    }
  }

  tabs.value = [...sceneTabs,...object3DTabs];

  nextTick(() => tabsInstRef.value?.syncBarPosition());

  // 如果当前选中的对象不是粒子，但是侧边栏是粒子，则切换到对象侧边栏
  if (current.value === 'particle') {
    if (!Utils.isParticleObject(object)){
      current.value = 'object';
    }
  }

  // 如果当前选中的对象不是广告牌，但是侧边栏是广告牌，则切换到对象侧边栏
  if (current.value === 'billboard') {
    if (!Utils.isBillboardObject(object)){
      current.value = 'object';
    }
  }

  // 如果当前选中的对象不是HtmlPanel，但是侧边栏是HtmlPanel，则切换到对象侧边栏
  if (current.value === 'htmlPanel') {
    if (!Utils.isHtmlPanelObject(object)){
      current.value = 'object';
    }
  }
}

onMounted(()=>{
  Hooks.useAddSignal("objectSelected",setTabs);

  setTabs(undefined);
})
onBeforeUnmount(() => {
  Hooks.useRemoveSignal("objectSelected",setTabs);
})
</script>

<template>
    <n-tabs ref="tabsInstRef" v-model:value="current" type="line" size="small" pane-class="!p-10px overflow-y-auto" id="sidebar-attributes"
        placement="left">
        <n-tab-pane v-for="tab in tabs" :key="tab.name" :name="tab.name"
            display-directive="show" :disabled="tab.name === 'disabled'">
            <template #tab>
                <SidebarTabIcon v-bind="tab.icon" />
            </template>
            <component :is="tab.component" />
        </n-tab-pane>
    </n-tabs>
</template>

<style lang="less" scoped>
.n-tabs {
    // height: calc(100vh - var(--header-height) - var(--footer-height));
    height: calc(100vh - var(--header-height));

    // 配置按功能类型（常驻/动态） 分割
    :deep(.n-tabs-wrapper) {
        .n-tabs-tab-wrapper:nth-child(8) {
            margin-top: 10px;
            border-top: 1px solid var(--n-tab-border-color);
        }
    }
}
</style>
