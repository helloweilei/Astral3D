<template>
  <n-popover :show-arrow="false" placement="bottom-start" trigger="click" :style="{ padding: 0 }">
    <template #trigger>
      <n-button round size="small">
        <template #icon>
          <n-icon>
            <component :is="current.icon" />
          </n-icon>
        </template>
        {{ current.label }}
      </n-button>
    </template>
    <n-radio-group v-model:value="current.uuid" size="small">
      <template v-for="song in options" :key="song.uuid">
        <n-radio :value="song.uuid" v-if="song.type !== 'divider'" @click="handlerChange(song)">
          <div class="camera-option">
            <div class="camera-option__main">
              <n-icon class="ml-10px mr-5px">
                <component :is="song.icon" />
              </n-icon>
              <span>{{ song.label }}</span>
            </div>
            <div class="camera-option__actions">
              <n-popover v-if="song.showSettings" trigger="click" placement="right-start" :show-arrow="false"
                :style="{ padding: 0 }">
                <template #trigger>
                  <n-button quaternary circle size="tiny" @click.stop>
                    <template #icon>
                      <n-icon size="14">
                        <Settings />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                <ViewportCameraSettings @updated="handleSettingsUpdated" />
              </n-popover>
              <span v-if="song.shortcuts">{{ song.shortcuts }}</span>
            </div>
          </div>
        </n-radio>
        <n-divider title-placement="left" v-else> {{ song.label }}</n-divider>
      </template>
      <template v-for="song in sceneCamera" :key="song.uuid">
        <n-radio :value="song.uuid" v-if="song.type !== 'divider'" @click="handlerChange(song)">
          <div class="camera-option">
            <div class="camera-option__main">
              <n-icon class="ml-10px mr-5px">
                <component :is="song.icon" />
              </n-icon>
              <span>{{ song.label }}</span>
            </div>
            <span v-if="song.shortcuts">{{ song.shortcuts }}</span>
          </div>
        </n-radio>
        <n-divider title-placement="left" v-else> {{ song.label }}</n-divider>
      </template>
    </n-radio-group>
  </n-popover>
</template>

