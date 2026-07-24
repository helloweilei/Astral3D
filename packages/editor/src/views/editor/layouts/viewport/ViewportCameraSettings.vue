<template>
  <div class="viewport-camera-settings p-3 w-80">
    <n-h4>{{ t("core.editor.Camera Settings") }}</n-h4>
    <n-form :label-width="72" size="small" label-align="left">
      <n-form-item :label="t('layout.sider.object.name')">
        <n-input v-model:value="form.name" size="small" @update:value="updateName" />
      </n-form-item>

      <n-form-item :label="t('layout.viewport.projection')">
        <n-radio-group v-model:value="form.projection" size="small" @update:value="updateProjection">
          <n-radio value="perspective">{{ t("layout.header.PerspectiveCamera") }}</n-radio>
          <n-radio value="orthographic">{{ t("layout.header.OrthographicCamera") }}</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item :label="t('layout.sider.object.position')">
        <div class="flex gap-1">
          <EsInputNumber v-model:value="form.position.x" size="tiny" :show-button="false" :decimal="3" :step="0.1"
            @change="updatePosition" />
          <EsInputNumber v-model:value="form.position.y" size="tiny" :show-button="false" :decimal="3" :step="0.1"
            @change="updatePosition" />
          <EsInputNumber v-model:value="form.position.z" size="tiny" :show-button="false" :decimal="3" :step="0.1"
            @change="updatePosition" />
        </div>
      </n-form-item>

      <n-form-item :label="t('layout.sider.object.rotation')">
        <div class="flex gap-1">
          <EsInputNumber v-model:value="form.rotation.x" size="tiny" :show-button="false" :decimal="2" :step="1"
            unit="°" @change="updateRotation" />
          <EsInputNumber v-model:value="form.rotation.y" size="tiny" :show-button="false" :decimal="2" :step="1"
            unit="°" @change="updateRotation" />
          <EsInputNumber v-model:value="form.rotation.z" size="tiny" :show-button="false" :decimal="2" :step="1"
            unit="°" @change="updateRotation" />
        </div>
      </n-form-item>

      <n-form-item v-if="form.projection === 'perspective'" :label="t('layout.sider.object.fov')">
        <EsInputNumber v-model:value="form.fov" size="tiny" :show-button="false" :decimal="2" :min="1" :max="179"
          @change="updateFov" />
      </n-form-item>

      <template v-if="form.projection === 'orthographic'">
        <n-form-item :label="t('layout.sider.object.left')">
          <EsInputNumber v-model:value="form.left" size="tiny" :show-button="false" @change="updateOrtho('left')" />
        </n-form-item>
        <n-form-item :label="t('layout.sider.object.right')">
          <EsInputNumber v-model:value="form.right" size="tiny" :show-button="false" @change="updateOrtho('right')" />
        </n-form-item>
        <n-form-item :label="t('layout.sider.object.top')">
          <EsInputNumber v-model:value="form.top" size="tiny" :show-button="false" @change="updateOrtho('top')" />
        </n-form-item>
        <n-form-item :label="t('layout.sider.object.bottom')">
          <EsInputNumber v-model:value="form.bottom" size="tiny" :show-button="false" @change="updateOrtho('bottom')" />
        </n-form-item>
      </template>

      <n-form-item :label="t('layout.sider.object.near')">
        <EsInputNumber v-model:value="form.near" size="tiny" :show-button="false" :decimal="3" :min="0.001"
          @change="updateNearFar('near')" />
      </n-form-item>
      <n-form-item :label="t('layout.sider.object.far')">
        <EsInputNumber v-model:value="form.far" size="tiny" :show-button="false" :decimal="2" :min="1"
          @change="updateNearFar('far')" />
      </n-form-item>

      <n-form-item :label="t('layout.viewport.navigationMode')">
        <n-radio-group v-model:value="form.navigationMode" size="small" @update:value="updateNavigationMode">
          <n-radio value="orbit">{{ t("layout.viewport.orbitNavigation") }}</n-radio>
          <n-radio value="roam">{{ t("layout.viewport.roamNavigation") }}</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item v-if="form.navigationMode === 'roam'" :label="t('layout.viewport.roamMoveSpeed')">
        <EsInputNumber v-model:value="form.roamMoveSpeed" size="tiny" :show-button="false" :decimal="0" :min="1"
          :max="1000" @change="updateRoamMoveSpeed" />
      </n-form-item>

      <n-form-item v-if="form.navigationMode === 'roam'" :label="t('setting.shortcuts.Roam Toggle')">
        <span class="text-xs text-gray-400">ALT + {{ roamToggleKey.toUpperCase() }}</span>
      </n-form-item>
      <n-form-item v-if="form.navigationMode === 'roam'" :label="t('layout.viewport.roamControls')">
        <span class="text-xs text-gray-400">{{ t("layout.viewport.roamControlsHint") }}</span>
      </n-form-item>
    </n-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, computed, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
