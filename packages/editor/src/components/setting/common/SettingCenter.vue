<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button quaternary @click="show = true">
        <template #icon>
          <n-icon>
            <Settings />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("setting.Setting") }}
  </n-tooltip>

  <n-modal v-model:show="show" display-directive="show" class="w-100 h-40vh">
    <n-card size="small">
      <SettingTabs />
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Settings } from "@vicons/carbon";
import { t } from "@/language";

const show = ref(false);
</script>

<style scoped lang="less">
.n-tab-pane{
  width: 100%;

  height: 100%;
}
</style>