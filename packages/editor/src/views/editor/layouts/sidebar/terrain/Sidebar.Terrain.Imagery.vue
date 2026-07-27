<script setup lang="ts">
import { computed, ref } from "vue";
import { HelpCircleOutline, LayersOutline } from "@vicons/ionicons5";
import { t } from "@/language";
import { Utils } from "@astral3d/engine";
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let terrainConfig = defineModel<IAppProject.Terrain>({ required: true });
const emit = defineEmits<{ change: [] }>();

const disabled = computed(() => !terrainConfig.value.enabled || !terrainConfig.value.imagery.enabled);
const showUrlField = computed(() => ["osm", "custom"].includes(terrainConfig.value.imagery.provider));
const isCustomProvider = computed(() => terrainConfig.value.imagery.provider === "custom");
const urlPlaceholder = computed(() =>
	terrainConfig.value.imagery.provider === "osm"
		? Utils.DEFAULT_OSM_TILE_URL
		: Utils.DEFAULT_CUSTOM_TILE_URL
);

const presetDialogShow = ref(false);
const customPresets = Utils.CUSTOM_IMAGERY_PRESETS;

const selectedPresetId = computed(() =>
	Utils.findCustomImageryPresetId(terrainConfig.value.imagery.url)
);

const providerOptions = [
	{ label: "OpenStreetMap", value: "osm" },
	{ label: t("layout.sider.terrain.Tianditu Imagery"), value: "tianditu_img" },
	{ label: t("layout.sider.terrain.Tianditu Vector"), value: "tianditu_vec" },
	{ label: t("layout.sider.terrain.Custom URL"), value: "custom" },
];

function onChange() {
	emit("change");
}

function syncLockedLevelToBounds() {
	terrainConfig.value.imagery.lockedLevel = Utils.estimateZoomFromBounds(
		terrainConfig.value.imagery.bounds,
		terrainConfig.value.imagery.minZoom,
		terrainConfig.value.imagery.maxZoom
	);
}

function onBoundsChange() {
	syncLockedLevelToBounds();
	onChange();
}

function onProviderChange(provider: IAppProject.Terrain["imagery"]["provider"]) {
	terrainConfig.value.imagery.url = Utils.resolveImageryUrlForProvider(
		provider,
		terrainConfig.value.imagery.url
	);
	onChange();
}

function estimateBoundsFromCamera() {
	const bounds = window.viewer?.modules?.terrain?.estimateBoundsFromCamera();
	if (!bounds) return;
	Object.assign(terrainConfig.value.imagery.bounds, bounds);
	syncLockedLevelToBounds();
	onChange();
}

function openPresetDialog() {
	if (disabled.value) return;
	presetDialogShow.value = true;
}

function selectPreset(url: string) {
	terrainConfig.value.imagery.url = url;
	presetDialogShow.value = false;
	onChange();
}

function presetLabel(nameKey: string) {
	return t(`layout.sider.terrain.${nameKey}`);
}
</script>

