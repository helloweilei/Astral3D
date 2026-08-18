/**
 * 着色器沙盒学习插件
 */
import { h, ref } from "vue";
import type { ModalReactive } from "naive-ui";
import type { Plugin } from "@astral3d/engine";
import { t } from "@/language";
import ShaderPlaygroundComponent from "@/components/es/plugin/builtin/ShaderPlayground.vue";
import { registerBuiltinTopics } from "./topics";

const MODAL_STYLE_NORMAL = {
	width: "min(96vw, 1280px)",
} as const;

const MODAL_STYLE_FULLSCREEN = {
	width: "100vw",
	maxWidth: "100vw",
	height: "100vh",
	margin: "0",
	borderRadius: "0",
} as const;

export default class ShaderPlayground implements Plugin {
	icon = "";
	name = "Shader playground";
	version = 1;

	modalInstance: ModalReactive | undefined = undefined;
	componentRef = ref();

	install(): void {
		registerBuiltinTopics();
		this.name = t("plugin.shaderPlayground.Shader playground");
	}

	async run() {
		this.name = t("plugin.shaderPlayground.Shader playground");
		this.componentRef = ref();
		this.modalInstance = window.$modal.create({
			title: this.name,
			preset: "card",
			maskClosable: false,
			style: { ...MODAL_STYLE_NORMAL },
			contentStyle: {
				paddingBottom: "12px",
			},
			onAfterLeave: () => {
				this.componentRef.value?.handleClose?.();
				this.finish();
			},
			content: () =>
				h(ShaderPlaygroundComponent, {
					ref: this.componentRef,
					onFinish: () => this.finish(),
					onFullscreenChange: (full: boolean) => this.setModalFullscreen(full),
				}),
		});
	}

	setModalFullscreen(full: boolean) {
		if (!this.modalInstance) return;
		this.modalInstance.style = (
			full ? { ...MODAL_STYLE_FULLSCREEN } : { ...MODAL_STYLE_NORMAL }
		) as typeof this.modalInstance.style;
		this.modalInstance.contentStyle = (
			full
				? {
						paddingBottom: "12px",
						height: "calc(100vh - 58px)",
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
					}
				: { paddingBottom: "12px" }
		) as typeof this.modalInstance.contentStyle;
	}

	finish() {
		this.modalInstance && this.modalInstance.destroy();
		this.componentRef = ref();
	}

	uninstall(): void {}
}
