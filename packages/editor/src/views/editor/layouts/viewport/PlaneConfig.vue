<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { Grid } from "@vicons/carbon";
import { Hooks, Viewer } from "@astral3d/engine";
import * as THREE from "three";
import { t } from "@/language";
import { GROUND_COLOR_PRESETS, getGroundTexturePresets, type GroundTexturePreset } from "@/utils/common/groundPlane";

const planeMode = ref<"grid" | "texture">("grid");
const gridEnabled = ref(true);
const gridMainColor = ref("#666666");
const gridSubColor = ref("#555555");
const gridSize = ref(200);
const subGridDistance = ref(150);
const showAxes = ref(true);
const currentDistance = ref(0);

const textureColor = ref("#ffffff");
const textureMap = ref("");
const textureOpacity = ref(1);
const textureSize = ref(200);
const textureRepeat = ref(20);
const textureRotation = ref(0);
const textureLit = ref(false);
const textureRoughness = ref(1);
const textureMetalness = ref(0);
const textureReceiveShadow = ref(true);

const texturePresets = ref<GroundTexturePreset[]>([]);

// 预置贴图以 dataURL 形式存储，不回填到自定义地址输入框
const customTextureUrl = computed({
	get: () => (textureMap.value.startsWith("data:") ? "" : textureMap.value),
	set: (value: string) => {
		textureMap.value = value;
	},
});

const modeOptions = [
	{ label: t("layout.scene.plane.Grid"), value: "grid" },
	{ label: t("layout.scene.plane.Texture"), value: "texture" },
];

function ensureTexturePresets() {
	if (texturePresets.value.length > 0) return;
	texturePresets.value = getGroundTexturePresets();
}

function updateGrid() {
	if (!window.viewer?.options) return;

	const options = window.viewer.options.grid;
	options.enabled = gridEnabled.value;
	options.mode = planeMode.value;
	options.mainColor = gridMainColor.value;
	options.color = gridSubColor.value;
	options.row = gridSize.value;
	options.column = gridSize.value;
	options.subGridDistance = subGridDistance.value;
	options.showAxes = showAxes.value;

	options.texture.color = textureColor.value;
	options.texture.map = textureMap.value;
	options.texture.opacity = textureOpacity.value;
	options.texture.size = textureSize.value;
	options.texture.repeat = textureRepeat.value;
	options.texture.rotation = textureRotation.value;
	options.texture.lit = textureLit.value;
	options.texture.roughness = textureRoughness.value;
	options.texture.metalness = textureMetalness.value;
	options.texture.receiveShadow = textureReceiveShadow.value;

	if (gridEnabled.value) {
		window.viewer.initGrid();
	} else if (window.viewer.grid) {
		window.viewer.grid.visible = false;
	}
}

function selectColorPreset(value: string) {
	textureColor.value = value;
	updateGrid();
}

function selectTexturePreset(url: string) {
	textureMap.value = url;
	updateGrid();
}

function loadViewerOptions(viewer: Viewer) {
	if (!viewer?.options) return;

	const options = viewer.options.grid;
	planeMode.value = options.mode ?? "grid";
	gridEnabled.value = options.enabled;
	gridMainColor.value = options.mainColor;
	gridSubColor.value = options.color;
	gridSize.value = options.row;
	subGridDistance.value = options.subGridDistance || 32;
	showAxes.value = options.showAxes;

	const texture = options.texture;
	if (texture) {
		textureColor.value = texture.color;
		textureMap.value = texture.map;
		textureOpacity.value = texture.opacity;
		textureSize.value = texture.size;
		textureRepeat.value = texture.repeat;
		textureRotation.value = texture.rotation;
		textureLit.value = texture.lit;
		textureRoughness.value = texture.roughness;
		textureMetalness.value = texture.metalness;
		textureReceiveShadow.value = texture.receiveShadow;
	}
}

function updateCurrentDistance() {
	if (!window.viewer) return;

	const target = new THREE.Vector3();
	window.viewer.modules.controls.getTarget(target);
	currentDistance.value = window.viewer.camera.position.distanceTo(target);
}

function handleViewerInit(viewer: Viewer) {
	loadViewerOptions(viewer);
}

function handleCameraChanged() {
	updateCurrentDistance();
}

watch(planeMode, mode => {
	if (mode === "texture") ensureTexturePresets();
});

onMounted(() => {
	Hooks.useAddSignal("viewerInitCompleted", handleViewerInit);
	Hooks.useAddSignal("cameraChanged", handleCameraChanged);
});

onUnmounted(() => {
	Hooks.useRemoveSignal("viewerInitCompleted", handleViewerInit);
	Hooks.useRemoveSignal("cameraChanged", handleCameraChanged);
});
</script>

