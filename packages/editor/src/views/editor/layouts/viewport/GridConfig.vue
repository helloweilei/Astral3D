<template>
  <n-popover :show-arrow="false" placement="bottom-end" :style="{ padding: 0 }">
    <template #trigger>
      <n-button circle size="small" class="ml-10px">
        <template #icon>
          <n-icon>
            <Grid />
          </n-icon>
        </template>
      </n-button>
    </template>

    <div class="p-3 w-56">
      <n-h4>网格配置</n-h4>
      <n-form :label-width="70" size="small" label-align="left">
        <n-form-item label="主颜色">
          <n-color-picker v-model:value="gridMainColor" :show-alpha="true" :modes="['hex']" size="small"
            @update:value="updateGrid" />
        </n-form-item>
        <n-form-item label="次颜色">
          <n-color-picker v-model:value="gridSubColor" :show-alpha="true" :modes="['hex']" size="small"
            @update:value="updateGrid" />
        </n-form-item>
        <n-form-item label="尺寸">
          <n-input-number v-model:value="gridSize" :min="50" :max="1000" :step="50" size="small"
            @update:value="updateGrid" />
        </n-form-item>
        <n-form-item label="次颜色显隐藏距离">
          <n-input-number v-model:value="subGridDistance" :min="0" :max="1000" :step="1" size="small"
            @update:value="updateGrid" />
          <span class="ml-2 text-xs text-gray-400">当前: {{ currentDistance.toFixed(1) }}</span>
        </n-form-item>
        <n-form-item label="坐标轴">
          <n-switch size="small" v-model:value="showAxes" @update:value="updateGrid" />
        </n-form-item>
      </n-form>
    </div>
  </n-popover>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import { Grid } from '@vicons/carbon';
import { Hooks, Viewer } from '@astral3d/engine';
import * as THREE from 'three';

const gridEnabled = ref(true);
const gridMainColor = ref('#666666');
const gridSubColor = ref('#555555');
const gridSize = ref(200);
const subGridDistance = ref(150);
const showAxes = ref(true);
const currentDistance = ref(0);

function updateGrid() {
  if (!window.viewer || !window.viewer.options) return;

  const options = window.viewer.options.grid;
  options.enabled = gridEnabled.value;
  options.mainColor = gridMainColor.value;
  options.color = gridSubColor.value;
  options.row = gridSize.value;
  options.column = gridSize.value;
  options.subGridDistance = subGridDistance.value;
  options.showAxes = showAxes.value;

  if (gridEnabled.value) {
    window.viewer.initGrid();
  } else if (window.viewer.grid) {
    window.viewer.grid.visible = false;
  }
}

function loadViewerOptions(viewer: Viewer) {
  if (!viewer || !viewer.options) return;

  const options = viewer.options.grid;
  gridEnabled.value = options.enabled;
  gridMainColor.value = options.mainColor;
  gridSubColor.value = options.color;
  gridSize.value = options.row;
  subGridDistance.value = options.subGridDistance || 32;
  showAxes.value = options.showAxes;
}

function updateCurrentDistance() {
  if (!window.viewer) return;

  const target = new THREE.Vector3();
  window.viewer.modules.controls.getTarget(target);
  currentDistance.value = window.viewer.camera.position.distanceTo(target);
}

function handleViewerInit(viewer: Viewer) {
  loadViewerOptions(viewer);
}

function handleCameraChanged() {
  updateCurrentDistance();
}

onMounted(() => {
  Hooks.useAddSignal('viewerInitCompleted', handleViewerInit);
  Hooks.useAddSignal('cameraChanged', handleCameraChanged);
});

onUnmounted(() => {
  Hooks.useRemoveSignal('viewerInitCompleted', handleViewerInit);
  Hooks.useRemoveSignal('cameraChanged', handleCameraChanged);
});
</script>
