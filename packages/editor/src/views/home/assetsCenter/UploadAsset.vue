<script setup lang="ts">
import { watch, reactive, h, computed, ref, useTemplateRef } from 'vue';
import type { VNodeChild } from 'vue';
import { NIcon } from 'naive-ui';
import type { FormInst, UploadInst, UploadFileInfo } from 'naive-ui';
import { t } from "@/language";
import { ASSET_UPLOAD_SUPPORT_TYPE } from "@/utils/common/constant";
import { ArchiveOutline } from "@vicons/ionicons5";
import { filterSize, getServiceStaticFile } from "@/utils/common/file";
import { formItemNotNil } from "@/utils/common/verify";
import { fetchUpload } from "@/http/api/sys";
import { fetchAddAsset, fetchGetAssetCategoryTags, fetchUpdateAsset } from "@/http/api/assetsInfo";
import { useAssetsStore } from "@/store/modules/assets";
import CommonPreview from "@/components/preview/CommonPreview.vue";

const props = withDefaults(defineProps<{
  visible: boolean,
  asset?: IAssets.Item
}>(), {
  visible: false,
})
const emits = defineEmits(['update:visible', 'refresh']);

const assetsStore = useAssetsStore();

const formRef = useTemplateRef<FormInst>('formRef');
const uploadFileRef = useTemplateRef<UploadInst>('uploadFileRef');
const isUpdate = ref<boolean>(false);
const model = reactive<{
  name: string,
  type: IAssets.SupportType,
  category: string;
  thumbnail: File | string | null,
  file: File | string | null,
  size: number,
  tags: string[]
}>({
  name: "",
  type: "Model",
  category: "",
  thumbnail: null,
  file: null,
  size: 0,
  tags: []
});
const rules = {
  category: {
    required: true,
    message: t("prompt.The entry can not be null"),
    trigger: ['input', 'blur']
  },
  thumbnail: {
    required: true,
    trigger: 'change',
    validator: formItemNotNil
  },
  file: {
    required: true,
    trigger: 'change',
    validator: formItemNotNil
  },
  name: {
    required: true,
    message: t("prompt.The entry can not be null"),
    trigger: ['input', 'blur']
  }
};
const tagOptions = ref<{
  label: string,
  value: string
}[]>([]);
const fileSize = computed(() => filterSize(model.size));
const renderTypeLabel = (option: IAssets.MainCategory): VNodeChild => {
  return [
    h(
      NIcon,
      {
        style: {
          verticalAlign: '-0.15em',
          marginRight: '4px'
        }
      },
      {
        default: () => h(option.icon)
      }
    ),
    option.label as string
  ]
}

const thumbnailFileList = ref<UploadFileInfo[]>([]);
const fileList = ref<UploadFileInfo[]>([]);

// 子分类
const subCategories = computed(() => {
  !isUpdate.value && (model.category = "");

  return assetsStore.getCategoryChildren(model.type);
});

// 资源类型变更
function handleTypeChange() {
  model.category = "";
  model.tags = [];

  model.thumbnail = null;
  thumbnailFileList.value = [];

  model.file = null;
  model.name = "";
  model.size = 0;
  fileList.value = [];
  uploadFileRef.value?.clear();

  formRef.value?.validate();
}

// 标签更新（选择/新建）
function handleUpdateTag() {
  const newTag = model.tags[model.tags.length - 1];

  // 正则表达式校验，只能包含汉字、中英文大小写、数字和下划线
  const reg = /^[\u4e00-\u9fa5A-Za-z0-9_]+$/;
  if (!reg.test(newTag)) {
    model.tags.pop();

    window.$message?.error(t("prompt['Only Chinese characters, Chinese and English case, numbers, and underscores can be included']"));
  }
}

// 通过预览截图
const previewVisible = ref(false);
const previewName = ref(t("home.Preview"));
function handlePreview() {
  if (!model.file) return;

  previewName.value = model.name;
  previewVisible.value = true;
}
function handlePreviewScreenshot(image: HTMLImageElement) {
  const url = image.getAttribute("src");
  if (!url) return;

  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const fileName = `${Date.now() + model.name}_thumbnail.png`;

      thumbnailFileList.value = [
        {
          id: fileName,
          name: fileName,
          file: new File([blob], fileName, { type: blob.type }),
          url: null,
          status: 'pending'
        }
      ]

      handleThumbnailChange();

      previewVisible.value = false;
    })
}

