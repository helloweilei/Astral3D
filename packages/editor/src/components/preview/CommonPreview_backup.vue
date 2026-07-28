<template>
  <n-modal :show="visible" @update:show="emits('update:visible', $event)" display-directive="show"
    class="w-66vh h-66vh min-w-740px" @close="emits('update:visible', false)">
    <n-card :title="name" embedded size="small" content-class="!p-0 w-full h-full" closable @close="handleClose">
      <div ref="commonPreviewRef" class="w-full h-full relative">
        <n-button v-if="screenshotShow" class="w-20% absolute bottom-2 left-40%" @click="handleScreenshot">{{
          t("scene.Screenshot") }}</n-button>
      </div>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { nextTick, watch, useTemplateRef, onBeforeUnmount } from "vue";
import { Preview } from "@astral3d/engine";
import { t } from "@/language";
import { getServiceStaticFile } from "@/utils/common/file";

const props = withDefaults(defineProps<{
  visible: boolean,
  screenshotShow: boolean,
  name: string,
  fileOrUrl: File | string | null,
  type?: IAssets.SupportType
}>(), {
  visible: false,
  screenshotShow: false,
  name: t("home.Preview"),
  fileOrUrl: null,
  type: 'Model',
})
const emits = defineEmits(['update:visible', 'screenshot'])

let previewer: Preview | null = null;

const assetPreviewRef = useTemplateRef("commonPreviewRef");

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    if (!previewer) {
      await nextTick();

      previewer = new Preview({
        container: assetPreviewRef.value,
        hdr: "/static/resource/hdr/cloudy.hdr",
        request: {
          baseUrl: "/file/static/"
        }
      });
    }

    if (props.fileOrUrl) {
      let fu = props.fileOrUrl;
      if (!(fu instanceof File)) {
        fu = getServiceStaticFile(fu);
      }

      previewer.load(fu, props.type);
    }
  } else {
    if (previewer) {
      previewer.dispose();
      previewer = null;
    }
  }
})

onBeforeUnmount(() => {
  if (previewer) {
    previewer.dispose();
    previewer = null;
  }
})

function handleClose() {
  emits('update:visible', false);
}

function handleScreenshot() {
  if (!previewer) return;

  previewer.getViewportImage().then(({ image }: { image: HTMLImageElement }) => {
    emits('screenshot', image);
  }).catch(() => {
    window.$message?.error(t("prompt.Screenshots fail"));
  })
}
</script>