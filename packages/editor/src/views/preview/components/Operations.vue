<script setup lang="ts">
import {onMounted, onBeforeUnmount, nextTick} from "vue";
import {MathUtils} from "three";
import {Hooks} from "@astral3d/engine";
import {usePreviewOperationStore} from "@/store/modules/previewOperation";
import OperationConfig from "./operationConfigModal/index.vue";
import OperationItem from "@/views/preview/components/OperationItem.vue";
import {MenuOperation} from "@/utils/preview/menuOperation";

const operationStore = usePreviewOperationStore();

function handleClick() {}

function handlePostAnimationLoop(e) {
  if (operationStore.menuList.autoRotate.active) {
    window.viewer.modules.controls.azimuthAngle += operationStore.autoRotateSpeed * e.delta * MathUtils.DEG2RAD;
  }

  if (operationStore.menuList.roaming.active) {
    if (MenuOperation.Roaming.isRoaming) {
      e.toBeRender(true);
    }
  }
}

function handlePreRender(e){
  if (operationStore.menuList.roaming.active) {
    if (MenuOperation.Roaming.isRoaming) {
      const roamingDelta = e.delta / 3;
      for (let i = 0; i < 3; i++) {
        MenuOperation.Roaming.render(roamingDelta);
      }
      // MenuOperation.Roaming.render(e.delta);
    }
  }
}

function handleCameraChanged(_,controls){
  if(!MenuOperation.Roaming.isRoaming || !MenuOperation.Roaming.person) return;

  // 漫游模式下,玩家跟随旋转
  MenuOperation.Roaming.person.rotation.y = controls.azimuthAngle + Math.PI;
}

onMounted(async () => {
  await nextTick();

  window.viewer.addEventListener("afterAnimation", handlePostAnimationLoop);
  window.viewer.addEventListener("beforeRender", handlePreRender);

  Hooks.useAddSignal('cameraChanged',handleCameraChanged)
})
onBeforeUnmount(() => {
  window.viewer.removeEventListener("afterAnimation", handlePostAnimationLoop);
  window.viewer.removeEventListener("beforeRender", handlePreRender);

  Hooks.useRemoveSignal('cameraChanged',handleCameraChanged)
})
</script>

<template>
  <div class="w-full h-0 flex justify-center items-end absolute bottom-15px">
    <n-card size="small" class="w-max" content-style="padding: 5px 0 5px 10px; display: flex;"
            @click.stop="handleClick">
      <OperationItem v-for="o in Object.keys(operationStore.menuList)" :key="o" :oKey="o"
                      :operation="operationStore.menuList[o]"/>
    </n-card>
  </div>

  <OperationConfig/>
</template>

<style scoped lang="less">
:deep(.n-menu) {
  &-item {
    height: 24px;

    &-content {
      padding: 0 !important;
    }
  }
}
</style>