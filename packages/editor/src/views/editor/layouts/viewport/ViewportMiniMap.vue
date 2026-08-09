<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { App, Hooks, MiniMap, Viewer } from "@astral3d/engine";

/** 与 ViewportTools 完全独立：仅响应场景配置 viewport.miniMap */
let miniMap: MiniMap | null = null;

function ensureViewportDefaults() {
	if (App.project.getKey("viewport") == null) {
		App.project.setKey("viewport", { miniMap: true }, false);
	}
}

function ensureMiniMap(_viewer?: Viewer) {
	const miniMapOptions = App.project.getKey("viewport") ?? {
		miniMapSize: 240,
		miniMapRenderSize: 120,
	};
	const viewer = _viewer ?? window.viewer;
	if (!miniMap && viewer) {
		miniMap = new MiniMap(viewer, {
			mapSize: miniMapOptions.miniMapSize,
			mapRenderSize: miniMapOptions.miniMapRenderSize,
			isShow: true,
		});
	}
	if (miniMap) {
		miniMap.updateOptions({
			mapSize: miniMapOptions.miniMapSize,
			mapRenderSize: miniMapOptions.miniMapRenderSize,
		});
	}
	return miniMap;
}

function syncFromProject(viewer?: Viewer) {
	ensureViewportDefaults();
	const enabled = !!App.project.getKey("viewport.miniMap");
	const map = ensureMiniMap(viewer);
	if (!map) return;
	if (enabled) map.open();
	else map.close();
}

function waitViewerThenSync() {
	Hooks.useAddOnceSignal("viewerInitCompleted", syncFromProject);
}

onMounted(() => {
	// Viewer 在父组件 onMounted 中创建，子组件先挂载，需等待
	waitViewerThenSync();
	Hooks.useAddSignal("viewportSettingsChanged", syncFromProject);
	Hooks.useAddSignal("sceneCleared", syncFromProject);
});

onBeforeUnmount(() => {
	Hooks.useRemoveSignal("viewportSettingsChanged", syncFromProject);
	Hooks.useRemoveSignal("sceneCleared", syncFromProject);
	miniMap?.dispose();
	miniMap = null;
});
</script>

<template>
	<!-- 无 DOM：MiniMap 自行挂到 viewer.container -->
</template>
