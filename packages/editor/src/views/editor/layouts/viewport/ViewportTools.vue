<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useThemeVars } from "naive-ui";
import { CheckmarkOutline, CloseOutline, RefreshOutline } from "@vicons/ionicons5";
import { Ruler, AreaCustom, DirectionCurve } from "@vicons/carbon";
import { App, Hooks } from "@astral3d/engine";
import { t } from "@/language";
import {
	DistanceMeasureTool,
	type DistanceMeasureState,
	type MeasurePointInfo,
} from "@/utils/viewport/DistanceMeasureTool";
import { AreaMeasureTool } from "@/utils/viewport/AreaMeasureTool";
import { AreaMeasureState } from "@/utils/viewport/measure/types";
import { PathDrawTool, type PathDrawState } from "@/utils/viewport/PathDrawTool";

type ToolId = "distance" | "area" | "path";

const themeVars = useThemeVars();
const popupStyle = computed(() => ({
	backgroundColor: themeVars.value.popoverColor || themeVars.value.cardColor,
	color: themeVars.value.textColor1,
	borderColor: themeVars.value.borderColor,
}));
const iconColor = computed(() => themeVars.value.primaryColor);

/** 测距 / 测面积仅地形开启时可用；绘制路径不依赖地形 */
const terrainEnabled = ref(false);

const activeTool = ref<ToolId | null>(null);
const measureState = ref<DistanceMeasureState | AreaMeasureState>({
	points: [],
	segments: [],
	total: null,
	picking: false,
});

const pathState = ref<PathDrawState>({
	points: [],
	length: null,
	picking: false,
	generated: false,
});
/** 流动速度（周期/秒） */
const pathSpeed = ref(0.7);

const distanceMeasureTool = new DistanceMeasureTool();
const areaMeasureTool = new AreaMeasureTool();
const pathDrawTool = new PathDrawTool();

const showDistanceMeasurePopup = computed(() => terrainEnabled.value && activeTool.value === "distance");
const showAreaMeasurePopup = computed(() => terrainEnabled.value && activeTool.value === "area");
const showPathDrawPopup = computed(() => terrainEnabled.value && activeTool.value === "path");

const canFinishDistance = computed(
	() => measureState.value.picking && measureState.value.points.length >= 2
);
const canFinishPath = computed(() => pathState.value.picking && pathState.value.points.length >= 2);

function syncTerrainVisible() {
	terrainEnabled.value = !!App.project.getKey("terrain.enabled");
}

function formatPoint(point: MeasurePointInfo) {
	if (point.longitude !== undefined && point.latitude !== undefined) {
		return `${point.longitude}, ${point.latitude}, ${point.height ?? "-"}`;
	}
	return "-";
}

function formatDistance(distance: number | null) {
	if (distance === null) return "-";
	return `${distance.toFixed(2)} m`;
}

function formatArea(area?: number | null) {
	if (area === undefined || area === null) return "-";
	return `${area.toFixed(2)} m²`;
}

function openTool(id: ToolId) {
	if (activeTool.value === id) return;

	if (activeTool.value) {
		closeTool();
	}

	activeTool.value = id;
	if (id === "distance") {
		distanceMeasureTool.open(state => {
			measureState.value = { ...state, points: [...state.points], segments: [...state.segments] };
		});
	} else if (id === "area") {
		areaMeasureTool.open(state => {
			measureState.value = { ...state, points: [...state.points], area: state.area };
		});
	} else if (id === "path") {
		pathDrawTool.setSpeed(pathSpeed.value);
		pathDrawTool.open(state => {
			pathState.value = { ...state, points: [...state.points] };
		});
	}
}

function resetTool() {
	if (activeTool.value === "distance") {
		distanceMeasureTool.reset();
	} else if (activeTool.value === "area") {
		areaMeasureTool.reset();
	} else if (activeTool.value === "path") {
		pathDrawTool.reset();
	}
}

