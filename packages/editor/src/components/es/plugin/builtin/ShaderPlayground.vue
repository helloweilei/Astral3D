<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { t } from "@/language";
import CodeEditor from "@/components/code/CodeEditor.vue";
import TopicSidebar from "./shaderPlayground/TopicSidebar.vue";
import PreviewHost from "./shaderPlayground/PreviewHost.vue";
import { registerBuiltinTopics } from "@/plugin/shaderPlayground/topics";
import { getTopicsByGrade, getTopic } from "@/plugin/shaderPlayground/registry";
import { openMarkdownInNewTab } from "@/plugin/shaderPlayground/markdownDoc";
import type { GradeId, GeometryKind, Topic } from "@/plugin/shaderPlayground/types";

registerBuiltinTopics();

const emit = defineEmits<{
	finish: [];
	fullscreenChange: [value: boolean];
}>();

type WorkMode = "lesson" | "free";

const workMode = ref<WorkMode>("lesson");
const grade = ref<GradeId>("beginner");
const topicId = ref("");
const codeTab = ref<"vertex" | "fragment">("fragment");
const vertexSrc = ref("");
const fragmentSrc = ref("");
const geometry = ref<GeometryKind>("fullscreen");
const blending = ref<"normal" | "additive">("normal");
const uniformValues = ref<Record<string, number | string>>({});
const compileError = ref("");
const editorKey = ref(0);
const isFullscreen = ref(false);
const isEditorFullscreen = ref(false);

const topics = computed(() => getTopicsByGrade(grade.value));
const currentTopic = computed(() => getTopic(topicId.value));

watch(
	grade,
	() => {
		const list = getTopicsByGrade(grade.value);
		if (!list.length) {
			topicId.value = "";
			return;
		}
		if (!list.some(t => t.id === topicId.value)) {
			topicId.value = list[0].id;
		}
	},
	{ immediate: true },
);

watch(
	topicId,
	id => {
		const topic = getTopic(id);
		if (topic) loadTopic(topic);
	},
	{ immediate: true },
);

function loadTopic(topic: Topic) {
	vertexSrc.value = topic.vertex;
	fragmentSrc.value = topic.fragment;
	geometry.value = topic.geometry;
	blending.value = topic.blending ?? "normal";
	const vals: Record<string, number | string> = {};
	for (const u of topic.uniforms) {
		vals[u.key] = u.default;
	}
	uniformValues.value = vals;
	compileError.value = "";
	editorKey.value += 1;
}

