<script setup lang="ts">
import { computed } from "vue";
import type { DefineComponent } from "vue";
import { NIcon } from "naive-ui";
import { t } from "@/language";

const props = defineProps<{
	text: string;
	color: string;
	component: DefineComponent;
}>();

const label = computed(() => t(`layout.sider["${props.text}"]`));
</script>

<template>
	<span class="sidebar-tab-icon" :title="label">
		<n-icon :size="14" :color="color">
			<component :is="component" />
		</n-icon>
	</span>
</template>

<style scoped lang="less">
.sidebar-tab-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
}
</style>