import { App, Hooks, SetValueCommand, Utils } from "@astral3d/engine";
import EsInputNumber from "@/components/es/EsInputNumber.vue";
import { t } from "@/language";

const emit = defineEmits<{
  updated: [];
}>();

const DEFAULT_FOV = 45;
const DEFAULT_NEAR = 0.01;
const DEFAULT_FAR = 100 * 1000;

const form = reactive({
  name: "",
  projection: "perspective" as "perspective" | "orthographic",
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  fov: DEFAULT_FOV,
  left: -1,
  right: 1,
  top: 1,
  bottom: -1,
  near: DEFAULT_NEAR,
  far: DEFAULT_FAR,
  navigationMode: "orbit" as "orbit" | "roam",
  roamMoveSpeed: 20,
});

const roamToggleKey = computed(() => App.config.getShortcutItem("roamToggle") || "m");

let syncing = false;

function getAspect() {
  if (!window.viewer?.container) return 1;
  return window.viewer.container.offsetWidth / window.viewer.container.offsetHeight || 1;
}

function replaceEditorCamera(newCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
  const oldCamera = App.camera;

  newCamera.uuid = oldCamera.uuid;
  newCamera.name = oldCamera.name;
  newCamera.position.copy(oldCamera.position);
  newCamera.rotation.copy(oldCamera.rotation);
  newCamera.quaternion.copy(oldCamera.quaternion);
  newCamera.up.copy(oldCamera.up);
  newCamera.near = oldCamera.near;
  newCamera.far = oldCamera.far;

  delete App.cameras[oldCamera.uuid];
  App.cameras[newCamera.uuid] = newCamera;
  App.camera = newCamera;

  if (window.viewer) {
    window.viewer.camera = newCamera;
    window.viewer.modules.controls.camera = newCamera;
    window.viewer.updateAspectRatio();
    window.viewer.render();
  }

  if (App.viewportCamera === oldCamera) {
    App.setViewportCamera(newCamera.uuid);
  }
}

function syncNavigationSettings() {
  if (window.viewer?.modules?.cameraManage) {
    form.navigationMode = window.viewer.modules.cameraManage.getNavigationMode();
    form.roamMoveSpeed = window.viewer.modules.cameraManage.getRoamMoveSpeed();
    return;
  }

  form.navigationMode = App.config.getKey("camera.navigationMode") ?? "orbit";
  form.roamMoveSpeed = App.config.getKey("camera.roamMoveSpeed") ?? 20;
}

function syncFromCamera() {
  if (!App.camera) return;

  syncing = true;
  const camera = App.camera;

  form.name = camera.name;
  form.projection = camera.isOrthographicCamera ? "orthographic" : "perspective";
  form.position.x = Number(camera.position.x.toFixed(3));
  form.position.y = Number(camera.position.y.toFixed(3));
  form.position.z = Number(camera.position.z.toFixed(3));
  form.rotation.x = Number((camera.rotation.x * THREE.MathUtils.RAD2DEG).toFixed(2));
  form.rotation.y = Number((camera.rotation.y * THREE.MathUtils.RAD2DEG).toFixed(2));
  form.rotation.z = Number((camera.rotation.z * THREE.MathUtils.RAD2DEG).toFixed(2));
  form.near = camera.near;
  form.far = camera.far;

  if (camera.isPerspectiveCamera) {
    form.fov = camera.fov;
  }

  if (camera.isOrthographicCamera) {
    form.left = camera.left;
    form.right = camera.right;
    form.top = camera.top;
    form.bottom = camera.bottom;
  }

  syncing = false;
}

const syncFromCameraThrottled = Utils.throttle(syncFromCamera, 100);

function notifyUpdated() {
  emit("updated");
  Hooks.useDispatchSignal("objectChanged", App.camera);
  window.viewer?.render();
}

