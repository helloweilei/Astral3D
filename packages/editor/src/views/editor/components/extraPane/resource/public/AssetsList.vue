<script setup lang="ts">
import { inject, onMounted, reactive, ref, type Ref, watch } from "vue";
import { Object3D, Mesh, Vector2, Vector3, RepeatWrapping, TextureLoader } from "three";
import { App, Loader, Hooks, Utils, SetMaterialCommand, AddObjectCommand, SetMaterialMapCommand, getDefaultBillboardOptions, POSITION, Billboard } from "@astral3d/engine";
import { getServiceStaticFile } from "@/utils/common/file";
import { t } from "@/language";
import { fetchGetAssetCategoryTags, fetchGetAssetsList } from "@/http/api/assetsInfo";
import AssetPreview from "@/components/preview/AssetPreview.vue";
import { useDragStore } from "@/store/modules/drag";
import { screenToWorld } from "@/utils/common/scenes";

const props = withDefaults(defineProps<{
  type: IAssets.SupportType,
  category: string
}>(), {
  type: "Model",
  category: ""
});

const searchText = inject('searchText') as Ref<string>;

// 搜索和筛选状态
const tags = ref<string[] | null>([]);
const filterTags = ref([]);
// 资源数据
const assetsData = ref<Array<IAssets.Item>>([]);

/* 操作相关 */
const previewVisible = ref(false);
const operationAsset = ref<IAssets.Item>();

function handlePreview(asset: IAssets.Item) {
  operationAsset.value = asset;
  previewVisible.value = true;
}

/* 资源列表 */
let paginationReactive = reactive({
  page: 0,
  pageSize: 10,
  pageCount: 1
})
const loadMore = ref(false);
const noMore = ref(false);

async function handleLoad() {
  if (noMore.value) return;

  loadMore.value = true;
  const res = await fetchGetAssetsList({
    offset: paginationReactive.page * paginationReactive.pageSize,
    limit: paginationReactive.pageSize,
    sortby: "updateTime",
    order: "desc",
    query: `type:${props.type}${props.category ? `,category:${props.category}` : ""}`,
    search: `${filterTags.value.length > 0 ? ("tags:" + filterTags.value.join(",") + ';') : ''}${searchText.value ? "name:" + searchText.value : ""}`,
  });
  if (res.data === null) return;

  assetsData.value.push(...(res.data.items || []));
  paginationReactive.pageCount = res.data.pages;
  paginationReactive.page++;
  loadMore.value = false;

  if (paginationReactive.page >= paginationReactive.pageCount) noMore.value = true;
}

function reload() {
  paginationReactive.page = 0;
  paginationReactive.pageCount = 1;

  assetsData.value = [];
  noMore.value = false;

  handleLoad();
}

/* 双击添加/拖拽至场景 */
const dragStore = useDragStore();

function dragStart(asset: IAssets.Item) {
  dragStore.setData(asset)
}

function dragEnd(event: MouseEvent) {
  if (dragStore.getActionTarget !== "addToScene" || dragStore.endArea !== "Scene") return;

  if (["Material", "Texture"].includes(props.type)) {
    const position = new Vector2();
    const array = Utils.getMousePosition(window.viewer.container, event.clientX, event.clientY);
    position.fromArray(array);
    const intersects = window.viewer.getIntersects(position);
    if (intersects.length > 0) {
      const object = intersects[0].object;

      addToScene(dragStore.getData, object);
    } else {
      window.$message?.error(t("prompt['No object selected.']"))
    }
  } else {
    const position = screenToWorld(dragStore.endPosition.x, dragStore.endPosition.y);
    addToScene(dragStore.getData, position)
  }

  dragStore.setActionTarget("");
}