// 预览图变化
function handleThumbnailChange() {
  if (thumbnailFileList.value.length === 0) {
    model.thumbnail = null;
    return;
  }
  model.thumbnail = thumbnailFileList.value[0].file as File;

  formRef.value?.validate();
}

// 上传文件变化
function handleFileChange({ file }) {
  if (file.status === "removed") {
    model.file = null;
    model.size = 0;
    formRef.value?.validate();
    return;
  }

  if (!ASSET_UPLOAD_SUPPORT_TYPE[model.type].includes(file.name.split(".").at(-1).toLowerCase())) {
    window.$message?.error(t("prompt['This format is not supported, please upload again! Supported formats are:']") + ` ${ASSET_UPLOAD_SUPPORT_TYPE[model.type].join("、")}`);
    uploadFileRef.value?.clear();
    return false;
  }

  model.file = file.file as File;
  let fileName = model.file.name.split(".");
  fileName.pop();
  model.name = fileName.join(".");
  model.size = model.file.size;

  if (model.type === "Texture") {
    const fileName = `${Date.now() + model.name}_thumbnail.png`;

    thumbnailFileList.value = [
      {
        id: fileName,
        name: fileName,
        file: model.file,
        url: null,
        status: 'pending'
      }
    ]

    handleThumbnailChange();
  }

  formRef.value?.validate();
}

// 提交/更新
const submitLoading = ref(false);
function submit(e) {
  e.preventDefault();

  formRef.value?.validate(async (errors) => {
    if (errors || !model.file || !(model.file instanceof File)) return;

    submitLoading.value = true;

    const saveFolder = `upload/assets/${model.type.toLowerCase()}`;

    // 1. 上传缩略图
    let thumbnailPath = "", filePath = "";
    if (model.thumbnail && model.thumbnail instanceof File) {
      const res = await fetchUpload({
        file: model.thumbnail,
        biz: `${saveFolder}/thumbnail`
      })

      if (res.data === null) {
        window.$message?.error(t("bim.Failed to upload thumbnail"));
        submitLoading.value = false;
        return;
      } else {
        thumbnailPath = res.data as string;
      }
    }

    // 2. 上传文件
    const res = await fetchUpload({
      file: model.file,
      biz: saveFolder,
      type: model.type
    })
    if (res.data === null) {
      window.$message?.error(t("prompt.Failed to upload"));
      submitLoading.value = false;
      return;
    } else {
      filePath = res.data as string;
    }

    const addRes = await fetchAddAsset({
      name: model.name,
      type: model.type,
      category: model.category,
      thumbnail: thumbnailPath,
      file: filePath,
      size: model.size,
      tags: model.tags.join(","),
    })

    if (addRes.error === null) {
      window.$message?.success(t("prompt.Success to upload"));

      emits("refresh", addRes.data, 'add');

      submitLoading.value = false;
      handleShow(false);
    } else {
      submitLoading.value = false;
    }
  })
}

function update(e) {
  e.preventDefault();

  formRef.value?.validate(async (errors) => {
    if (errors || !props.asset) return;

    submitLoading.value = true;

    const saveFolder = `upload/assets/${model.type.toLowerCase()}`;

    // 1. 检查缩略图是否变化，变化则上传新的
    if (model.thumbnail !== props.asset.thumbnail) {
      const res = await fetchUpload({
        file: model.thumbnail as File,
        biz: `${saveFolder}/thumbnail`
      })

      if (res.data === null) {
        window.$message?.error(t("bim.Failed to upload thumbnail"));
        submitLoading.value = false;
        return;
      } else {
        model.thumbnail = res.data as string;
      }
    }

    // 2. 更新
    const res = await fetchUpdateAsset({
      id: props.asset.id,
      name: model.name,
      type: props.asset.type,
      category: model.category,
      thumbnail: model.thumbnail,
      file: props.asset.file,
      size: props.asset.size,
      tags: model.tags.join(","),
    })

    if (res.error === null) {
      window.$message?.success(t("prompt.Success to update"));

      emits("refresh", res.data, 'update');

      submitLoading.value = false;
      handleShow(false);
    } else {
      submitLoading.value = false;
    }
  })
}

// 此模态框显隐
function handleShow(visible: boolean) {
  emits('update:visible', visible);

  if (!visible) {
    model.name = "";
    model.size = 0;
    model.type = "Model";
    model.category = "";
    model.thumbnail = null;
    model.file = null;
  }
}

