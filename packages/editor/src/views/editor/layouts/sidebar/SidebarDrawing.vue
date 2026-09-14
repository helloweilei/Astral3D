<script lang="ts" setup>
import {ref, watch, inject, Ref} from "vue";
import {ArchiveOutline as ArchiveIcon} from '@vicons/ionicons5';
import {UploadFileInfo} from "naive-ui";
import {t} from "@/language";
import {base64ToFile} from "@/utils/common/utils";
import {App} from '@astral3d/engine';

const drawingInfo = inject("drawingInfo") as Ref<IDrawing>;

const fileList = ref<UploadFileInfo[]>([])

function updateFileList(fList: UploadFileInfo[]) {
  if (fList.length === 0) return;

  //永远取最新值
  const file = fList[fList.length - 1];

  file.file !== null && loadFile(file.file as File);

  fileList.value[0].status = "finished";
}

function loadFile(file: File) {
  let img;

  // 通过FileReader.readAsDataURL(file)可以获取一段data:base64的字符串
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    img = reader.result; // reader.result就是文件的base64
    drawingInfo.value.isUploaded = true;
    drawingInfo.value.imgSrc = img;
  };
}

function removeDrawing() {
  return new Promise((resolve) => {
    window.$dialog.warning({
      title: t("other.warning"),
      content: t("drawing['Are you sure you want to delete the drawing?']"),
      positiveText: t("other.Ok"),
      negativeText: t("other.Cancel"),
      onPositiveClick: () => {
        resolve(true);
        App.project.resetDrawing();
        fileList.value = [];
      },
      onNegativeClick: () => {
        resolve(false);
      }
    });
  });
}

watch(() => drawingInfo.value.imgSrc, (newVal) => {
  if (!newVal || drawingInfo.value.isCad) {
    fileList.value = [];
    return;
  }

  // 本地上传的图纸是 base64，转成 File 以便 n-upload 预览
  if (newVal.startsWith("data:")) {
    const file = base64ToFile(newVal, "drawing");
    fileList.value = [{
      id: "1",
      name: file.name,
      file: file,
      type: file.type,
      status: "finished",
      url: null,
    }];
    return;
  }

  // 从 CAD 库拖入的图片是服务端 URL，直接用 url 预览，不能走 base64 解析
  fileList.value = [{
    id: "1",
    name: newVal.split(/[\\/]/).pop() || "drawing",
    status: "finished",
    url: newVal,
  }];
}, { immediate: true })
</script>

<template>
  <div id="sider-scene-drawing">
    <!-- 上传图纸 -->
    <n-upload :max="1"
              accept="image/*|.pdf"
              list-type="image-card"
              class="es-upload-card"
              v-model:file-list="fileList"
              @update:file-list="updateFileList"
              @remove="removeDrawing"
    >
      <n-upload-dragger>
        <n-icon size="48" :depth="3">
          <archive-icon/>
        </n-icon>
        <n-text style="font-size: 16px">
          {{ t("layout.sider.drawing['Click to select or drag the drawing to this area']") }}
        </n-text>
      </n-upload-dragger>
    </n-upload>
  </div>
</template>

<style scoped lang="less">
#sider-scene-drawing {
  position: relative;
}
</style>