<script lang="ts" setup>
import type { ComputedRef } from "vue";
import { ref, markRaw, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
import { App, Hooks, SetValueCommand } from "@astral3d/engine";
import { Carbon3DMprToggle, CenterToFit, Settings } from "@vicons/carbon";
import { t } from "@/language";
import ViewportCameraSettings from "./ViewportCameraSettings.vue";

const CUSTOM_CAMERA_UUID = "__custom_camera__";
const DEFAULT_CAMERA_POSITION = { x: 10, y: 5, z: 10 };
const DEFAULT_CAMERA_TARGET = { x: 0, y: 0, z: 0 };
const DEFAULT_CAMERA_FOV = 45;
const DEFAULT_CAMERA_NEAR = 0.01;
const DEFAULT_CAMERA_FAR = 100 * 1000;

interface IOption {
  label: ComputedRef<string> | string;
  uuid: string;
  type?: string;
  icon?: any;
  shortcuts?: string;
  showSettings?: boolean;
  mode?: "default" | "custom" | "scene";
}

const current = ref<IOption>({
  label: "",
  uuid: "",
});
const options = ref<IOption[]>([]);
const sceneCamera = ref<IOption[]>([]);
const currentMode = ref<"default" | "custom" | "scene">("default");

function resetDefaultCamera() {
  if (!window.viewer) return;

  const aspect = window.viewer.container.offsetWidth / window.viewer.container.offsetHeight || 1;

  if (!App.camera.isPerspectiveCamera) {
    const nextCamera = new THREE.PerspectiveCamera(DEFAULT_CAMERA_FOV, aspect, DEFAULT_CAMERA_NEAR, DEFAULT_CAMERA_FAR);
    nextCamera.name = t("core.editor.Default Camera");
    replaceEditorCamera(nextCamera);
  } else {
    App.execute(new SetValueCommand(App.camera, "name", t("core.editor.Default Camera")));
    App.execute(new SetValueCommand(App.camera, "fov", DEFAULT_CAMERA_FOV));
    App.execute(new SetValueCommand(App.camera, "near", DEFAULT_CAMERA_NEAR));
    App.execute(new SetValueCommand(App.camera, "far", DEFAULT_CAMERA_FAR));
    App.camera.updateProjectionMatrix();
  }

  window.viewer.modules.controls.setLookAt(
    DEFAULT_CAMERA_POSITION.x,
    DEFAULT_CAMERA_POSITION.y,
    DEFAULT_CAMERA_POSITION.z,
    DEFAULT_CAMERA_TARGET.x,
    DEFAULT_CAMERA_TARGET.y,
    DEFAULT_CAMERA_TARGET.z,
    true
  );
  window.viewer.render();
}

function replaceEditorCamera(newCamera: THREE.PerspectiveCamera) {
  const oldCamera = App.camera;

  newCamera.uuid = oldCamera.uuid;
  newCamera.position.copy(oldCamera.position);
  newCamera.rotation.copy(oldCamera.rotation);
  newCamera.quaternion.copy(oldCamera.quaternion);
  newCamera.up.copy(oldCamera.up);

  delete App.cameras[oldCamera.uuid];
  App.cameras[newCamera.uuid] = newCamera;
  App.camera = newCamera;
  window.viewer.camera = newCamera;
  window.viewer.modules.controls.camera = newCamera;
  window.viewer.updateAspectRatio();

  if (App.viewportCamera === oldCamera) {
    App.setViewportCamera(newCamera.uuid);
  }
}

function handlerChange(value: IOption) {
  current.value = value;

  const cameraManage = window.viewer.modules.cameraManage;

  if (value.uuid === App.camera.uuid) {
    currentMode.value = "default";
    resetDefaultCamera();
    cameraManage.resetInteract();
    App.setViewportCamera(App.camera.uuid);
    return;
  }

  if (value.uuid === CUSTOM_CAMERA_UUID) {
    currentMode.value = "custom";
    cameraManage.resetInteract();
    App.setViewportCamera(App.camera.uuid);
    current.value = {
      ...value,
      label: App.camera.name || t("core.editor.Custom Camera"),
    };
    return;
  }

  currentMode.value = "scene";
  cameraManage.resetInteract();
  App.setViewportCamera(value.uuid);
}

function handleSettingsUpdated() {
  if (currentMode.value === "custom") {
    current.value = {
      ...current.value,
      label: App.camera.name || t("core.editor.Custom Camera"),
    };
  }
  handlerOptionsUpdate(false);
}

function handlerOptionsUpdate(resetCurrent = true) {
  options.value = [];
  sceneCamera.value = [];

  const cameras = App.cameras;
  for (const key in cameras) {
    const camera = cameras[key];

    if (camera.uuid === App.camera.uuid) {
      options.value.unshift({
        uuid: App.camera.uuid,
        label: t("core.editor.Default Camera"),
        icon: markRaw(Carbon3DMprToggle),
        shortcuts: "ALT+G",
        mode: "default",
      });

      options.value.push({
        uuid: CUSTOM_CAMERA_UUID,
        label: t("core.editor.Custom Camera"),
        icon: markRaw(Carbon3DMprToggle),
        showSettings: true,
        mode: "custom",
      });
      continue;
    }

    sceneCamera.value.push({
      uuid: camera.uuid,
      label: camera.name,
      icon: camera.type === "PerspectiveCamera" ? markRaw(Carbon3DMprToggle) : markRaw(CenterToFit),
      shortcuts: "",
      mode: "scene",
    });
  }

  if (sceneCamera.value.length > 0) {
    sceneCamera.value.unshift({
      uuid: "divider2",
      type: "divider",
      label: t("layout.scene.toolbar['Scene camera']"),
    });
  }

  if (resetCurrent && !current.value.uuid) {
    current.value = options.value[0];
  } else if (currentMode.value === "custom") {
    current.value = {
      uuid: CUSTOM_CAMERA_UUID,
      label: App.camera.name || t("core.editor.Custom Camera"),
      icon: markRaw(Carbon3DMprToggle),
      showSettings: true,
      mode: "custom",
    };
  } else if (currentMode.value === "default") {
    current.value = options.value.find(item => item.mode === "default") || options.value[0];
  }
}

function objectChanged(object: THREE.Object3D) {
  if (object === App.camera || object instanceof THREE.Camera) {
    handlerOptionsUpdate(false);
    if (currentMode.value === "custom" && object === App.camera) {
      current.value = {
        ...current.value,
        label: App.camera.name || t("core.editor.Custom Camera"),
      };
    }
  }
}

onMounted(() => {
  Hooks.useAddSignal("cameraAdded", handlerOptionsUpdate);
  Hooks.useAddSignal("cameraRemoved", handlerOptionsUpdate);
  Hooks.useAddSignal("objectChanged", objectChanged);

  handlerOptionsUpdate();
});

onBeforeUnmount(() => {
  Hooks.useRemoveSignal("cameraAdded", handlerOptionsUpdate);
  Hooks.useRemoveSignal("cameraRemoved", handlerOptionsUpdate);
  Hooks.useRemoveSignal("objectChanged", objectChanged);
});
</script>

<style lang="less" scoped>
.n-radio-group {
  padding: 5px 0;

  .n-radio {
    display: flex;
    align-items: center;
    padding: 5px 10px;

    &:hover {
      background-color: var(--n-divider-color);
    }

    :deep(.n-radio__label) {
      display: flex;
      align-items: center;
      width: 220px;
    }
  }

  .camera-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .camera-option__main {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
  }

  .camera-option__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
    flex-shrink: 0;

    & > span {
      font-size: 12px;
      color: var(--n-text-color-disabled);
    }
  }

  .n-divider {
    margin: 10px 0;

    :deep(.n-divider__title) {
      font-size: 12px;
      font-weight: 400;
      color: #999;
    }
  }
}
</style>
