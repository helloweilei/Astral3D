<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick, provide } from "vue";
import { Hooks, App, defaultProjectInfo } from "@astral3d/engine";
import * as Layout from "./layouts";
import { connectWebSocket } from "@/hooks/useWebSocket";
import { useRoute } from "vue-router";
import { fetchGetOneScene } from "@/http/api/scenes";
import { t } from "@/language";
import Config, { initializeConfig } from "@/utils/storage/config";
import EsCubeLoading from "@/components/es/EsCubeLoading.vue";
import EsPlugin from "@/components/es/EsPlugin.vue";
import ObjectScript from "@/components/code/Script.vue";

initializeConfig(App.storage);

const initLoading = ref(true);
/** 左侧资源面板宽度 */
const assetsWidth = ref(Number(Config.getKey("assetsSiderWidth")) || 300);
/** 右侧属性面板宽度 */
const siderWidth = ref(300);
const assetsResizing = ref(false);

const ASSETS_WIDTH_MIN = 0;
const ASSETS_WIDTH_MAX = 800;

let assetsResizeStartX = 0;
let assetsResizeStartWidth = 0;

function clampAssetsWidth(width: number) {
	return Math.max(ASSETS_WIDTH_MIN, Math.min(ASSETS_WIDTH_MAX, Math.round(width)));
}

function onAssetsResizeMove(event: MouseEvent) {
	assetsWidth.value = clampAssetsWidth(assetsResizeStartWidth + (event.clientX - assetsResizeStartX));
}

function stopAssetsResize() {
	if (!assetsResizing.value) return;
	assetsResizing.value = false;
	document.body.style.cursor = "";
	document.body.style.userSelect = "";
	document.removeEventListener("mousemove", onAssetsResizeMove);
	document.removeEventListener("mouseup", stopAssetsResize);
	Config.setKey("assetsSiderWidth", assetsWidth.value);
}

function startAssetsResize(event: MouseEvent) {
	event.preventDefault();
	event.stopPropagation();
	assetsResizing.value = true;
	assetsResizeStartX = event.clientX;
	assetsResizeStartWidth = assetsWidth.value;
	document.body.style.cursor = "col-resize";
	document.body.style.userSelect = "none";
	document.addEventListener("mousemove", onAssetsResizeMove);
	document.addEventListener("mouseup", stopAssetsResize);
}

onBeforeUnmount(() => {
	stopAssetsResize();
});

const defaultInfo = defaultProjectInfo();
const sceneInfo = ref(defaultInfo.sceneInfo);
const drawingInfo = ref(defaultInfo.drawing);
provide("sceneInfo", sceneInfo);
provide("drawingInfo", drawingInfo);

onMounted(() => {
	// 启动websocket连接
	connectWebSocket(import.meta.env.VITE_GLOB_SOCKET_URL);

	init();
});

async function init() {
	// 获取路由参数
	const id = useRoute().params.id as string;
	if (id) {
		const res = await fetchGetOneScene(id);

		if (res.error !== null) {
			window.$message?.error(t("scene.Failed to get scene data"));
			return;
		}

		App.project.setKey("sceneInfo", res.data);
		sceneInfo.value = res.data;

		initLoading.value = false;

		await nextTick();

		getScene(res.data);
	} else {
		window.$message?.error(t("prompt['Parameter error!']"));
	}
}

//拉取场景
function getScene(sceneInfo) {
	// 如果创建的是空场景则无场景包
	if (!sceneInfo.zip) {
		window.viewer.options.hdr = "/static/resource/hdr/cloudy.hdr";
		window.viewer.loadEnv(true);

		return;
	}

	window.viewer.options.hdr = "";

	let notice = window.$notification.info({
		title: t("scene['Get the scene data']") + "...",
		content: t("other.Loading") + "...",
		closable: false,
	});

	window.viewer.package.unpack({
		url: sceneInfo.zip,
		onSceneLoad: () => {
			drawingInfo.value = App.project.getKey("drawing");
		},
		onComplete: () => {
			window.$message?.success(t("scene['Loading completed!']"));

			Hooks.useDispatchSignal("sceneLoadComplete");

			notice.destroy();
		},
	});
	return;
}
</script>

<template>
	<EsCubeLoading v-model:visible="initLoading" />

	<div id="layout" v-if="!initLoading">
		<n-layout position="absolute">
			<n-layout-header bordered>
				<Layout.Header />
			</n-layout-header>

			<n-layout class="n-layout-center-layout" has-sider sider-placement="right" position="absolute">
				<n-layout-sider class="layout-assets-sider" :class="{ 'is-resizing': assetsResizing }"
					collapse-mode="width" :collapsed-width="0" :width="assetsWidth" :native-scrollbar="false"
					show-trigger="bar" trigger-style="right:0;left:auto;transform: translateX(28px);"
					collapsed-trigger-style="left:0;right:auto;transform: rotate(0deg);">
					<Layout.Assets />
					<div class="layout-assets-resize-handle" @mousedown="startAssetsResize" />
				</n-layout-sider>

				<n-layout-content>
					<Layout.Scene />
				</n-layout-content>

				<n-layout-sider collapse-mode="transform" :collapsed-width="0" :width="siderWidth"
					:native-scrollbar="false" show-trigger="bar" bordered>
					<Layout.Sidebar />
				</n-layout-sider>
			</n-layout>

			<!-- <n-layout-footer bordered position="absolute">
  <Layout.Footer/>
</n-layout-footer> -->
		</n-layout>

		<EsPlugin />

		<ObjectScript />
	</div>
</template>

<style lang="less" scoped>
#layout {
	width: 100%;
	height: 100%;
	position: relative;

	.n-layout {
		&-header {
			height: var(--header-height);
			line-height: var(--header-height);
			padding: 0 0.5rem;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		&-sider {
			z-index: 15;
			height: 100%;
		}

		.layout-assets-sider {
			position: relative;

			/* 拖拽调宽时关掉 max-width 过渡，否则拉宽会“粘滞”、缩窄却正常
			   （naive-ui sider 只过渡 max-width，不过渡 width） */
			&.is-resizing {
				transition: none !important;
			}

			.layout-assets-resize-handle {
				position: absolute;
				top: 0;
				right: -2px;
				width: 5px;
				height: 100%;
				z-index: 30;
				cursor: col-resize;
				background: transparent;
				transition: background-color 0.15s;

				&:hover,
				&:active {
					background: #35a1c4;
				}
			}

			&.is-resizing .layout-assets-resize-handle {
				background: #35a1c4;
			}
		}

		&-center-layout {
			top: var(--header-height);
			bottom: var(--footer-height);
			width: 100%;
			// height: calc(100vh - var(--header-height) - var(--footer-height));
			height: calc(100vh - var(--header-height));
			overflow: hidden;
		}

		&-footer {
			height: var(--footer-height);
			padding: 0 1rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
	}
}
</style>
