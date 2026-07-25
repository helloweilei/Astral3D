<template>
  <div id="layout-assets" class="layout-assets">
    <EsSplitter direction="vertical" :default-ratio="2 / 3" :min-size="120" :separator-size="3">
      <template #first>
        <div class="layout-assets-scene-tree">
          <SceneTree />
        </div>
      </template>
      <template #second>
        <n-tabs
          default-value="cad"
          animated
          type="line"
          justify-content="space-around"
          class="layout-assets-tabs"
          pane-wrapper-class="layout-assets-tab-pane-wrapper"
        >
          <n-tab-pane name="cad" tab="CAD" display-directive="show">
            <CadLibrary />
          </n-tab-pane>
        </n-tabs>
      </template>
    </EsSplitter>
  </div>
</template>

<script lang="ts" setup>
import SceneTree from "@/components/tree/SceneTree.vue";
import EsSplitter from "@/components/es/EsSplitter.vue";
import CadLibrary from "./assets/CadLibrary.vue";
</script>

<style scoped lang="less">
.layout-assets {
  height: calc(100vh - var(--header-height));
  border-right: 1px solid var(--n-border-color);
  overflow: hidden;

  .layout-assets-scene-tree {
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .layout-assets-tabs {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.layout-assets-tab-pane-wrapper) {
    height: calc(100% - var(--n-pane-padding-top) - 42px);
    overflow-y: auto;

    .n-tab-pane {
      height: calc(100% - 10px);
      padding-top: 10px !important;
      overflow-y: auto;

      &:first-child {
        overflow: unset;
      }
    }
  }
}
</style>
