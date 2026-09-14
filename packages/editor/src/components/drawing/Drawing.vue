<template>
  <div id="drawing" class="!w-full !h-full" @contextmenu="handleContextMenu">
    <n-spin :show="loading">
      <template #description>加载中...</template>
      <div class="drawing-container" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
      </div>
    </n-spin>

    <ImageToolbar v-if="!drawingInfo?.isCad" />
    <CADToolbar v-else />

    <n-tooltip trigger="hover" placement="bottom">
      <template #trigger>
        <n-button class="drawing-close-btn" quaternary circle size="small" @click="closeDrawing">
          <template #icon>
            <n-icon>
              <CloseOutline />
            </n-icon>
          </template>
        </n-button>
      </template>
      {{ t("other.Close") }}
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, nextTick, computed, onBeforeUnmount, watch, inject, Ref} from "vue";
import {useThemeVars} from 'naive-ui';
import {CloseOutline} from "@vicons/ionicons5";
import {App,Hooks,DxfViewer,DxfParser} from "@astral3d/engine";
import {t} from "@/language";
import {DrawRect} from "@/utils/drawing/drawRect";
import ImageToolbar from "./toolbar/Image.vue";
import CADToolbar from "./toolbar/CAD.vue";
import Config from "@/utils/storage/config";

const themeVars = useThemeVars();
const baseColor = computed(() => themeVars.value.baseColor);
const borderColor = computed(() => themeVars.value.borderColor);

const drawingInfo = inject("drawingInfo") as Ref<IDrawing>;

const containerRef = ref();
const canvasRef = ref();
const loading = ref(true);
let loadVersion = 0;

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();

  return false
}

/**
 * 关闭图纸窗口：重置项目中的图纸配置并同步给注入的 drawingInfo，
 * Scene.vue 依赖 drawingInfo.isUploaded 控制该窗口的显示，置为 false 后窗口即卸载
 */
function closeDrawing() {
  window.$dialog.warning({
    title: t("other.warning"),
    content: t("drawing['Are you sure you want to close the drawing? The marks on it will be lost.']"),
    positiveText: t("other.Ok"),
    negativeText: t("other.Cancel"),
    onPositiveClick: () => {
      App.project.resetDrawing();
      drawingInfo.value = App.project.getKey("drawing");
    },
  });
}

function loadCadFile(canvas:HTMLCanvasElement,parentElement:HTMLDivElement, version: number){
  let dxf;

  // 实例化Dxf.Viewer
  function loadDxf() {
    const DXFViewer = new DxfViewer(dxf, canvas, parentElement.offsetWidth, parentElement.offsetHeight, () => {
      if (version !== loadVersion) {
        DXFViewer.dispose();
        return;
      }
      loading.value = false;
      window.DrawViewer = DXFViewer;
    });

    if (dxf.tables?.layer?.layers) {
      const bgColor = Config.getKey('cad')?.bgColor;

      if (bgColor) {
        const color = Number(bgColor);
        const contrastColor = color === 0x000000 ? 0xffffff : 0x000000;

        const l = dxf.tables.layer.layers;
        Object.keys(l).forEach(k => {
          if (l[k].color === color) {
            l[k].color = contrastColor;
          }
        })
      }
      drawingInfo.value.layers = dxf.tables.layer.layers;
    }
  }

  let notice = window.$notification.info({
    title: window.$t("drawing['Get the drawing data']") + "...",
    content: window.$t("other.Loading") + "...",
    closable: false,
  })

  // dxf 加载图纸
  const parser = new DxfParser();
  fetch(drawingInfo.value.imgSrc)
    .then(res => {
      if (!res.ok) {
        throw new Error(`CAD request failed: ${res.status} ${res.statusText}`);
      }
      return res.text();
    })
    .then(text => {
      if (version !== loadVersion) return;
      notice.content = window.$t("scene['Parsing to editor']");
      dxf = parser.parse(text);
      if (!dxf) throw new Error("CAD parse returned empty data");
      loadDxf();
    })
    .catch(error => {
      console.error("Failed to load CAD drawing:", error);
      if (version === loadVersion) {
        loading.value = false;
        window.$message?.error(window.$t("prompt['Load fail,Please try again later!']"));
      }
    })
    .finally(() => {
      notice.destroy();
    });
}