function addToScene(asset: IAssets.Item, positionOrObject?: Vector3 | Object3D) {
  let url = getServiceStaticFile(asset.file);

  switch (props.type) {
    case "Model":
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          // const file = new File([blob],`${asset.name}.${asset.file.split('/').pop()?.split('.')[1]}`);
          const file = new File([blob], `${asset.name}${asset.file.substring(asset.file.lastIndexOf('.'))}`);
          Loader.loadFiles([file], undefined).then((models: any) => {
            if (positionOrObject) {
              models[0].position.copy(positionOrObject);
              Hooks.useDispatchSignal("sceneGraphChanged");
            }
          });
        })
        .catch(() => {
          window.$message?.error(t("prompt['Load fail,Please try again later!']"));
        });
      break;
    case "Material":
      const object = positionOrObject as Mesh || App.selected;
      if (!object) {
        window.$message?.error(t("prompt['No object selected.']"))
        return;
      }

      if (!object.material) {
        window.$message?.error(t("prompt['Can not be applied to the current object']"))
        return;
      }

      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const materialName = asset.name;
          const file = new File([blob], materialName);

          Utils.parseMaterialZip(file).then(newMaterial => {
            newMaterial.name = materialName;

            if (Array.isArray(object.material)) {
              if (object.material.length === 0) {
                window.$message?.error(t("prompt[''Can not be applied to the current object']"))
                return;
              }

              object.material.forEach(m => {
                App.removeMaterial(m);
              });
            } else {
              App.removeMaterial(object.material);
            }

            App.execute(new SetMaterialCommand(object, newMaterial), 'Apply Material: ' + materialName);
            App.addMaterial(newMaterial);

            Hooks.useDispatchSignal("sceneGraphChanged");
          }).catch(() => {
            window.$message?.error(t("prompt['Load fail,Please try again later!']"));
          })
        })
        .catch(() => {
          window.$message?.error(t("prompt['Load fail,Please try again later!']"));
        });
      break;
    case "Texture":
      const object2 = positionOrObject as Mesh || App.selected;
      if (!object2) {
        window.$message?.error(t("prompt['No object selected.']"))
        return;
      }

      if (!object2.material) {
        window.$message?.error(t("prompt['Can not be applied to the current object']"))
        return;
      }

      // 直接应用至物体时当作基础色贴图处理
      const baseColorMap = new TextureLoader().load(url, (texture) => {
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.name = asset.name;

        Hooks.useDispatchSignal("sceneGraphChanged");
      })

      if (Array.isArray(object2.material)) {
        if (object2.material.length === 0) {
          window.$message?.error(t("prompt[''Can not be applied to the current object.']"))
          return;
        }

        // @ts-ignore
        if (object2.material[0].map !== undefined) {
          App.execute(new SetMaterialMapCommand(object2, 'map', baseColorMap, 0));
        }
      } else {
        // @ts-ignore
        if (object2.material.map !== undefined) {
          console.log("addmap", baseColorMap)
          App.execute(new SetMaterialMapCommand(object2, 'map', baseColorMap, undefined));
        }
      }
      break;
    case "Billboard":
      const _ops = getDefaultBillboardOptions();
      _ops.name = asset.name;
      _ops.image.url = url;
      _ops.image.visible = true;
      _ops.image.position = POSITION.LEFT;

      if (positionOrObject && (positionOrObject as Vector3).isVector3) {
        _ops.position = (positionOrObject as Vector3).toArray();
      }

      const billboard = new Billboard(_ops);

      const handleBillboardImgLoaded = () => {
        Hooks.useDispatchSignal("materialChanged", billboard.material);

        billboard.removeEventListener("imgLoaded", handleBillboardImgLoaded);
      }
      billboard.addEventListener("imgLoaded", handleBillboardImgLoaded);

      App.execute(new AddObjectCommand(billboard), `Add Billboard: ${_ops.name}`);
      break;
    case "HDR":
      window.viewer.options.hdr = url;
      // 同时设置为背景
      window.viewer.loadEnv(true);
      break;
  }
}

onMounted(() => {
  handleLoad();

  // 获取标签
  fetchGetAssetCategoryTags(props.type, props.category).then(res => {
    tags.value = res.data;
  })
})
watch([() => props.type, () => props.category], () => {
  filterTags.value = [];

  reload();

  // 获取标签
  fetchGetAssetCategoryTags(props.type, props.category).then(res => {
    tags.value = res.data;
  })
})
watch(searchText, Utils.debounce(() => {
  reload();
}, 500))
</script>

<template>
  <!-- 筛选区域 -->
  <div class="h-auto flex items-center justify-start py-0.3rem">
    <n-checkbox-group v-model:value="filterTags" @update:value="reload">
      <n-space item-style="display: flex;" align="center">
        <n-checkbox v-for="tag in tags" :key="tag" :value="tag" :label="tag" />
      </n-space>
    </n-checkbox-group>
  </div>

  <!-- 资源网格展示 -->
  <n-infinite-scroll id="public-assets-card-list" :distance="10" @load="handleLoad">
    <n-card hoverable v-for="asset in assetsData" :key="asset.id" @contextmenu.prevent="handlePreview(asset)"
      @dblclick="addToScene(asset)" draggable="true" @dragstart="dragStart(asset)" @dragend="dragEnd">
      <template #cover>
        <div class="absolute bottom-0 right-0 z-10">
          <n-tag type="success" :bordered="false" class="ml-5px" size="small"
            v-for="tag in (asset.tags ? asset.tags.split(',') : [])" :key="tag">
            {{ tag }}
          </n-tag>
        </div>

        <n-image preview-disabled object-fit="cover"
          :src="getServiceStaticFile(asset.thumbnail) || '/static/images/carousel/Astral3DEditor.jpg'"
          class="w-full h-full cursor-pointer hover:transform-scale-140 transition-all-200" />

        <div class="asset-name absolute bottom-0 left-0 w-full h-36px flex items-center justify-center"
          style="background: rgba(0, 0, 0, .3)">
          <n-ellipsis class="!max-w-90% color-#dbdbdb">
            {{ asset.name }}
          </n-ellipsis>
        </div>
      </template>
    </n-card>

    <div v-if="loadMore" class="text-center" style="grid-column: 1 / -1;">
      {{ t('home.Loading') }}...
    </div>
    <div v-else-if="!noMore" class="text-center" style="grid-column: 1 / -1;">
      {{ t('home.Scroll to load more') }} 😽😽😽
    </div>
    <div v-else class="text-center" style="grid-column: 1 / -1;">
      {{ t('home.No more') }} 🤪
    </div>
  </n-infinite-scroll>

  <!-- 预览 -->
  <AssetPreview v-model:visible="previewVisible" :asset="operationAsset as IAssets.Item" />
</template>

<style lang="less">
#public-assets-card-list {
  height: calc(100% - 60px);
  width: 100%;

  .n-scrollbar-content {
    display: grid;
    grid-gap: 0.75rem;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    grid-auto-flow: row dense;
  }

  .n-scrollbar-rail {
    right: -10px;
  }
}
</style>

<style lang="less" scoped>
.n-card {
  :deep(.n-card-cover) {
    height: 36px;
  }
}
</style>