function updateName(value: string) {
  if (syncing) return;
  App.execute(new SetValueCommand(App.camera, "name", value));
  notifyUpdated();
}

function updateProjection(value: "perspective" | "orthographic") {
  if (syncing) return;

  const camera = App.camera;
  const aspect = getAspect();

  if (value === "perspective" && camera.isPerspectiveCamera) return;
  if (value === "orthographic" && camera.isOrthographicCamera) return;

  if (value === "perspective") {
    const nextCamera = new THREE.PerspectiveCamera(DEFAULT_FOV, aspect, camera.near, camera.far);
    nextCamera.fov = form.fov || DEFAULT_FOV;
    replaceEditorCamera(nextCamera);
  } else {
    const nextCamera = new THREE.OrthographicCamera(-aspect, aspect, aspect, -aspect, camera.near, camera.far);
    nextCamera.left = form.left;
    nextCamera.right = form.right;
    nextCamera.top = form.top;
    nextCamera.bottom = form.bottom;
    replaceEditorCamera(nextCamera);
  }

  syncFromCamera();
  notifyUpdated();
}

function updatePosition() {
  if (syncing || !window.viewer) return;

  const controls = window.viewer.modules.controls;
  const target = new THREE.Vector3();
  controls.getTarget(target);
  controls.setLookAt(form.position.x, form.position.y, form.position.z, target.x, target.y, target.z, false);
  notifyUpdated();
}

function updateRotation() {
  if (syncing || !window.viewer) return;

  const controls = window.viewer.modules.controls;
  const position = App.camera.position.clone();
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(form.rotation.x),
    THREE.MathUtils.degToRad(form.rotation.y),
    THREE.MathUtils.degToRad(form.rotation.z)
  );
  const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler);
  const target = position.clone().add(direction);

  controls.setLookAt(position.x, position.y, position.z, target.x, target.y, target.z, false);
  App.camera.rotation.set(euler.x, euler.y, euler.z);
  notifyUpdated();
}

function updateFov() {
  if (syncing || !App.camera.isPerspectiveCamera) return;
  if (Math.abs(App.camera.fov - form.fov) < 0.01) return;

  App.execute(new SetValueCommand(App.camera, "fov", form.fov));
  App.camera.updateProjectionMatrix();
  notifyUpdated();
}

function updateOrtho(key: "left" | "right" | "top" | "bottom") {
  if (syncing || !App.camera.isOrthographicCamera) return;
  if (Math.abs(App.camera[key] - form[key]) < 0.001) return;

  App.execute(new SetValueCommand(App.camera, key, form[key]));
  App.camera.updateProjectionMatrix();
  notifyUpdated();
}

function updateNearFar(key: "near" | "far") {
  if (syncing) return;
  if (Math.abs(App.camera[key] - form[key]) < 0.001) return;

  App.execute(new SetValueCommand(App.camera, key, form[key]));
  App.camera.updateProjectionMatrix();
  notifyUpdated();
}

function updateNavigationMode(value: "orbit" | "roam") {
  if (syncing || !window.viewer) return;

  window.viewer.modules.cameraManage.setNavigationMode(value);
  App.config.setKey("camera.navigationMode", value);
  window.viewer.render();
}

function updateRoamMoveSpeed() {
  if (syncing || !window.viewer) return;

  window.viewer.modules.cameraManage.setRoamMoveSpeed(form.roamMoveSpeed);
  App.config.setKey("camera.roamMoveSpeed", form.roamMoveSpeed);
  notifyUpdated();
}

function handleCameraChanged() {
  if (App.viewportCamera !== App.camera) return;
  syncFromCameraThrottled();
}

function handleObjectChanged(object: THREE.Object3D) {
  if (object !== App.camera) return;
  syncFromCameraThrottled();
}

onMounted(() => {
  syncFromCamera();
  syncNavigationSettings();
  Hooks.useAddSignal("cameraChanged", handleCameraChanged);
  Hooks.useAddSignal("viewportCameraChanged", syncFromCamera);
  Hooks.useAddSignal("objectChanged", handleObjectChanged);
});

onBeforeUnmount(() => {
  Hooks.useRemoveSignal("cameraChanged", handleCameraChanged);
  Hooks.useRemoveSignal("viewportCameraChanged", syncFromCamera);
  Hooks.useRemoveSignal("objectChanged", handleObjectChanged);
});
</script>
