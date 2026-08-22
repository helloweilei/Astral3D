<template>
  <div class="extra-pane-item">
    <div class="extra-pane-item-header">
      <div class="flex items-center gap-2 flex-wrap">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button size="tiny" ghost :disabled="isDayNightSelected" @click="handleAddDayNightPreset">
              <template #icon>
                <n-icon>
                  <Sunny />
                </n-icon>
              </template>
              {{ t("extra.Day-night cycle preset") }}
            </n-button>
          </template>
          {{ t("extra.Day-night cycle added") }}
        </n-tooltip>

        <template v-if="isDayNightSelected">
          <span class="text-xs whitespace-nowrap opacity-80">{{ t("extra.Day-night sun distance") }}</span>
          <n-input-number v-model:value="sunDistance" size="tiny" :min="10" :max="5000" :step="10" class="!w-90px"
            @update:value="handleSunDistanceChange" />
          <span class="text-xs whitespace-nowrap opacity-80">{{ t("extra.Day-night sun size") }}</span>
          <n-input-number v-model:value="sunSize" size="tiny" :min="0.5" :max="200" :step="0.5" class="!w-80px"
            @update:value="handleSunSizeChange" />
        </template>
      </div>

      <n-button-group size="tiny">
        <!-- 跳转至开始 -->
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button ghost @click="animationStore.jumpToStart()">
              <template #icon>
                <n-icon>
                  <SkipBackFilled />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t("extra.Jump to first frame") }}
        </n-tooltip>

        <!-- 播放 -->
        <n-tooltip trigger="hover" v-if="!animationStore.current?.isRunning">
          <template #trigger>
            <n-button ghost @click="animationStore.play">
              <template #icon>
                <n-icon>
                  <PlayFilledAlt />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t("layout.sider.animation.Play") }}
        </n-tooltip>

        <template v-else>
          <!-- 暂停 -->
          <n-tooltip trigger="hover" v-if="!animationStore.current?.isPaused">
            <template #trigger>
              <n-button ghost @click="animationStore.pause">
                <template #icon>
                  <n-icon>
                    <PauseFilled />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ t("layout.sider.animation.Pause") }}
          </n-tooltip>

          <!-- 继续 -->
          <n-tooltip trigger="hover" v-else>
            <template #trigger>
              <n-button ghost @click="animationStore.pause">
                <template #icon>
                  <n-icon>
                    <ContinueFilled />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ t("layout.sider.animation.Continue") }}
          </n-tooltip>

          <!-- 停止 -->
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button ghost @click="handleStop">
                <template #icon>
                  <n-icon>
                    <StopFilledAlt />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ t("layout.sider.animation.Stop") }}
          </n-tooltip>
        </template>

        <!-- 跳转至结束 -->
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button @click="animationStore.jumpToEnd()">
              <template #icon>
                <n-icon>
                  <SkipForwardFilled />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t("extra.Jump to last frame") }}
        </n-tooltip>
      </n-button-group>

      <div class="flex">
        <n-text type="success"> {{ animationStore.getFormattedCurrentTime }}</n-text>
        <span>&nbsp;/&nbsp;</span>
        <n-text> {{ animationStore.getFormattedDuration }}</n-text>
      </div>
    </div>

    <div class="extra-pane-item-content">
      <Animation v-show="isSelectObject3D" :isSelectObject3D="isSelectObject3D" />

      <n-result v-show="!isSelectObject3D" status="418" title="Empty" class="h-full flex-center flex-col"
        :description="t('prompt[\'No object selected.\']')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, h, nextTick } from 'vue';
import {
  SkipBackFilled,
  PlayFilledAlt,
  PauseFilled,
  ContinueFilled,
  StopFilledAlt,
  SkipForwardFilled,
  Sunny,
} from '@vicons/carbon';
import { NInputNumber } from 'naive-ui';
import { t } from "@/language";
import {
  App,
  Hooks,
  Timeline,
  AddObjectCommand,
  buildDayNightCyclePreset,
  setDayNightCycleRadius,
  setDayNightCycleSunSize,
  resolveAnimationRoot,
} from '@astral3d/engine';
import { IAnimationItem, useAnimationStore } from "@/store/modules/animation";
import Animation from './Animation.vue';

const animationStore = useAnimationStore();

const DEFAULT_RADIUS = 200;
const DEFAULT_SUN_SIZE = 8;

const isSelectObject3D = ref(false);
const isDayNightSelected = ref(false);
const sunDistance = ref(DEFAULT_RADIUS);
const sunSize = ref(DEFAULT_SUN_SIZE);

function findDayNightRoot(object: any) {
  if (!object) return null;
  if (object.userData?.isDayNightCycle) return object;
  const r = resolveAnimationRoot(object);
  return r?.userData?.isDayNightCycle ? r : null;
}

