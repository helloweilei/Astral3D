<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { LayersOutline } from "@vicons/ionicons5";
import { t } from "@/language";
import { Hooks, Utils } from "@astral3d/engine";
import EsInputNumber from "@/components/es/EsInputNumber.vue";

type Tiles3DPreset = (typeof Utils.TILES3D_PRESETS)[number];

let terrainConfig = defineModel<IAppProject.Terrain>({ required: true });
const emit = defineEmits<{ change: [] }>();

const loadState = ref("idle");
const errorMessage = ref("");
const hasAnchor = ref(false);
const editEnabled = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const disabled = computed(() => !terrainConfig.value.enabled || !terrainConfig.value.tiles3d.enabled);

/** 定位配置；旧场景数据可能缺省该字段，兜底补全 */
const placement = computed(() => {
	const tiles3d = terrainConfig.value.tiles3d;
	if (!tiles3d.placement) {
		tiles3d.placement = { enabled: false, longitude: 0, latitude: 0, height: 0 };
	}
	return tiles3d.placement;
});

/** 地形描边配置；旧场景数据可能缺省该字段，兜底补全 */
function ensureOutline() {
	const tiles3d = terrainConfig.value.tiles3d;
	if (!tiles3d.outline) {
		tiles3d.outline = { enabled: false, color: "#00e5ff", width: 2 };
	}
	return tiles3d.outline;
}
const outline = computed(() => ensureOutline());

const presetDialogShow = ref(false);
const presets = Utils.TILES3D_PRESETS;
const selectedPresetId = computed(() => Utils.findTiles3DPresetId(terrainConfig.value.tiles3d.url));

const loadStateText = computed(() => {
	switch (loadState.value) {
		case "loading":
			return t("layout.sider.terrain.Loading");
		case "loaded":
			return t("layout.sider.terrain.Loaded");
		case "error":
			return t("layout.sider.terrain.Load Error");
		default:
			return t("layout.sider.terrain.Idle");
	}
});

function refreshLoadState() {
	const terrain = window.viewer?.modules?.terrain;
	if (!terrain) return;
	loadState.value = terrain.tiles3dLoadState;
	errorMessage.value = terrain.tiles3dErrorMessage;
	hasAnchor.value = !!terrain.getTiles3DAnchor?.();

	// 用户点选其他物体会夺走 gizmo，此时同步关闭编辑开关
	if (editEnabled.value && !terrain.isTiles3DEditActive?.()) {
		editEnabled.value = false;
		terrain.setTiles3DEditEnabled?.(false);
	}
}

/**
 * gizmo 拖拽提交：把 SDK 换算好的 偏移/旋转/缩放 写回配置并持久化
 */
function onEditCommitted(payload: { offset: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; scale: number }) {
	const tiles3d = terrainConfig.value.tiles3d;
	tiles3d.offset = { ...payload.offset };
	tiles3d.rotation = { ...payload.rotation };
	tiles3d.scale = payload.scale;
	emit("change");
}

onMounted(() => {
	refreshLoadState();
	timer = setInterval(refreshLoadState, 500);
	Hooks.useAddSignal("tiles3dEditCommitted", onEditCommitted);
});

onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
	Hooks.useRemoveSignal("tiles3dEditCommitted", onEditCommitted);
	if (editEnabled.value) {
		window.viewer?.modules?.terrain?.setTiles3DEditEnabled?.(false);
	}
});

/**
 * 切换视口编辑：开启失败（瓦片集未加载/无地理参考）时回弹开关并提示
 */
function onEditToggle(checked: boolean) {
	const terrain = window.viewer?.modules?.terrain;
	if (!terrain) {
		editEnabled.value = false;
		return;
	}

	terrain.setTiles3DEditEnabled(checked);
	editEnabled.value = checked ? terrain.isTiles3DEditActive() : false;

	if (checked && !editEnabled.value) {
		window.$message?.warning(t("layout.sider.terrain['Anchor Unavailable']"));
	}
}

/**
 * 贴地：实测模型地面当前的场景高度，反向修正偏移 Y，
 * 让模型地表与影像平面（y=0）重合，消除斜视时的视差错位。
 */
function snapToGround() {
	const terrain = window.viewer?.modules?.terrain;
	const groundY = terrain?.getTiles3DGroundOffsetY?.();

	if (groundY === null || groundY === undefined) {
		window.$message?.warning(t("layout.sider.terrain['Anchor Unavailable']"));
		return;
	}

	const tiles3d = terrainConfig.value.tiles3d;
	tiles3d.offset.y = Number((tiles3d.offset.y - groundY).toFixed(2));
	onChange();
	window.$message?.success(t("layout.sider.terrain['Ground Snapped']"));
}

