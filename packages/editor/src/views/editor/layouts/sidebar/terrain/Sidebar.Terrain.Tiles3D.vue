<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { t } from "@/language";
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let terrainConfig = defineModel<IAppProject.Terrain>({ required: true });
const emit = defineEmits<{ change: [] }>();

const loadState = ref("idle");
const errorMessage = ref("");
let timer: ReturnType<typeof setInterval> | null = null;

const disabled = computed(() => !terrainConfig.value.enabled || !terrainConfig.value.tiles3d.enabled);

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
	if (!window.viewer?.modules?.terrain) return;
	loadState.value = window.viewer.modules.terrain.tiles3dLoadState;
	errorMessage.value = window.viewer.modules.terrain.tiles3dErrorMessage;
}

onMounted(() => {
	refreshLoadState();
	timer = setInterval(refreshLoadState, 500);
});

onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
});

function onChange() {
	emit("change");
	refreshLoadState();
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
		<div class="w-full">
			<n-input
				v-model:value="terrainConfig.tiles3d.url"
				:disabled="!terrainConfig.enabled"
				size="tiny"
				placeholder="tileset.json"
				@change="onChange"
			/>
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
</template>

<style scoped lang="less"></style>
