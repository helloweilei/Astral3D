<script lang="ts" setup>
import { computed } from 'vue';
import { GlobalThemeOverrides, zhCN, dateZhCN, enUS, dateEnUS } from "naive-ui";
import { useGlobalConfigStore } from "@/store/modules/globalConfig";
import Index from "@/views/index.vue";
import { App } from '@astral3d/engine';

// for debug
(window as any).App = App;

// 全局配置相关
const globalConfigStore = useGlobalConfigStore();

const NaiveUILocale = computed(() => {
  switch (globalConfigStore.locale) {
    case 'zh-CN':
      return {
        locale: zhCN,
        dateLocale: dateZhCN
      }
    case 'en-US':
      return {
        locale: enUS,
        dateLocale: dateEnUS
      }
  }
});
const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const mainColor = globalConfigStore.mainColor as IConfig.Color;

  return {
    common: {
      primaryColor: mainColor.hex,
      primaryColorHover: mainColor.hexHover,
      primaryColorPressed: mainColor.hexPressed,
      primaryColorSuppl: mainColor.hexSuppl,
      successColor: mainColor.hex,
      successColorHover: mainColor.hexHover,
      successColorPressed: mainColor.hexPressed,
      successColorSuppl: mainColor.hexSuppl,
      fontWeightStrong: '600'
    }
  }
})
</script>

<template>
  <!-- 调整 naive-ui 的字重配置 -->
  <n-config-provider :locale="NaiveUILocale.locale" :date-locale="NaiveUILocale.dateLocale"
    :theme="globalConfigStore.getProviderTheme()" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-modal-provider>
          <n-notification-provider placement="bottom">
            <n-message-provider>
              <Index />
            </n-message-provider>
          </n-notification-provider>
        </n-modal-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style scoped>
.n-config-provider {
  width: 100%;
  height: 100%;
}
</style>
