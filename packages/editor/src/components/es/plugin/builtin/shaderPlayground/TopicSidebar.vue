<script setup lang="ts">
import { computed } from "vue";
import { t } from "@/language";
import type { GradeId, Topic, TopicUniform } from "@/plugin/shaderPlayground/types";
import EsInputNumber from "@/components/es/EsInputNumber.vue";

const grade = defineModel<GradeId>("grade", { required: true });
const topicId = defineModel<string>("topicId", { required: true });
const geometry = defineModel<"fullscreen" | "uvPlane" | "sphere">("geometry", { required: true });
const uniformValues = defineModel<Record<string, number | string>>("uniformValues", { required: true });

const props = defineProps<{
	topics: Topic[];
	uniformDefs: TopicUniform[];
}>();

const gradeOptions = computed(() => [
	{ label: t("plugin.shaderPlayground.Beginner"), value: "beginner" as GradeId },
	{ label: t("plugin.shaderPlayground.Intermediate"), value: "intermediate" as GradeId },
	{ label: t("plugin.shaderPlayground.Advanced"), value: "advanced" as GradeId },
]);

const geometryOptions = computed(() => [
	{ label: t("plugin.shaderPlayground.Fullscreen"), value: "fullscreen" },
	{ label: t("plugin.shaderPlayground.UV plane"), value: "uvPlane" },
	{ label: t("plugin.shaderPlayground.Sphere"), value: "sphere" },
]);

function topicLabel(topic: Topic) {
	return t(topic.titleKey);
}

function uniformLabel(def: TopicUniform) {
	return t(def.labelKey);
}
</script>

<template>
	<div class="flex flex-col gap-3 h-full overflow-hidden">
		<n-radio-group v-model:value="grade" size="small" name="shader-grade">
			<n-radio-button v-for="g in gradeOptions" :key="g.value" :value="g.value" :label="g.label" />
		</n-radio-group>

		<div class="flex-1 overflow-auto min-h-0">
			<n-menu :value="topicId" :options="topics.map(tp => ({ label: topicLabel(tp), key: tp.id }))"
				:root-indent="12" @update:value="(k: string) => (topicId = k)" />
			<p v-if="!topics.length" class="text-xs opacity-60 px-2">
				{{ t("plugin.shaderPlayground.No topics in this grade") }}
			</p>
		</div>

		<div class="flex flex-col gap-2 shrink-0 p-2">
			<span class="text-xs opacity-70">{{ t("plugin.shaderPlayground.Preview geometry") }}</span>
			<n-select v-model:value="geometry" size="small" :options="geometryOptions" />
		</div>

		<div v-if="uniformDefs.length" class="flex flex-col gap-2 shrink-0 max-h-40% overflow-auto p-2">
			<span class="text-xs opacity-70">{{ t("plugin.shaderPlayground.Uniforms") }}</span>
			<template v-for="def in uniformDefs" :key="def.key">
				<div v-if="def.type === 'color'" class="sidebar-config-item !px-0">
					<span class="text-xs">{{ uniformLabel(def) }}</span>
					<n-color-picker size="small" :modes="['hex']" :show-alpha="false"
						:value="String(uniformValues[def.key] ?? def.default)"
						@update:value="(v: string) => (uniformValues = { ...uniformValues, [def.key]: v })" />
				</div>
				<div v-else class="sidebar-config-item !px-0">
					<span class="text-xs">{{ uniformLabel(def) }}</span>
					<EsInputNumber size="tiny" :show-button="false" :min="def.min" :max="def.max"
						:step="def.step ?? 0.01" :decimal="3" :value="Number(uniformValues[def.key] ?? def.default)"
						@update:value="(v: number | null) => v != null && (uniformValues = { ...uniformValues, [def.key]: v })" />
				</div>
			</template>
		</div>
	</div>
</template>