/**
 * 一键复位：清除全部整体调整（偏移/旋转/缩放）并关闭「定位」，
 * 模型回到瓦片集自带的地理位置与姿态。
 */
function resetTransform() {
	const tiles3d = terrainConfig.value.tiles3d;
	tiles3d.offset = { x: 0, y: 0, z: 0 };
	tiles3d.rotation = { x: 0, y: 0, z: 0 };
	tiles3d.scale = 1;
	tiles3d.placement = { enabled: false, longitude: 0, latitude: 0, height: 0 };
	onChange();
	window.$message?.success(t("layout.sider.terrain['Transform Reset']"));
}

/**
 * 更新锚点：把当前「偏移」合并进「定位」坐标（经纬度/高度），偏移清零。
 * 常见工作流：先视口拖拽把模型与底图对齐，再点此按钮把结果固化为地理坐标。
 */
function updateAnchor() {
	const anchor = window.viewer?.modules?.terrain?.getTiles3DAnchor?.();
	const base = placement.value.enabled
		? { longitude: placement.value.longitude, latitude: placement.value.latitude, height: placement.value.height }
		: anchor;

	if (!base) {
		window.$message?.warning(t("layout.sider.terrain['Anchor Unavailable']"));
		return;
	}

	const config = terrainConfig.value;
	const scenePos = Utils.wgs84ToEnu(base, config.origin);
	const offset = config.tiles3d.offset;
	const wgs = Utils.enuToWgs84({ x: scenePos.x + offset.x, y: scenePos.y + offset.y, z: scenePos.z + offset.z }, config.origin);

	placement.value.enabled = true;
	placement.value.longitude = Number(wgs.longitude.toFixed(6));
	placement.value.latitude = Number(wgs.latitude.toFixed(6));
	placement.value.height = Number(wgs.height.toFixed(2));
	config.tiles3d.offset = { x: 0, y: 0, z: 0 };

	onChange();
	window.$message?.success(t("layout.sider.terrain['Anchor Updated']"));
}

function onChange() {
	emit("change");
	refreshLoadState();
}

function openPresetDialog() {
	if (!terrainConfig.value.enabled) return;
	presetDialogShow.value = true;
}

function presetLabel(nameKey: string) {
	return t(`layout.sider.terrain['${nameKey}']`);
}

/**
 * 启用「定位」时，若尚无有效经纬度，自动填入瓦片集自身锚点，
 * 避免模型瞬间跳到 (0, 0) 赤道原点。
 */
function onPlacementToggle(checked: boolean) {
	if (checked && placement.value.longitude === 0 && placement.value.latitude === 0) {
		const anchor = window.viewer?.modules?.terrain?.getTiles3DAnchor?.();
		if (anchor) {
			placement.value.longitude = Number(anchor.longitude.toFixed(6));
			placement.value.latitude = Number(anchor.latitude.toFixed(6));
			placement.value.height = Number(anchor.height.toFixed(2));
		}
	}
	onChange();
}

/**
 * 同步地形原点：把地形原点重置为 3D Tiles 当前定位
 * （启用「定位」时取定位值，否则取瓦片集自身锚点），
 * 影像范围保持原跨度、中心随之平移。
 */
function syncOriginToTiles() {
	const anchor = window.viewer?.modules?.terrain?.getTiles3DAnchor?.();
	const target = placement.value.enabled
		? { longitude: placement.value.longitude, latitude: placement.value.latitude, height: placement.value.height }
		: anchor;

	if (!target) {
		window.$message?.warning(t("layout.sider.terrain['Anchor Unavailable']"));
		return;
	}

	const config = terrainConfig.value;
	config.origin.longitude = Number(target.longitude.toFixed(6));
	config.origin.latitude = Number(target.latitude.toFixed(6));
	config.origin.height = Number(target.height.toFixed(2));

	const bounds = config.imagery.bounds;
	const halfLonSpan = Math.abs(bounds.east - bounds.west) / 2 || 0.01;
	const halfLatSpan = Math.abs(bounds.north - bounds.south) / 2 || 0.01;
	bounds.west = config.origin.longitude - halfLonSpan;
	bounds.east = config.origin.longitude + halfLonSpan;
	bounds.south = config.origin.latitude - halfLatSpan;
	bounds.north = config.origin.latitude + halfLatSpan;

	onChange();
	window.$message?.success(t("layout.sider.terrain['Origin Synced']"));
}

