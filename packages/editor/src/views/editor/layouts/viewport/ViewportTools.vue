<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useThemeVars } from "naive-ui";
import { CloseOutline, RefreshOutline } from "@vicons/ionicons5";
import { Ruler } from "@vicons/carbon";
import { App, Hooks } from "@astral3d/engine";
import { t } from "@/language";
import {
	DistanceMeasureTool,
	type DistanceMeasureState,
	type MeasurePointInfo,
} from "@/utils/viewport/DistanceMeasureTool";

type ToolId = "distance";

const themeVars = useThemeVars();
const popupStyle = computed(() => ({
	backgroundColor: themeVars.value.popoverColor || themeVars.value.cardColor,
	color: themeVars.value.textColor1,
	borderColor: themeVars.value.borderColor,
}));
const iconColor = computed(() => themeVars.value.primaryColor);

/** 仅地形开启时显示工具栏 */
const terrainEnabled = ref(false);

const activeTool = ref<ToolId | null>(null);
const measureState = ref<DistanceMeasureState>({
	point1: null,
	point2: null,
	distance: null,
});

const measureTool = new DistanceMeasureTool();

const showMeasurePopup = computed(() => terrainEnabled.value && activeTool.value === "distance");

function syncTerrainVisible() {
	terrainEnabled.value = !!App.project.getKey("terrain.enabled");
}

function formatPoint(point: MeasurePointInfo | null) {
	if (!point) return "-";
	if (point.longitude !== undefined && point.latitude !== undefined) {
		return `${point.longitude}, ${point.latitude}, ${point.height ?? point.y}`;
	}
	return `${point.x}, ${point.y}, ${point.z}`;
}

function formatDistance(distance: number | null) {
	if (distance === null) return "-";
	return `${distance.toFixed(2)} m`;
}

function openDistance() {
	if (activeTool.value === "distance") return;

	if (activeTool.value) {
		closeActiveTool();
	}

	activeTool.value = "distance";
	measureTool.open(state => {
		measureState.value = { ...state };
	});
}

function resetMeasure() {
	measureTool.reset();
}

function closeMeasure() {
	measureTool.close();
	measureState.value = { point1: null, point2: null, distance: null };
	if (activeTool.value === "distance") {
		activeTool.value = null;
	}
}

function closeActiveTool() {
	if (activeTool.value === "distance") {
		closeMeasure();
	}
}

function onToolClick(id: ToolId) {
	if (activeTool.value === id) return;
	if (id === "distance") {
		openDistance();
	}
}

watch(terrainEnabled, enabled => {
	if (!enabled) closeActiveTool();
});

onMounted(() => {
	syncTerrainVisible();
	Hooks.useAddSignal("sceneTerrainSettingsChanged", syncTerrainVisible);
});

onBeforeUnmount(() => {
	Hooks.useRemoveSignal("sceneTerrainSettingsChanged", syncTerrainVisible);
	measureTool.dispose();
});
</script>

<template>
	<div v-if="terrainEnabled" class="viewport-tools">
		<!-- 测距 popup：常规面板风格，仅手动关闭 -->
		<div v-if="showMeasurePopup" class="viewport-tools__popup" :style="popupStyle" @pointerdown.stop @click.stop>
			<div class="viewport-tools__popup-header">
				<span>{{ t("layout.scene.tools.Distance") }}</span>
				<n-button quaternary circle size="tiny" :title="t('layout.scene.tools.Close')"
					@click.stop="closeMeasure">
					<template #icon>
						<n-icon :size="12">
							<CloseOutline />
						</n-icon>
					</template>
				</n-button>
			</div>

			<div class="viewport-tools__popup-body">
				<div class="viewport-tools__row">
					<span class="viewport-tools__label">{{ t("layout.scene.tools['Point 1']") }}</span>
					<span class="viewport-tools__value">{{ formatPoint(measureState.point1) }}</span>
				</div>
				<div class="viewport-tools__row">
					<span class="viewport-tools__label">{{ t("layout.scene.tools['Point 2']") }}</span>
					<span class="viewport-tools__value">{{ formatPoint(measureState.point2) }}</span>
				</div>
				<div class="viewport-tools__row">
					<span class="viewport-tools__label">{{ t("layout.scene.tools.Distance") }}</span>
					<span class="viewport-tools__value viewport-tools__value--accent" :style="{ color: iconColor }">
						{{ formatDistance(measureState.distance) }}
					</span>
				</div>
			</div>

			<div class="viewport-tools__popup-footer">
				<n-button size="tiny" :disabled="!measureState.point1" @click.stop="resetMeasure">
					<template #icon>
						<n-icon>
							<RefreshOutline />
						</n-icon>
					</template>
					{{ t("layout.scene.tools.Reset") }}
				</n-button>
				<span class="viewport-tools__hint">{{ t("layout.scene.tools['Click map to pick']") }}</span>
			</div>
		</div>

		<!-- 工具图标：与顶部圆钮同风格，仅图标着色为主题色 -->
		<div class="viewport-tools__rail" @pointerdown.stop @click.stop>
			<n-tooltip placement="left" trigger="hover">
				<template #trigger>
					<n-button circle size="tiny" class="viewport-tools__btn"
						:class="{ 'is-active': activeTool === 'distance' }" @click.stop="onToolClick('distance')">
						<template #icon>
							<n-icon :size="10" :color="iconColor">
								<Ruler />
							</n-icon>
						</template>
					</n-button>
				</template>
				{{ t("layout.scene.tools.Distance") }}
			</n-tooltip>
		</div>
	</div>
</template>

<style scoped lang="less">
.viewport-tools {
	position: relative;
	pointer-events: none;
}

.viewport-tools__rail {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 3px;
	padding: 3px;
	pointer-events: auto;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(0, 0, 0, 0.06);
	backdrop-filter: blur(4px);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.viewport-tools__btn {
	/* 相对原先 26px / 间距 6px 整体缩小约一倍 */
	--n-width: 14px !important;
	--n-height: 14px !important;
	--n-font-size: 10px !important;
	--n-icon-size: 10px !important;
	padding: 0 !important;

	&.is-active {
		--n-border: 1px solid v-bind(iconColor) !important;
		--n-border-hover: 1px solid v-bind(iconColor) !important;
		--n-border-pressed: 1px solid v-bind(iconColor) !important;
		--n-border-focus: 1px solid v-bind(iconColor) !important;
	}
}

.viewport-tools__popup {
	position: absolute;
	top: 0;
	right: calc(100% + 4px);
	width: 248px;
	pointer-events: auto;
	border-radius: 8px;
	border: 1px solid;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	overflow: hidden;
}

.viewport-tools__popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 8px 6px 10px;
	border-bottom: 1px solid var(--n-divider-color, rgba(0, 0, 0, 0.09));
	font-size: 12px;
	font-weight: 600;
}

.viewport-tools__popup-body {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 10px;
}

.viewport-tools__row {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.viewport-tools__label {
	font-size: 11px;
	opacity: 0.55;
}

.viewport-tools__value {
	font-size: 12px;
	line-height: 1.4;
	word-break: break-all;
	font-variant-numeric: tabular-nums;

	&--accent {
		font-weight: 600;
		font-size: 13px;
	}
}

.viewport-tools__popup-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 8px 10px 10px;
	border-top: 1px solid var(--n-divider-color, rgba(0, 0, 0, 0.09));
}

.viewport-tools__hint {
	font-size: 11px;
	opacity: 0.5;
}
</style>
