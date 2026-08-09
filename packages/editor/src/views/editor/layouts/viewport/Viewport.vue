<template>
  <div class="w-full h-full">
    <Toolbar />

    <div id="viewport" ref="viewportRef" class="absolute top-0 left-0 w-full h-full"
      @pointerdown="handleViewportPointerdown">
      <ViewportInfo />
      <ViewportMiniMap />
    </div>

    <!-- 右侧叠放：指南针与工具条垂直居中对齐，置于 viewport 外避免被 canvas 截获点击 -->
    <div class="viewport-right-stack">
      <ViewportCompass />
      <ViewportTools />
    </div>

    <!--  RVT BIM 构件信息悬浮框  -->
    <BIMProperties />

    <!-- IFC BIM 构件信息悬浮框   -->
    <IFCProperties />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, onBeforeUnmount } from 'vue';
import { App, Viewer, Hooks } from "@astral3d/engine";
import Toolbar from "./Toolbar.vue";
import { useGlobalConfigStore } from "@/store/modules/globalConfig";
import { usePluginStore } from "@/store/modules/plugin";
import { installBuiltinPlugin } from "@/plugin";
import ViewportInfo from "./ViewportInfo.vue";
import ViewportMiniMap from "./ViewportMiniMap.vue";
import ViewportCompass from "./ViewportCompass.vue";
import ViewportTools from "./ViewportTools.vue";
import BIMProperties from "./BIMProperties.vue";
import IFCProperties from "./IFCProperties.vue";

const globalStore = useGlobalConfigStore();
const pluginStore = usePluginStore();

const viewportRef = ref();

onMounted(async () => {
  App.setConfig({
    theme: globalStore.theme.replace("Theme", ""),
    mainColor: globalStore.mainColor.hexHover
  });

  const navigationMode = App.config.getKey("camera.navigationMode") ?? "orbit";
  const roamMoveSpeed = App.config.getKey("camera.roamMoveSpeed") ?? 20;

  window.viewer = new Viewer({
    container: viewportRef.value,
    edit: {
      enabled: true
    },
    request: {
      baseUrl: "/file/static/"
    },
    control: {
      navigationMode,
      roamMoveSpeed,
    },
  });

  await nextTick();

  pluginStore.setPlugins(Array.from(window.viewer.modules.plugin.plugins.values()));
  Hooks.useAddSignal("pluginInstall", pluginStore.addPlugin);
  Hooks.useAddSignal("pluginUninstall", pluginStore.removePlugin);

  installBuiltinPlugin(window.viewer);

  window.addEventListener("keydown", handleCameraNavigationShortcut);
})

function handleCameraNavigationShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName.toUpperCase())) {
    return;
  }

  const roamToggle = (App.config.getShortcutItem("roamToggle") || "m").toLowerCase();
  if (event.altKey && event.key.toLowerCase() === roamToggle) {
    event.preventDefault();
    const mode = window.viewer?.modules?.cameraManage?.toggleNavigationMode();
    if (mode) {
      App.config.setKey("camera.navigationMode", mode);
    }
  }
}

onBeforeUnmount(() => {
  Hooks.useRemoveSignal("pluginInstall", pluginStore.addPlugin);
  Hooks.useRemoveSignal("pluginUninstall", pluginStore.removePlugin);
  window.removeEventListener("keydown", handleCameraNavigationShortcut);
});

function handleViewportPointerdown() {
  const focusedElement = document.activeElement;
  // @ts-ignore
  if (focusedElement && focusedElement.blur) {
    // @ts-ignore
    focusedElement.blur();
  }
}
</script>

<style scoped lang="less">
.viewport-right-stack {
  position: absolute;
  top: 44px;
  right: 12px;
  z-index: 12;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  pointer-events: none;
}
</style>