function finishTool() {
	if (activeTool.value === "distance") {
		distanceMeasureTool.finishPicking();
	} else if (activeTool.value === "area") {
		areaMeasureTool.finishPicking();
	} else if (activeTool.value === "path") {
		pathDrawTool.finishPicking();
	}
}

function closeTool() {
	if (activeTool.value === "distance") {
		distanceMeasureTool.close();
	} else if (activeTool.value === "area") {
		areaMeasureTool.close();
	} else if (activeTool.value === "path") {
		pathDrawTool.close();
	}
	measureState.value = { points: [], segments: [], total: null, picking: false };
	pathState.value = { points: [], length: null, picking: false, generated: false };
	activeTool.value = null;
}

function onPathSpeedChange(value: number | [number, number]) {
	const speed = Array.isArray(value) ? value[0] : value;
	pathSpeed.value = speed;
	pathDrawTool.setSpeed(speed);
}

function onToolClick(id: ToolId) {
	if (activeTool.value === id) return;
	openTool(id);
}

// 地形关闭后，所有地形工具同步退出并清理视口图形
watch(terrainEnabled, enabled => {
	if (!enabled && activeTool.value) {
		closeTool();
	}
});

onMounted(() => {
	syncTerrainVisible();
	Hooks.useAddSignal("sceneTerrainSettingsChanged", syncTerrainVisible);
});

onBeforeUnmount(() => {
	Hooks.useRemoveSignal("sceneTerrainSettingsChanged", syncTerrainVisible);
	distanceMeasureTool.dispose();
	areaMeasureTool.dispose();
	pathDrawTool.dispose();
});
</script>

