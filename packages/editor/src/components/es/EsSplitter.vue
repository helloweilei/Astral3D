<template>
  <div
    ref="containerRef"
    class="es-splitter"
    :class="[`es-splitter--${direction}`, { 'es-splitter--resizing': isResizing }]"
  >
    <div class="es-splitter__pane es-splitter__pane--first" :style="firstPaneStyle">
      <slot name="first" />
    </div>

    <div
      class="es-splitter__separator"
      role="separator"
      :aria-orientation="direction === 'vertical' ? 'horizontal' : 'vertical'"
      :style="separatorStyle"
      @mousedown="startResize"
    />

    <div class="es-splitter__pane es-splitter__pane--second" :style="secondPaneStyle">
      <slot name="second" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = withDefaults(
  defineProps<{
    /** vertical: 上下分割；horizontal: 左右分割 */
    direction?: "vertical" | "horizontal";
    /** 第一块区域默认占比，0~1 */
    defaultRatio?: number;
    /** 两侧面板最小尺寸（px） */
    minSize?: number;
    /** 分割条厚度（px） */
    separatorSize?: number;
  }>(),
  {
    direction: "vertical",
    defaultRatio: 2 / 3,
    minSize: 120,
    separatorSize: 3,
  }
);

const containerRef = ref<HTMLElement>();
const containerSize = ref(0);
const firstRatio = ref(props.defaultRatio);
const isResizing = ref(false);

const isVertical = computed(() => props.direction === "vertical");

const availableSize = computed(() => Math.max(0, containerSize.value - props.separatorSize));

const firstSize = computed(() => {
  const available = availableSize.value;
  if (available <= props.minSize * 2) {
    return Math.max(0, available / 2);
  }

  const size = available * firstRatio.value;
  return Math.max(props.minSize, Math.min(available - props.minSize, size));
});

const secondSize = computed(() => Math.max(0, availableSize.value - firstSize.value));

const firstPaneStyle = computed(() =>
  isVertical.value ? { height: `${firstSize.value}px` } : { width: `${firstSize.value}px` }
);

const secondPaneStyle = computed(() =>
  isVertical.value ? { height: `${secondSize.value}px` } : { width: `${secondSize.value}px` }
);

const separatorStyle = computed(() =>
  isVertical.value
    ? { height: `${props.separatorSize}px` }
    : { width: `${props.separatorSize}px` }
);

function updateContainerSize() {
  if (!containerRef.value) {
    containerSize.value = 0;
    return;
  }

  containerSize.value = isVertical.value
    ? containerRef.value.clientHeight
    : containerRef.value.clientWidth;
}

function startResize(event: MouseEvent) {
  event.preventDefault();

  isResizing.value = true;
  document.body.style.cursor = isVertical.value ? "row-resize" : "col-resize";
  document.body.style.userSelect = "none";
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
}

function onResize(event: MouseEvent) {
  if (!isResizing.value || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const available = Math.max(
    (isVertical.value ? rect.height : rect.width) - props.separatorSize,
    props.minSize * 2
  );
  const nextFirstSize = isVertical.value
    ? event.clientY - rect.top
    : event.clientX - rect.left;
  const clampedFirstSize = Math.max(
    props.minSize,
    Math.min(available - props.minSize, nextFirstSize)
  );

  firstRatio.value = clampedFirstSize / available;
}

function stopResize() {
  isResizing.value = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  updateContainerSize();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  stopResize();
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped lang="less">
.es-splitter {
  --es-splitter-hover-color: #35a1c4;
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &--vertical {
    flex-direction: column;
  }

  &--horizontal {
    flex-direction: row;
  }

  &__pane {
    flex-shrink: 0;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  &__separator {
    flex-shrink: 0;
    background: var(--n-border-color);
    transition: background-color 0.2s;

    &:hover,
    &:active {
      background: var(--es-splitter-hover-color);
    }
  }

  &--vertical > .es-splitter__separator {
    width: 100%;
    cursor: row-resize;
  }

  &--horizontal > .es-splitter__separator {
    height: 100%;
    cursor: col-resize;
  }

  &--resizing > .es-splitter__separator {
    background: var(--es-splitter-hover-color);
  }
}
</style>