/**
 * 应用预置数据集：写入 URL 的同时把地形原点挪到数据所在位置
 * （否则模型会落在离场景原点极远处），影像范围随之平移，
 * 并重置偏移/旋转/缩放，避免旧的手动校正叠加到新数据上。
 */
function selectPreset(preset: Tiles3DPreset) {
	const config = terrainConfig.value;

	config.tiles3d.url = preset.url;
	config.tiles3d.enabled = true;
	config.tiles3d.offset = { x: 0, y: 0, z: 0 };
	config.tiles3d.rotation = { x: 0, y: 0, z: 0 };
	config.tiles3d.scale = 1;
	config.tiles3d.placement = { enabled: false, longitude: 0, latitude: 0, height: 0 };

	Object.assign(config.origin, preset.origin);

	// 影像范围保持原跨度，中心平移到新原点
	const bounds = config.imagery.bounds;
	const halfLonSpan = Math.abs(bounds.east - bounds.west) / 2 || 0.01;
	const halfLatSpan = Math.abs(bounds.north - bounds.south) / 2 || 0.01;
	bounds.west = preset.origin.longitude - halfLonSpan;
	bounds.east = preset.origin.longitude + halfLonSpan;
	bounds.south = preset.origin.latitude - halfLatSpan;
	bounds.north = preset.origin.latitude + halfLatSpan;

	presetDialogShow.value = false;
	onChange();
}
</script>