async function initCanvas() {
  const version = ++loadVersion;
  if(!drawingInfo.value.imgSrc) {
    loading.value = false;
    return;
  }
  loading.value = true;

  let canvas = canvasRef.value as HTMLCanvasElement;
  const parentElement = containerRef.value as HTMLDivElement;

  if(drawingInfo.value.isCad){
    // dxf 加载图纸
    loadCadFile(canvas, parentElement, version);
  }else{
    // canvas 加载图片
    let bigImg = new Image();
    bigImg.onload = () => {
      if (version !== loadVersion) return;
      try {
        const containerHeight = (containerRef.value as HTMLDivElement).offsetHeight;
        canvas.height = containerHeight;
        canvas.width = bigImg.width * (containerHeight / bigImg.height);

        canvas.style.backgroundImage = `url(${drawingInfo.value.imgSrc})`;
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "top left";
        canvas.style.backgroundSize = "100% 100%";

        drawingInfo.value.imgInfo = {
          width: canvas.width,
          height: canvas.height
        }

        window.DrawViewer = new DrawRect(canvas,parentElement);
      } catch (error) {
        console.error("Failed to init drawing canvas:", error);
        window.$message?.error(window.$t("prompt['Load fail,Please try again later!']"));
      } finally {
        loading.value = false;
      }
    }
    bigImg.onerror = error => {
      if (version !== loadVersion) return;
      console.error("Failed to load drawing image:", error);
      loading.value = false;
      window.$message?.error(window.$t("prompt['Load fail,Please try again later!']"));
    };
    bigImg.src = drawingInfo.value.imgSrc;
  }
}

// 模型选中时反选图纸上的rect
function objectSelected(object){
  if(!object ||!window.DrawViewer) return;
  // if(!drawingInfo.isCad){
  //   window.DrawViewer?.selectRect(object.uuid);
  // }else{
  //   // 检查该模型是否已有绑定标记
  //   for (const rect of drawingInfo.markList) {
  //     if (rect.modelUuid === object.uuid) {
  //       window.DrawViewer?.selectRect(object.uuid);
  //       return;
  //     }
  //   }
  //
  //   window.DrawViewer?.selectRect(undefined);
  // }

  window.DrawViewer?.selectRect(object.uuid);
}

watch(() => drawingInfo.value.imgSrc, async () => {
  if(!canvasRef.value) return;
  const newCanvas = document.createElement("canvas");

  window.DrawViewer?.dispose();
  canvasRef.value.remove();
  canvasRef.value = null;

  containerRef.value.append(newCanvas);
  canvasRef.value = newCanvas;

  await initCanvas();
})

onMounted(async () => {
  Hooks.useAddSignal("objectSelected", objectSelected);

  // nextTick 复用的是当前调度批次的 Promise，同批次中其他组件的 watcher 抛错会让它 reject，
  // 这里吞掉该错误，保证 initCanvas 一定执行，否则 loading 会永远转圈
  try {
    await nextTick();
  } catch {
    /* ignore */
  }
  await initCanvas();
})
onBeforeUnmount(() => {
  Hooks.useRemoveSignal("objectSelected", objectSelected);

  window.DrawViewer?.dispose();
  window.DrawViewer = undefined;
})
</script>

<style lang="less" scoped>
#drawing {
  overflow: hidden;
  display: flex;
  justify-content: center;

  :deep(.n-spin-container){
    width: 100%;
    height: 100%;

    .n-spin-content{
      width: 100%;
      height: 100%;
    }
  }

  .drawing-container {
    position: relative;
    margin: 0 auto;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    canvas {
      position: relative;
      transition: all 16ms;
      z-index: 10;
      width: auto;
      height: auto;
    }
  }

  .drawing-close-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 999;
    background: v-bind(baseColor);
    border: 1px solid v-bind(borderColor);
  }

  .drawing-tool-bar {
    position: absolute;
    bottom: 3%;
    padding: 0.2rem 0.5rem;
    background: v-bind(baseColor);
    z-index: 999;
    border: 1px solid v-bind(borderColor);
    border-radius: 0.3rem;
    display: flex;

    :deep(.n-color-picker) {
      position: absolute;
      width: 0;
      overflow: hidden;

      &-trigger {
        border: 0;
        width: 0;
      }
    }
  }
}
</style>