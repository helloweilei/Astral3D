import { onBeforeUnmount, onMounted } from "vue";
import { App, Hooks, Utils } from "@astral3d/engine";

/** 工程天气配置变更时把侧栏本地副本拉齐（实时天气勾选同步） */
export function useWeatherConfigSync(projectKey: string, config: object, signal: string) {
	function pull() {
		const next = App.project.getKey(projectKey);
		if (next) Utils.deepAssign(config, next);
	}

	onMounted(() => {
		Hooks.useAddSignal(signal, pull);
	});

	onBeforeUnmount(() => {
		Hooks.useRemoveSignal(signal, pull);
	});
}
