import { registerTopics } from "../registry";
import { beginnerSolidColor, beginnerUvGradient, beginnerScreenVsUv } from "./beginner";
import { intermediateDistanceShape, intermediateTimePulse } from "./intermediate";
import { advancedAdditiveBlob, advancedBoltProfile } from "./advanced";

let registered = false;

/** 启动时注册内置知识点；扩展时在此追加即可 */
export function registerBuiltinTopics(): void {
	if (registered) return;
	registered = true;
	registerTopics([
		beginnerSolidColor,
		beginnerUvGradient,
		beginnerScreenVsUv,
		intermediateDistanceShape,
		intermediateTimePulse,
		advancedAdditiveBlob,
		advancedBoltProfile,
	]);
}