<template>
	<div class="sidebar-config-item">
		<span>{{ t("other.Enable") }}</span>
		<div>
			<n-checkbox size="small" v-model:checked="terrainConfig.imagery.enabled" :disabled="!terrainConfig.enabled"
				@update:checked="onChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Provider") }}</span>
		<div>
			<n-select v-model:value="terrainConfig.imagery.provider" :disabled="disabled" size="tiny"
				:options="providerOptions" @update:value="onProviderChange" />
		</div>
	</div>

	<div class="sidebar-config-item" v-if="showUrlField">
		<span>{{ t("layout.sider.terrain.URL Template") }}</span>
		<div class="url-field">
			<n-input v-model:value="terrainConfig.imagery.url" :disabled="disabled" size="tiny"
				:placeholder="urlPlaceholder" @change="onChange" />
			<n-button v-if="isCustomProvider" size="tiny" :disabled="disabled"
				:title="t('layout.sider.terrain.Preset Layers')" @click="openPresetDialog">
				<template #icon>
					<n-icon>
						<LayersOutline />
					</n-icon>
				</template>
				<!-- {{ t("layout.sider.terrain['Select Layer']") }} -->
			</n-button>
		</div>
	</div>

	<div class="sidebar-config-item" v-if="terrainConfig.imagery.provider.startsWith('tianditu')">
		<span>{{ t("layout.sider.terrain.Token") }}</span>
		<div class="w-full">
			<n-input v-model:value="terrainConfig.imagery.token" :disabled="disabled" size="tiny" type="password"
				show-password-on="click" @change="onChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span class="inline-flex items-center gap-4px w-60%!">
			{{ t("layout.sider.terrain.Fixed Bounds") }}
			<n-icon size="14" class="hint-icon" :title="t('layout.sider.terrain.Fixed Bounds Hint')">
				<HelpCircleOutline />
			</n-icon>
		</span>
		<div>
			<n-checkbox size="small" v-model:checked="terrainConfig.imagery.fixedBounds" :disabled="disabled"
				@update:checked="onChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Min Zoom") }}</span>
		<div>
			<EsInputNumber v-model:value="terrainConfig.imagery.minZoom" :disabled="disabled" size="tiny"
				:show-button="false" :min="0" :max="22" :decimal="0" @change="onChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Max Zoom") }}</span>
		<div>
			<EsInputNumber v-model:value="terrainConfig.imagery.maxZoom" :disabled="disabled" size="tiny"
				:show-button="false" :min="0" :max="22" :decimal="0" @change="onChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.weather.Alpha") }}</span>
		<div>
			<EsInputNumber v-model:value="terrainConfig.imagery.opacity" :disabled="disabled" size="tiny"
				:show-button="false" :min="0" :max="1" :decimal="2" @change="onChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.West") }}</span>
		<div>
			<EsInputNumber v-model:value="terrainConfig.imagery.bounds.west" :disabled="disabled" size="tiny"
				:show-button="false" :decimal="6" @change="onBoundsChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.South") }}</span>
		<div>
			<EsInputNumber v-model:value="terrainConfig.imagery.bounds.south" :disabled="disabled" size="tiny"
				:show-button="false" :decimal="6" @change="onBoundsChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.East") }}</span>
		<div>
			<EsInputNumber v-model:value="terrainConfig.imagery.bounds.east" :disabled="disabled" size="tiny"
				:show-button="false" :decimal="6" @change="onBoundsChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.North") }}</span>
		<div>
			<EsInputNumber v-model:value="terrainConfig.imagery.bounds.north" :disabled="disabled" size="tiny"
				:show-button="false" :decimal="6" @change="onBoundsChange" />
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Estimate Bounds") }}</span>
		<div>
			<n-button size="tiny" :disabled="disabled" @click="estimateBoundsFromCamera">
				{{ t("layout.sider.terrain.From Camera") }}
			</n-button>
		</div>
	</div>

	<n-modal v-model:show="presetDialogShow" preset="card" :title="t('layout.sider.terrain.Preset Layers')"
		style="width: 480px" :mask-closable="true">
		<div class="preset-list">
			<button v-for="preset in customPresets" :key="preset.id" type="button" class="preset-item"
				:class="{ 'is-active': selectedPresetId === preset.id }" @click="selectPreset(preset.url)">
				<div class="preset-item__title">{{ presetLabel(preset.nameKey) }}</div>
				<div class="preset-item__url">{{ preset.url }}</div>
			</button>
		</div>
	</n-modal>
</template>

<style scoped lang="less">
.hint-icon {
	color: var(--n-text-color-3);
	cursor: help;
	vertical-align: middle;
}

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

	&__url {
		font-size: 11px;
		line-height: 1.4;
		color: var(--n-text-color-3);
		word-break: break-all;
	}
}
</style>