<template>
	<div class="sidebar-config-item">
		<span>{{ t("other.Enable") }}</span>
		<div>
			<n-checkbox
				size="small"
				v-model:checked="terrainConfig.tiles3d.enabled"
				:disabled="!terrainConfig.enabled"
				@update:checked="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Tileset URL") }}</span>
		<div class="url-field">
			<n-input
				v-model:value="terrainConfig.tiles3d.url"
				:disabled="!terrainConfig.enabled"
				size="tiny"
				placeholder="tileset.json"
				@change="onChange"
			/>
			<n-button size="tiny" :disabled="!terrainConfig.enabled"
				:title="t('layout.sider.terrain[\'Preset Tilesets\']')" @click="openPresetDialog">
				<template #icon>
					<n-icon>
						<LayersOutline />
					</n-icon>
				</template>
			</n-button>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.SSE") }}</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.tiles3d.maximumScreenSpaceError"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:min="1"
				:max="64"
				:decimal="0"
				@change="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain['Terrain Outline']") }}</span>
		<div>
			<n-checkbox
				size="small"
				v-model:checked="outline.enabled"
				:disabled="disabled"
				@update:checked="onChange"
			/>
		</div>
	</div>

	<template v-if="outline.enabled">
		<div class="sidebar-config-item">
			<span>{{ t("layout.sider.terrain['Outline Color']") }}</span>
			<div>
				<n-color-picker
					v-model:value="outline.color"
					:disabled="disabled"
					:show-alpha="false"
					size="small"
					@update:value="onChange"
				/>
			</div>
		</div>

		<div class="sidebar-config-item">
			<span>{{ t("layout.sider.terrain['Outline Width']") }}</span>
			<div>
				<EsInputNumber
					v-model:value="outline.width"
					:disabled="disabled"
					size="tiny"
					:show-button="false"
					:min="0.5"
					:max="16"
					:step="0.5"
					:decimal="1"
					@change="onChange"
				/>
			</div>
		</div>
	</template>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Load State") }}</span>
		<div>
			<n-tag size="small" :type="loadState === 'error' ? 'error' : loadState === 'loaded' ? 'success' : 'default'">
				{{ loadStateText }}
			</n-tag>
		</div>
	</div>

	<div class="sidebar-config-item" v-if="errorMessage">
		<span>{{ t("layout.sider.terrain.Error") }}</span>
		<div class="text-xs text-red-400">{{ errorMessage }}</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain['Sync Origin']") }}</span>
		<div>
			<n-button
				size="tiny"
				:disabled="disabled || (!hasAnchor && !placement.enabled)"
				:title="hasAnchor || placement.enabled ? '' : t('layout.sider.terrain[\'Anchor Unavailable\']')"
				@click="syncOriginToTiles"
			>
				{{ t("layout.sider.terrain.Sync") }}
			</n-button>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Placement") }}</span>
		<div>
			<n-checkbox size="small" v-model:checked="placement.enabled" :disabled="disabled" @update:checked="onPlacementToggle" />
		</div>
	</div>

	<template v-if="placement.enabled">
		<div class="sidebar-config-item">
			<span>{{ t("layout.sider.terrain.Longitude") }}</span>
			<div>
				<EsInputNumber
					v-model:value="placement.longitude"
					:disabled="disabled"
					size="tiny"
					:show-button="false"
					:min="-180"
					:max="180"
					:decimal="6"
					@change="onChange"
				/>
			</div>
		</div>

		<div class="sidebar-config-item">
			<span>{{ t("layout.sider.terrain.Latitude") }}</span>
			<div>
				<EsInputNumber
					v-model:value="placement.latitude"
					:disabled="disabled"
					size="tiny"
					:show-button="false"
					:min="-85"
					:max="85"
					:decimal="6"
					@change="onChange"
				/>
			</div>
		</div>

		<div class="sidebar-config-item">
			<span>{{ t("layout.sider.terrain.Height") }}</span>
			<div>
				<EsInputNumber
					v-model:value="placement.height"
					:disabled="disabled"
					size="tiny"
					:show-button="false"
					:decimal="2"
					@change="onChange"
				/>
			</div>
		</div>
	</template>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain['Edit In Viewport']") }}</span>
		<div>
			<n-checkbox
				size="small"
				:checked="editEnabled"
				:disabled="disabled || !hasAnchor"
				@update:checked="onEditToggle"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain['Update Anchor']") }}</span>
		<div>
			<n-button size="tiny" :disabled="disabled || (!hasAnchor && !placement.enabled)" @click="updateAnchor">
				{{ t("layout.sider.terrain.Update") }}
			</n-button>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain['Snap To Ground']") }}</span>
		<div>
			<n-button size="tiny" :disabled="disabled || !hasAnchor" @click="snapToGround">
				{{ t("layout.sider.terrain.Snap") }}
			</n-button>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain['Reset Transform']") }}</span>
		<div>
			<n-button size="tiny" :disabled="disabled" @click="resetTransform">
				{{ t("layout.sider.terrain.Reset") }}
			</n-button>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.object.position") }} X</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.tiles3d.offset.x"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.object.position") }} Y</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.tiles3d.offset.y"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.object.position") }} Z</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.tiles3d.offset.z"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.object.rotation") }} X</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.tiles3d.rotation.x"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.object.rotation") }} Y</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.tiles3d.rotation.y"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.object.rotation") }} Z</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.tiles3d.rotation.z"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.object.scale") }}</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.tiles3d.scale"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:min="0.001"
				:decimal="3"
				@change="onChange"
			/>
		</div>
	</div>

	<n-modal v-model:show="presetDialogShow" preset="card" :title="t('layout.sider.terrain[\'Preset Tilesets\']')"
		style="width: 520px" :mask-closable="true">
		<n-alert type="info" :show-icon="true" class="mb-3">
			{{ t("layout.sider.terrain['Preset Tileset Hint']") }}
		</n-alert>
		<div class="preset-list">
			<button v-for="preset in presets" :key="preset.id" type="button" class="preset-item"
				:class="{ 'is-active': selectedPresetId === preset.id }" @click="selectPreset(preset)">
				<div class="preset-item__title">{{ presetLabel(preset.nameKey) }}</div>
				<div class="preset-item__meta">
					{{ t("layout.sider.terrain.Longitude") }} {{ preset.origin.longitude.toFixed(4) }}，
					{{ t("layout.sider.terrain.Latitude") }} {{ preset.origin.latitude.toFixed(4) }}
				</div>
				<div class="preset-item__url">{{ preset.url }}</div>
			</button>
		</div>
	</n-modal>
</template>

<style scoped lang="less">
.url-field {
	display: flex;
	align-items: center;
	gap: 6px;
	width: 100%;
	min-width: 0;

	.n-input {
		flex: 1;
		min-width: 0;
	}

	.n-button {
		flex-shrink: 0;
	}
}

.preset-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 420px;
	overflow-y: auto;
}

.preset-item {
	display: block;
	width: 100%;
	text-align: left;
	padding: 10px 12px;
	border-radius: 6px;
	border: 1px solid var(--n-border-color);
	background: transparent;
	color: inherit;
	cursor: pointer;
	transition: border-color 0.15s, background-color 0.15s;

	&:hover {
		border-color: var(--n-color-target);
		background: var(--n-color-hover, rgba(255, 255, 255, 0.04));
	}

	&.is-active {
		border-color: var(--n-color-target);
		background: rgba(79, 193, 160, 0.12);
	}

	&__title {
		font-size: 13px;
		font-weight: 500;
		margin-bottom: 4px;
	}

	&__meta {
		font-size: 11px;
		color: var(--n-text-color-2);
		margin-bottom: 2px;
	}

	&__url {
		font-size: 11px;
		line-height: 1.4;
		color: var(--n-text-color-3);
		word-break: break-all;
	}
}
</style>