<template>
	<n-popover :show-arrow="false" placement="bottom-end" :style="{ padding: 0 }">
		<template #trigger>
			<n-button circle size="small" class="ml-10px">
				<template #icon>
					<n-icon>
						<Grid />
					</n-icon>
				</template>
			</n-button>
		</template>

		<div class="p-3 w-80 max-h-500px overflow-y-auto">
			<n-h4>{{ t("layout.scene.plane['Plane Setting']") }}</n-h4>

			<n-form :label-width="70" size="small" label-align="left">
				<n-form-item :label="t('layout.scene.plane.Mode')">
					<n-radio-group v-model:value="planeMode" size="small" @update:value="updateGrid">
						<n-radio-button v-for="item in modeOptions" :key="item.value" :value="item.value" :label="item.label" />
					</n-radio-group>
				</n-form-item>

				<template v-if="planeMode === 'grid'">
					<n-form-item :label="t('layout.scene.plane[\'Main Color\']')">
						<n-color-picker v-model:value="gridMainColor" :show-alpha="true" :modes="['hex']" size="small"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane[\'Sub Color\']')">
						<n-color-picker v-model:value="gridSubColor" :show-alpha="true" :modes="['hex']" size="small"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane.Size')">
						<n-input-number v-model:value="gridSize" :min="50" :max="1000" :step="50" size="small"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane[\'Sub Color Distance\']')">
						<n-input-number v-model:value="subGridDistance" :min="0" :max="1000" :step="1" size="small"
							@update:value="updateGrid" />
						<span class="ml-2 text-xs text-gray-400">
							{{ t("layout.scene.plane.Current") }}: {{ currentDistance.toFixed(1) }}
						</span>
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane.Axes')">
						<n-switch size="small" v-model:value="showAxes" @update:value="updateGrid" />
					</n-form-item>
				</template>

				<template v-else>
					<n-form-item :label="t('layout.scene.plane.Color')">
						<n-color-picker v-model:value="textureColor" :show-alpha="true" :modes="['hex']" size="small"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane[\'Preset Colors\']')" label-placement="top">
						<div class="flex flex-wrap gap-6px">
							<button v-for="preset in GROUND_COLOR_PRESETS" :key="preset.value" type="button" class="swatch"
								:class="{ 'is-active': textureColor.toLowerCase() === preset.value, 'swatch--transparent': preset.transparent }"
								:style="preset.transparent ? undefined : { backgroundColor: preset.value }"
								:title="t(`layout.scene.plane.colors['${preset.nameKey}']`)"
								@click="selectColorPreset(preset.value)" />
						</div>
					</n-form-item>

					<n-form-item :label="t('layout.scene.plane[\'Texture Image\']')" label-placement="top">
						<div class="flex flex-wrap gap-6px">
							<button type="button" class="swatch swatch--none" :class="{ 'is-active': !textureMap }"
								:title="t('layout.scene.plane.None')" @click="selectTexturePreset('')">
								{{ t("layout.scene.plane.None") }}
							</button>
							<button v-for="preset in texturePresets" :key="preset.id" type="button" class="swatch"
								:class="{ 'is-active': textureMap === preset.url }"
								:style="{ backgroundImage: `url(${preset.url})`, backgroundSize: '100% 100%' }"
								:title="t(`layout.scene.plane.textures['${preset.nameKey}']`)"
								@click="selectTexturePreset(preset.url)" />
						</div>
					</n-form-item>

					<n-form-item :label="t('layout.scene.plane[\'Custom Image URL\']')">
						<n-input v-model:value="customTextureUrl" size="small" clearable @change="updateGrid"
							@clear="updateGrid" />
					</n-form-item>

					<n-form-item :label="t('layout.scene.plane.Opacity')">
						<n-slider v-model:value="textureOpacity" :min="0" :max="1" :step="0.05"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane.Size')">
						<n-input-number v-model:value="textureSize" :min="10" :max="5000" :step="50" size="small"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane.Repeat')">
						<n-input-number v-model:value="textureRepeat" :min="1" :max="500" :step="1" size="small"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane.Rotation')">
						<n-input-number v-model:value="textureRotation" :min="0" :max="360" :step="15" size="small"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane.Lit')">
						<n-switch size="small" v-model:value="textureLit" @update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane.Roughness')">
						<n-slider v-model:value="textureRoughness" :min="0" :max="1" :step="0.05" :disabled="!textureLit"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane.Metalness')">
						<n-slider v-model:value="textureMetalness" :min="0" :max="1" :step="0.05" :disabled="!textureLit"
							@update:value="updateGrid" />
					</n-form-item>
					<n-form-item :label="t('layout.scene.plane[\'Receive Shadow\']')">
						<n-switch size="small" v-model:value="textureReceiveShadow" :disabled="!textureLit"
							@update:value="updateGrid" />
					</n-form-item>
				</template>
			</n-form>
		</div>
	</n-popover>
</template>

<style lang="less" scoped>
.swatch {
	width: 26px;
	height: 26px;
	padding: 0;
	border-radius: 4px;
	border: 1px solid var(--n-border-color);
	background-color: transparent;
	background-repeat: no-repeat;
	cursor: pointer;
	transition: border-color 0.15s, transform 0.15s;

	&:hover {
		transform: scale(1.08);
	}

	&.is-active {
		border-color: var(--n-primary-color, #35a1c4);
		box-shadow: 0 0 0 1px var(--n-primary-color, #35a1c4);
	}

	&--none {
		font-size: 10px;
		color: var(--n-text-color-3);
	}

	// 透明色以棋盘底纹表示
	&--transparent {
		background-color: #fff;
		background-image: linear-gradient(45deg, #c0c0c0 25%, transparent 25%),
			linear-gradient(-45deg, #c0c0c0 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #c0c0c0 75%),
			linear-gradient(-45deg, transparent 75%, #c0c0c0 75%);
		background-size: 10px 10px;
		background-position: 0 0, 0 5px, 5px -5px, -5px 0;
	}
}
</style>