<template>
	<div v-if="terrainEnabled" class="viewport-tools">
		<div v-if="showDistanceMeasurePopup" class="viewport-tools__popup" :style="popupStyle" @pointerdown.stop
			@click.stop>
			<div class="viewport-tools__popup-header">
				<span>{{ t("layout.scene.tools.Distance") }}</span>
				<n-button quaternary circle size="tiny" :title="t('layout.scene.tools.Close')"
					@click.stop="closeTool">
					<template #icon>
						<n-icon :size="12">
							<CloseOutline />
						</n-icon>
					</template>
				</n-button>
			</div>

			<div class="viewport-tools__popup-body">
				<div v-if="measureState.points.length === 0" class="viewport-tools__empty">
					{{ t("layout.scene.tools['No Points']") }}
				</div>
				<div v-for="(point, index) in measureState.points" :key="index" class="viewport-tools__row">
					<span class="viewport-tools__label">
						{{ t("layout.scene.tools.Point") }} {{ index + 1 }}
						<template
							v-if="index > 0 && (measureState as DistanceMeasureState).segments[index - 1] !== undefined">
							· {{ formatDistance((measureState as DistanceMeasureState).segments[index - 1]) }}
						</template>
					</span>
					<span class="viewport-tools__value">{{ formatPoint(point) }}</span>
				</div>
				<div v-if="(measureState as DistanceMeasureState).total !== null" class="viewport-tools__row">
					<span class="viewport-tools__label">{{ t("layout.scene.tools['Total Distance']") }}</span>
					<span class="viewport-tools__value viewport-tools__value--accent" :style="{ color: iconColor }">
						{{ formatDistance((measureState as DistanceMeasureState).total) }}
					</span>
				</div>
			</div>

			<div class="viewport-tools__popup-footer">
				<div class="viewport-tools__actions">
					<n-button size="tiny" :disabled="measureState.points.length === 0" @click.stop="resetTool">
						<template #icon>
							<n-icon>
								<RefreshOutline />
							</n-icon>
						</template>
						{{ t("layout.scene.tools.Reset") }}
					</n-button>
					<n-button size="tiny" type="primary" :disabled="!canFinishDistance" @click.stop="finishTool">
						<template #icon>
							<n-icon>
								<CheckmarkOutline />
							</n-icon>
						</template>
						{{ t("layout.scene.tools.Finish") }}
					</n-button>
				</div>
				<span class="viewport-tools__hint">
					{{
						measureState.picking
							? t("layout.scene.tools['Click map to pick multi']")
							: t("layout.scene.tools['Measure finished']")
					}}
				</span>
			</div>
		</div>
		<div v-if="showAreaMeasurePopup" class="viewport-tools__popup area" :style="popupStyle" @pointerdown.stop
			@click.stop>
			<div class="viewport-tools__popup-header">
				<span>{{ t("layout.scene.tools.Area") }}</span>
				<n-button quaternary circle size="tiny" :title="t('layout.scene.tools.Close')"
					@click.stop="closeTool">
					<template #icon>
						<n-icon :size="12">
							<CloseOutline />
						</n-icon>
					</template>
				</n-button>
			</div>

			<div class="viewport-tools__popup-body">
				<div v-if="measureState.points.length === 0" class="viewport-tools__empty">
					{{ t("layout.scene.tools['No Points']") }}
				</div>
				<div v-else>
					<n-table>
						<thead>
							<tr>
								<th>Longitude</th>
								<th>Latitude</th>
								<th>Altitude</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(point, index) in measureState.points" :key="index">
								<td>{{ point.longitude }}</td>
								<td>{{ point.latitude }}</td>
								<td>{{ point.height }}</td>
							</tr>
						</tbody>
					</n-table>
					<div class="viewport-tools__row">
						<span class="viewport-tools__label">{{ t("layout.scene.tools['TotalArea']") }}</span>
						<span class="viewport-tools__value viewport-tools__value--accent" :style="{ color: iconColor }">
							{{ formatArea((measureState as AreaMeasureState).area) }}
						</span>
					</div>
				</div>
			</div>

			<div class="viewport-tools__popup-footer">
				<div class="viewport-tools__actions">
					<n-button size="tiny" :disabled="measureState.points.length === 0" @click.stop="resetTool">
						<template #icon>
							<n-icon>
								<RefreshOutline />
							</n-icon>
						</template>
						{{ t("layout.scene.tools.Reset") }}
					</n-button>
					<n-button size="tiny" type="primary" :disabled="!canFinishDistance" @click.stop="finishTool">
						<template #icon>
							<n-icon>
								<CheckmarkOutline />
							</n-icon>
						</template>
						{{ t("layout.scene.tools.Finish") }}
					</n-button>
				</div>
				<span class="viewport-tools__hint">
					{{
						measureState.picking
							? t("layout.scene.tools['Click map to pick multi']")
							: t("layout.scene.tools['Measure finished']")
					}}
				</span>
			</div>
		</div>

		<div v-if="showPathDrawPopup" class="viewport-tools__popup" :style="popupStyle" @pointerdown.stop @click.stop>
			<div class="viewport-tools__popup-header">
				<span>{{ t("layout.scene.tools['Draw Path']") }}</span>
				<n-button quaternary circle size="tiny" :title="t('layout.scene.tools.Close')" @click.stop="closeTool">
					<template #icon>
						<n-icon :size="12">
							<CloseOutline />
						</n-icon>
					</template>
				</n-button>
			</div>

			<div class="viewport-tools__popup-body">
				<div v-if="pathState.points.length === 0" class="viewport-tools__empty">
					{{ t("layout.scene.tools['No Path Points']") }}
				</div>
				<div v-else class="viewport-tools__row">
					<span class="viewport-tools__label">{{ t("layout.scene.tools['Path Points']") }}</span>
					<span class="viewport-tools__value">{{ pathState.points.length }}</span>
				</div>
				<div v-for="(point, index) in pathState.points" :key="index" class="viewport-tools__row">
					<span class="viewport-tools__label">
						{{ t("layout.scene.tools.Point") }} {{ index + 1 }}
					</span>
					<span class="viewport-tools__value">{{ formatPoint(point) }}</span>
				</div>
				<div v-if="pathState.length !== null" class="viewport-tools__row">
					<span class="viewport-tools__label">{{ t("layout.scene.tools['Path Length']") }}</span>
					<span class="viewport-tools__value viewport-tools__value--accent" :style="{ color: iconColor }">
						{{ formatDistance(pathState.length) }}
					</span>
				</div>
				<div v-if="pathState.generated" class="viewport-tools__row">
					<span class="viewport-tools__label">{{ t("layout.scene.tools['Flow Speed']") }}</span>
					<n-slider :value="pathSpeed" :min="0.1" :max="10" :step="0.1" :tooltip="false"
						@update:value="onPathSpeedChange" />
				</div>
			</div>

			<div class="viewport-tools__popup-footer">
				<div class="viewport-tools__actions">
					<n-button size="tiny" :disabled="pathState.points.length === 0" @click.stop="resetTool">
						<template #icon>
							<n-icon>
								<RefreshOutline />
							</n-icon>
						</template>
						{{ t("layout.scene.tools.Reset") }}
					</n-button>
					<n-button size="tiny" type="primary" :disabled="!canFinishPath" @click.stop="finishTool">
						<template #icon>
							<n-icon>
								<CheckmarkOutline />
							</n-icon>
						</template>
						{{ t("layout.scene.tools.Finish") }}
					</n-button>
				</div>
				<span class="viewport-tools__hint">
					{{
						pathState.picking
							? t("layout.scene.tools['Click to draw path']")
							: t("layout.scene.tools['Path generated']")
					}}
				</span>
			</div>
		</div>

		<div class="viewport-tools__rail" @pointerdown.stop @click.stop>
			<template v-if="terrainEnabled">
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
				<n-tooltip placement="left" trigger="hover">
					<template #trigger>
						<n-button circle size="tiny" class="viewport-tools__btn"
							:class="{ 'is-active': activeTool === 'area' }" @click.stop="onToolClick('area')">
							<template #icon>
								<n-icon :size="10" :color="iconColor">
									<AreaCustom />
								</n-icon>
							</template>
						</n-button>
					</template>
					{{ t("layout.scene.tools.Area") }}
				</n-tooltip>
			</template>
			<n-tooltip placement="left" trigger="hover">
				<template #trigger>
					<n-button circle size="tiny" class="viewport-tools__btn"
						:class="{ 'is-active': activeTool === 'path' }" @click.stop="onToolClick('path')">
						<template #icon>
							<n-icon :size="10" :color="iconColor">
								<DirectionCurve />
							</n-icon>
						</template>
					</n-button>
				</template>
				{{ t("layout.scene.tools['Draw Path']") }}
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
	gap: 8px;
	padding: 3px;
	pointer-events: auto;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(0, 0, 0, 0.06);
	backdrop-filter: blur(4px);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.viewport-tools__btn {
	--n-width: 18px !important;
	--n-height: 18px !important;
	--n-font-size: 14px !important;
	--n-icon-size: 14px !important;
	padding: 2px !important;

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
	width: 268px;
	max-height: min(420px, 70vh);
	display: flex;
	flex-direction: column;
	pointer-events: auto;
	border-radius: 8px;
	border: 1px solid;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	overflow: hidden;

	&.area {
		width: 300px;
	}
}

.viewport-tools__popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 8px 6px 10px;
	border-bottom: 1px solid var(--n-divider-color, rgba(0, 0, 0, 0.09));
	font-size: 12px;
	font-weight: 600;
	flex-shrink: 0;
}

.viewport-tools__popup-body {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 10px;
	overflow-y: auto;
	min-height: 0;
}

.viewport-tools__empty {
	font-size: 12px;
	opacity: 0.5;
	padding: 4px 0;
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
	flex-direction: column;
	gap: 6px;
	padding: 8px 10px 10px;
	border-top: 1px solid var(--n-divider-color, rgba(0, 0, 0, 0.09));
	flex-shrink: 0;
}

.viewport-tools__actions {
	display: flex;
	align-items: center;
	gap: 6px;
}

.viewport-tools__hint {
	font-size: 11px;
	opacity: 0.5;
	line-height: 1.35;
}
</style>
