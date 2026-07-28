<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { t } from "@/language";
import { SCENE_TYPE } from "@/utils/common/constant";
import { App } from "@astral3d/engine";
import { getServiceStaticFile } from "@/utils/common/file";
import { fetchUpload } from "@/http/api/sys";
import { fetchUpdateScene } from "@/http/api/scenes";

const data = ref(App.project.getKey("sceneInfo"));

onMounted(() => {
  data.value = App.project.getKey("sceneInfo");
})

async function handleScreenshot() {
  const { blob } = await window.viewer.getViewportImage();
  const res = await fetchUpload({
    file: new File([blob], `${data.value.sceneName}_coverImage_${Date.now()}.png`, { type: "image/png" }),
    type: "coverImage",
  });
  data.value.coverPicture = res.data;
  await fetchUpdateScene(data.value.id, { ...data.value, coverPicture: res.data });
  setDataFieldValue('coverPicture', res.data);
}

function setDataFieldValue(key: string, value: unknown) {
  App.project.setKey(`sceneInfo.${key}`, value);
}
</script>

<template>
  <n-form label-placement="left" :label-width="90" label-align="left" size="small">
    <!-- 场景名称 -->
    <n-form-item :label="t('scene.Name')">
      <n-input v-model:value="data.sceneName" :placeholder="t('layout.sider.project.please enter the scene name')"
        @change="(val) => { setDataFieldValue('sceneName', val) }" />
    </n-form-item>

    <!-- 场景分类 -->
    <n-form-item :label="t('scene.Classification')">
      <n-select v-model:value="data.sceneType" filterable tag :options="SCENE_TYPE"
        @update:value="(val) => { setDataFieldValue('sceneType', val) }" />
    </n-form-item>

    <!-- 场景描述 -->
    <n-form-item :label="t('scene.Introduction')">
      <n-input v-model:value="data.sceneIntroduction" type="textarea"
        :placeholder="t('layout.sider.project[\'please enter the scene introduction\']')" :autosize="{ minRows: 2 }"
        @change="(val) => { setDataFieldValue('sceneIntroduction', val) }" />
    </n-form-item>

    <!-- 场景版本 -->
    <n-form-item :label="t('other.Version')">
      <n-input-number v-model:value="data.sceneVersion" button-placement="both" class="text-center"
        @update:value="(val) => { setDataFieldValue('sceneVersion', val) }" />
    </n-form-item>

    <!-- 项目类型 -->
    <n-form-item :label="t('scene.Project type')">
      <n-tag type="success" :bordered="false">
        {{ data.projectType === 0 ? "Web3D" : "WebGIS" }}
      </n-tag>
    </n-form-item>

    <!--  封面图  -->
    <n-form-item :label="t('scene.Cover Picture')">
      <div class="w-full flex flex-col">
        <n-image :src="getServiceStaticFile(data.coverPicture) || '/static/images/placeholder/截屏占位图.png'"
          :alt="t('scene.Screenshot')" />
        <n-button @click="handleScreenshot">{{ t('scene.Screenshot') }}</n-button>
      </div>
    </n-form-item>
  </n-form>
</template>

<style scoped lang="less">
.n-image {
  :deep(img) {
    width: 100%;
    border-radius: 4px;
    margin-bottom: 0.25rem;
  }
}
</style>