function handleReset() {
	const topic = currentTopic.value;
	if (topic && workMode.value === "lesson") {
		loadTopic(topic);
	} else {
		vertexSrc.value = /* glsl */ `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
		fragmentSrc.value = /* glsl */ `varying vec2 vUv;
void main() {
  gl_FragColor = vec4(vUv, 0.5, 1.0);
}`;
		editorKey.value += 1;
	}
}

function selectNextTopic() {
	const list = topics.value;
	const idx = list.findIndex(t => t.id === topicId.value);
	if (idx >= 0 && idx < list.length - 1) {
		topicId.value = list[idx + 1].id;
	} else if (grade.value === "beginner") {
		grade.value = "intermediate";
	} else if (grade.value === "intermediate") {
		grade.value = "advanced";
	}
}

function openTopicDoc() {
	const topic = currentTopic.value;
	if (!topic?.docMarkdown) {
		window.$message?.warning?.(t("plugin.shaderPlayground.No document"));
		return;
	}
	openMarkdownInNewTab(t(topic.titleKey), topic.docMarkdown);
}

const activeSource = computed({
	get: () => (codeTab.value === "vertex" ? vertexSrc.value : fragmentSrc.value),
	set: (v: string) => {
		if (codeTab.value === "vertex") vertexSrc.value = v;
		else fragmentSrc.value = v;
	},
});

const summaryText = computed(() => {
	const topic = currentTopic.value;
	if (!topic || workMode.value === "free") return t("plugin.shaderPlayground.Free mode hint");
	return t(topic.summaryKey);
});

const hintText = computed(() => {
	const topic = currentTopic.value;
	if (!topic?.hintKey || workMode.value === "free") return "";
	return t(topic.hintKey);
});

function handleClose() {
	if (isEditorFullscreen.value) {
		isEditorFullscreen.value = false;
	}
	if (isFullscreen.value) {
		isFullscreen.value = false;
		emit("fullscreenChange", false);
	}
	emit("finish");
}

function toggleFullscreen() {
	isFullscreen.value = !isFullscreen.value;
	emit("fullscreenChange", isFullscreen.value);
}

function toggleEditorFullscreen() {
	isEditorFullscreen.value = !isEditorFullscreen.value;
}

defineExpose({ handleClose, isFullscreen });
</script>

<template>
	<div
		class="shader-playground flex flex-col gap-2"
		:class="{ 'is-fullscreen': isFullscreen, 'is-editor-fullscreen': isEditorFullscreen }"
		:style="{ height: isFullscreen ? '100%' : 'min(80vh, 760px)' }"
	>
		<div v-show="!isEditorFullscreen" class="flex items-center justify-between gap-2 shrink-0">
			<n-radio-group v-model:value="workMode" size="small">
				<n-radio-button value="lesson" :label="t('plugin.shaderPlayground.Lesson mode')" />
				<n-radio-button value="free" :label="t('plugin.shaderPlayground.Free mode')" />
			</n-radio-group>
			<div class="flex gap-2">
				<n-button v-if="workMode === 'lesson'" size="small" type="primary" secondary
					:disabled="!currentTopic?.docMarkdown" @click="openTopicDoc">
					{{ t("plugin.shaderPlayground.Open document") }}
				</n-button>
				<n-button size="small" @click="handleReset">{{ t("plugin.shaderPlayground.Reset") }}</n-button>
				<n-button size="small" @click="toggleFullscreen">
					{{
						isFullscreen
							? t("plugin.shaderPlayground.Exit fullscreen")
							: t("plugin.shaderPlayground.Enter fullscreen")
					}}
				</n-button>
				<n-button size="small" @click="handleClose">{{ t("plugin.shaderPlayground.Close") }}</n-button>
			</div>
		</div>

		<div class="flex-1 min-h-0 flex gap-3 overflow-hidden relative">
			<aside
				v-if="workMode === 'lesson' && !isEditorFullscreen"
				class="w-240px shrink-0 flex flex-col overflow-hidden border-r border-solid border-[var(--n-border-color)] pr-2"
			>
				<TopicSidebar v-model:grade="grade" v-model:topic-id="topicId" v-model:geometry="geometry"
					v-model:uniform-values="uniformValues" :topics="topics"
					:uniform-defs="currentTopic?.uniforms ?? []" />
			</aside>

			<section class="flex-1 min-w-0 flex flex-col gap-2 overflow-hidden">
				<div v-show="!isEditorFullscreen" class="flex-1 min-h-0 relative">
					<PreviewHost :vertex="vertexSrc" :fragment="fragmentSrc" :geometry="geometry" :blending="blending"
						:uniform-values="uniformValues" :uniform-defs="currentTopic?.uniforms ?? []"
						@error="compileError = $event" @ok="compileError = ''" />
					<div v-if="compileError"
						class="absolute left-2 right-2 bottom-2 text-xs p-2 rounded max-h-28% overflow-auto"
						style="background: color-mix(in srgb, var(--n-error-color) 20%, transparent); color: var(--n-error-color)">
						<pre class="m-0 whitespace-pre-wrap font-mono">{{ compileError }}</pre>
					</div>
				</div>

				<div
					class="editor-panel flex flex-col overflow-hidden"
					:class="isEditorFullscreen ? 'editor-panel--fs' : 'h-42% min-h-180px'"
				>
					<div class="flex items-center justify-between gap-2 shrink-0 mb-1">
						<n-radio-group v-model:value="codeTab" size="small">
							<n-radio-button value="fragment" :label="t('plugin.shaderPlayground.Fragment')" />
							<n-radio-button value="vertex" :label="t('plugin.shaderPlayground.Vertex')" />
						</n-radio-group>
						<n-button size="tiny" tertiary @click="toggleEditorFullscreen">
							{{
								isEditorFullscreen
									? t("plugin.shaderPlayground.Exit editor fullscreen")
									: t("plugin.shaderPlayground.Editor fullscreen")
							}}
						</n-button>
					</div>
					<div class="flex-1 min-h-0 overflow-hidden rounded">
						<CodeEditor :key="`${editorKey}-${codeTab}`" :source="activeSource" mode="glsl"
							:config="{ automaticLayout: true, minimap: { enabled: false }, fontSize: 13, colorDecorators: true }"
							@update:source="activeSource = $event" />
					</div>
				</div>
			</section>
		</div>

		<footer
			v-show="!isEditorFullscreen"
			class="shrink-0 text-sm leading-relaxed opacity-90 border-t border-solid border-[var(--n-border-color)] p-2"
		>
			<p class="m-0 mb-1">{{ summaryText }}</p>
			<p v-if="hintText" class="m-0 mb-2 text-xs opacity-70">{{ hintText }}</p>
			<div class="flex gap-2 items-center">
				<n-button v-if="workMode === 'lesson'" size="tiny" tertiary @click="selectNextTopic">
					{{ t("plugin.shaderPlayground.Next topic") }}
				</n-button>
				<n-button v-if="workMode === 'lesson' && currentTopic?.docMarkdown" size="tiny" tertiary type="primary"
					@click="openTopicDoc">
					{{ t("plugin.shaderPlayground.Open document") }}
				</n-button>
			</div>
		</footer>
	</div>
</template>

<style scoped lang="less">
.shader-playground.is-fullscreen {
	min-height: 0;
}

.editor-panel--fs {
	position: absolute;
	inset: 0;
	z-index: 20;
	height: 100% !important;
	min-height: 0 !important;
	padding: 8px;
	box-sizing: border-box;
	background: var(--n-color);
}
</style>
