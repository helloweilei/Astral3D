<template>
  <n-card size="small" hoverable @contextmenu.prevent="handlePreview" @dblclick="addToScene" draggable="true" @dragend="dragEnd">
    <template #cover>
      <img :src="resource.image" :alt="resource.name as string" draggable="false" class="w-full h-full object-cover"/>
    </template>
    <n-tooltip placement="bottom" trigger="hover">
      <template #trigger> {{ resource.name }} </template>

      <span> {{ resource.name }} </span>
    </n-tooltip>
  </n-card>
</template>

<script setup lang="ts">
import {Ref, inject, nextTick} from 'vue';
import {useDragStore} from "@/store/modules/drag";
import {applyDropPosition, screenToWorld} from "@/utils/common/scenes";
import * as Astral3D from '@astral3d/engine';

const props = withDefaults(defineProps<{
  resource: {
    key: string,
    image: string
    name: Ref<string> | string,
    path?: string,
  };
}>(), {
  resource: () => ({
    key: '',
    image: '',
    name: '',
  })
})
const previewInfo = inject('previewInfo') as any;
const previewRef = inject('previewRef') as any;

// 预览
async function handlePreview(){
  previewInfo.name = (props.resource.name as Ref<string>).value || props.resource.name;
  previewInfo.type = "Model";

  if(props.resource.path){
    previewInfo.fileOrUrl = props.resource.path;
  }

  previewInfo.visible = true;

  await nextTick();

  if(!props.resource.path){
    previewRef.value?.getPreviewer().then((previewer:Astral3D.Preview) => {
      if(!previewer) return;

      const obj = Astral3D[props.resource.key]();
      if(!obj) return;

      previewer.scene.add(obj);
      Astral3D.Utils.focusObject(obj,previewer.modules.controls);
    })
  }
}

// 加载模型
function loadModel(position?: { x: number, y: number, z: number }) {
  if (!props.resource.path) return;

  fetch(props.resource.path)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], props.resource.path?.split('/').pop() as string || props.resource.name as string);
        Astral3D.Loader.loadFiles([file], undefined).then((models:any) => {
          if (position && models[0]) {
            applyDropPosition(models[0], position);
            Astral3D.Hooks.useDispatchSignal("sceneGraphChanged");
          }
        });
      });
}

//双击添加至场景..
function addToScene() {
  if (!props.resource.path) {
    const obj = Astral3D[props.resource.key]();

    Astral3D.App.execute(new Astral3D.AddObjectCommand(obj));
  } else {
    loadModel();
  }
}

// 开始拖拽事件
const dragStore = useDragStore();

function dragEnd() {
  if (dragStore.getActionTarget !== "addToScene" || dragStore.endArea !== "Scene") return;

  const position = screenToWorld(dragStore.endPosition.x, dragStore.endPosition.y);
  if (!props.resource.path) {
    const obj = Astral3D[props.resource.key]();
    applyDropPosition(obj, position);
    Astral3D.App.execute(new Astral3D.AddObjectCommand(obj));
  } else {
    loadModel(position);
  }
  dragStore.setActionTarget("");
}
</script>

<style lang="less" scoped>
.n-card {
  cursor: pointer;

  :deep(&-cover) {
    height: 100%;
  }

  :deep(.n-card__content) {
    padding: 0.15rem 0;
    font-size: 0.65rem;
    text-align: center;
  }
}
</style>