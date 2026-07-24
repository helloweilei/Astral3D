<script setup lang="ts">
import { computed } from "vue";
import { t } from "@/language";
import EsInputNumber from "@/components/es/EsInputNumber.vue";

let terrainConfig = defineModel<IAppProject.Terrain>({ required: true });
const emit = defineEmits<{ change: [] }>();

const disabled = computed(() => !terrainConfig.value.enabled);

function onChange() {
	emit("change");
}
</script>

<template>
	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Longitude") }}</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.origin.longitude"
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
				v-model:value="terrainConfig.origin.latitude"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:min="-90"
				:max="90"
				:decimal="6"
				@change="onChange"
			/>
		</div>
	</div>

	<div class="sidebar-config-item">
		<span>{{ t("layout.sider.terrain.Height") }}</span>
		<div>
			<EsInputNumber
				v-model:value="terrainConfig.origin.height"
				:disabled="disabled"
				size="tiny"
				:show-button="false"
				:decimal="2"
				@change="onChange"
			/>
		</div>
	</div>
</template>

<style scoped lang="less"></style>