watch(() => props.visible, () => {
  if (props.visible) {
    if (props.asset) {
      isUpdate.value = true;

      model.name = props.asset.name;
      model.type = props.asset.type;
      model.category = props.asset.category;
      model.thumbnail = props.asset.thumbnail;
      thumbnailFileList.value = [
        {
          id: 'thumbnail',
          name: props.asset.thumbnail.split("/").at(-1) || "astral3d.png",
          url: getServiceStaticFile(props.asset.thumbnail),
          status: 'pending'
        }
      ]
      model.file = props.asset.file;
      fileList.value = [
        {
          id: 'asset-file',
          name: props.asset.file.split("/").at(-1) || "",
          url: getServiceStaticFile(props.asset.file),
          status: 'pending'
        }
      ]
      model.size = props.asset.size;
      model.tags = props.asset.tags ? props.asset.tags.split(',') : [];
    }

    fetchGetAssetCategoryTags(model.type, model.category).then(res => {
      tagOptions.value = res.data?.map?.((tag) => ({
        label: tag,
        value: tag,
      })) || [];
    })
  } else {
    isUpdate.value = false;
  }
})
</script>

<template>
  <n-modal :show="visible" @update:show="handleShow" :mask-closable="false" ref="modelRef" class="!w-500px"
    preset="card" :title="t(isUpdate ? 'home.assets.Edit asset' : 'home.assets.Upload asset')">
    <n-form label-placement="left" :model="model" :rules="rules" label-width="100px" label-align="right" ref="formRef"
      require-mark-placement="right-hanging" :disabled="submitLoading">
      <n-form-item :label="t('home.assets.Type')">
        <n-select v-model:value="model.type" :options="assetsStore.categories" :render-label="renderTypeLabel"
          value-field="key" children-field="" :disabled="isUpdate" @update:value="handleTypeChange" />
      </n-form-item>

      <n-form-item :label="t('home.assets.Category')" path="category">
        <n-tree-select v-model:value="model.category" :options="subCategories" value-field="key" />
      </n-form-item>

      <n-form-item :label="t('home.assets.Tags')">
        <n-select v-model:value="model.tags" :options="tagOptions" filterable multiple tag
          @update:value="handleUpdateTag" />
      </n-form-item>

      <n-form-item :label="t('bim.Thumbnail')" path="thumbnail">
        <div class="flex flex-col w-full">
          <n-upload :default-upload="false" list-type="image-card" :max="1" accept="image/*"
            v-model:file-list="thumbnailFileList" @update:file-list="handleThumbnailChange" />
          <n-button v-if="!['Texture'].includes(model.type)" type="primary" class="w-full mt-2" :disabled="!model.file"
            @click="handlePreview">
            {{ t('home.assets.By previewing the screenshots') }}
          </n-button>
        </div>
      </n-form-item>

      <n-form-item :label="t('layout.header.File')" path="file">
        <n-upload ref="uploadFileRef" :default-upload="false" :max="1" :disabled="isUpdate"
          :default-file-list="fileList" :accept="'.' + ASSET_UPLOAD_SUPPORT_TYPE[model.type].join(',.')"
          @change="handleFileChange">
          <n-upload-dragger>
            <div>
              <n-icon size="48" :depth="3">
                <ArchiveOutline />
              </n-icon>
            </div>
            <n-text style="font-size: 14px">
              {{
                t("bim['Click or drag the file to this area.Supported formats are:']") + `
              ${ASSET_UPLOAD_SUPPORT_TYPE[model.type].join("、")}`
              }}
            </n-text>
          </n-upload-dragger>
        </n-upload>
      </n-form-item>

      <n-form-item :label="t('home.assets.Name')" path="name">
        <n-input v-model:value="model.name" />
      </n-form-item>

      <n-form-item :label="t('home.assets.Size')">
        <n-input v-model:value="fileSize" disabled />
      </n-form-item>
    </n-form>

    <div class="flex justify-end space-x-2 mt-2">
      <n-button round :disabled="submitLoading" @click="handleShow(false)">{{ t("other.Cancel") }}</n-button>
      <n-button round :loading="submitLoading" type="primary" @click="submit" v-if="!isUpdate">{{ t("other.Upload")
        }}</n-button>
      <n-button round :loading="submitLoading" type="primary" @click="update" v-else>{{ t("other.Ok") }}</n-button>
    </div>
  </n-modal>

  <CommonPreview v-model:visible="previewVisible" :name="previewName" :file-or-url="model.file" :type="model.type"
    screenshot-show @screenshot="handlePreviewScreenshot" />
</template>

<style scoped lang="less"></style>