function syncDayNightSelection(object: any) {
  const animRoot = resolveAnimationRoot(object);
  isSelectObject3D.value = !!object;

  const root = findDayNightRoot(object);
  isDayNightSelected.value = !!root;
  if (root) {
    sunDistance.value = Number(root.userData.dayNightRadius) || DEFAULT_RADIUS;
    sunSize.value = Number(root.userData.dayNightSunSize) || DEFAULT_SUN_SIZE;
  }

  // 选中子节点时仍绑定根上的动画列表
  if (animRoot && animRoot.animations?.length) {
    const list = animRoot.animations
      .map((animation: any) => {
        if (!animation) return null;
        const clip = typeof animation.getClip === "function" ? animation.getClip() : animation;
        if (!clip?.uuid) return null;
        const isAction = typeof animation.isRunning === "function";
        return {
          name: clip.name,
          uuid: clip.uuid,
          isRunning: isAction ? animation.isRunning() : false,
          isPaused: isAction ? !!animation.paused : false,
        };
      })
      .filter(Boolean);

    if (list.length) {
      const keepCurrent = list.find((i: any) => i.uuid === animationStore.current?.uuid);
      animationStore.setList(list as IAnimationItem[], keepCurrent || list[0]);
    }
  }
}

function objectSelected(object) {
  syncDayNightSelection(object);
}

function handleSunDistanceChange(value: number | null) {
  const root = findDayNightRoot(App.selected);
  if (!root || value == null) return;
  setDayNightCycleRadius(root, value);
  sunDistance.value = value;
}

function handleSunSizeChange(value: number | null) {
  const root = findDayNightRoot(App.selected);
  if (!root || value == null) return;
  setDayNightCycleSunSize(root, value);
  sunSize.value = value;
}

function handleStop() {
  animationStore.stop();
}

function handleAddDayNightPreset() {
  const radius = ref(DEFAULT_RADIUS);
  const size = ref(DEFAULT_SUN_SIZE);

  window.$dialog.info({
    title: t("extra.Day-night cycle preset"),
    content: () => h("div", { class: "flex flex-col gap-2" }, [
      h("div", { class: "text-sm opacity-80" }, t("extra.Day-night sun distance hint")),
      h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "whitespace-nowrap" }, t("extra.Day-night sun distance")),
        h(NInputNumber, {
          value: radius.value,
          min: 10,
          max: 5000,
          step: 10,
          size: "small",
          class: "!w-140px",
          "onUpdate:value": (v: number | null) => {
            radius.value = v ?? DEFAULT_RADIUS;
          },
        }),
      ]),
      h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "whitespace-nowrap" }, t("extra.Day-night sun size")),
        h(NInputNumber, {
          value: size.value,
          min: 0.5,
          max: 200,
          step: 0.5,
          size: "small",
          class: "!w-140px",
          "onUpdate:value": (v: number | null) => {
            size.value = v ?? DEFAULT_SUN_SIZE;
          },
        }),
      ]),
    ]),
    positiveText: t("other.Ok"),
    negativeText: t("other.Cancel"),
    onPositiveClick: () => {
      try {
        const preset = buildDayNightCyclePreset({
          radius: radius.value,
          sunSize: size.value,
          duration: 48,
        });

        App.execute(new AddObjectCommand(preset.root));
        preset.sunMesh.castShadow = false;
        preset.sunMesh.receiveShadow = false;
        App.removeHelper(preset.sunLight);

        App.select(preset.root);

        nextTick(() => {
          const clip = preset.action.getClip();
          const item = {
            name: clip.name,
            uuid: clip.uuid,
            isRunning: preset.action.isRunning(),
            isPaused: preset.action.paused,
          };
          animationStore.setList([item], item);
          sunDistance.value = radius.value;
          sunSize.value = size.value;
        });

        window.$message?.success(t("extra.Day-night cycle added"));
      } catch (e) {
        console.error(e);
        window.$message?.error(t("prompt.Failed to create animation"));
        return false;
      }
    },
  });
}

function timelineTimeChanged(args: Timeline.TimelineTimeChangedEvent) {
  animationStore.currentTime = args.val;
}

function timelineRowChanged() {
  animationStore.setCurrent(animationStore.current);
}

onMounted(() => {
  syncDayNightSelection(App.selected);
  Hooks.useAddSignal("objectSelected", objectSelected);
  Hooks.useAddSignal("timelineTimeChanged", timelineTimeChanged);
  Hooks.useAddSignal("timelineRowChanged", timelineRowChanged);
})
onBeforeUnmount(() => {
  Hooks.useRemoveSignal("objectSelected", objectSelected);
  Hooks.useRemoveSignal("timelineTimeChanged", timelineTimeChanged);
  Hooks.useRemoveSignal("timelineRowChanged", timelineRowChanged);
})
</script>

<style lang="less" scoped>
.extra-pane-item-header {
  padding-left: 0;
  justify-content: space-between !important;
}

.extra-pane-item-content {
  overflow-y: hidden;
}
</style>
