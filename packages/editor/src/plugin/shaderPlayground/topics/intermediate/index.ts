import type { Topic } from "../../types";
import { DEFAULT_VERTEX_FULLSCREEN } from "../../types";
import distanceShapeDoc from "./distance-shape.md?raw";
import timePulseDoc from "./time-pulse.md?raw";

export const intermediateDistanceShape: Topic = {
	id: "intermediate.distance-shape",
	grade: "intermediate",
	order: 10,
	titleKey: "plugin.shaderPlayground.Distance to shape",
	summaryKey: "plugin.shaderPlayground.Distance to shape summary",
	hintKey: "plugin.shaderPlayground.Distance to shape hint",
	docMarkdown: distanceShapeDoc,
	geometry: "fullscreen",
	vertex: DEFAULT_VERTEX_FULLSCREEN,
	fragment: /* glsl */ `
uniform float uRadius;
uniform float uSoftness;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  // 到中心的距离：形状完全由公式算出，不是「识别圆形贴图」
  float d = length(vUv - 0.5);
  float shape = 1.0 - smoothstep(uRadius, uRadius + uSoftness, d);
  if (shape < 0.004) discard; // 太暗 = 空白，不画
  gl_FragColor = vec4(uColor * shape, 1.0);
}
`,
	uniforms: [
		{ key: "uColor", type: "color", labelKey: "plugin.shaderPlayground.Color", default: "#9ec5ff" },
		{ key: "uRadius", type: "float", labelKey: "plugin.shaderPlayground.Radius", min: 0.05, max: 0.5, step: 0.01, default: 0.22 },
		{ key: "uSoftness", type: "float", labelKey: "plugin.shaderPlayground.Softness", min: 0.001, max: 0.2, step: 0.001, default: 0.04 },
	],
};

export const intermediateTimePulse: Topic = {
	id: "intermediate.time-pulse",
	grade: "intermediate",
	order: 20,
	titleKey: "plugin.shaderPlayground.Time pulse",
	summaryKey: "plugin.shaderPlayground.Time pulse summary",
	hintKey: "plugin.shaderPlayground.Time pulse hint",
	docMarkdown: timePulseDoc,
	geometry: "fullscreen",
	vertex: DEFAULT_VERTEX_FULLSCREEN,
	fragment: /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5);
  float wave = 0.5 + 0.5 * sin(uTime * uSpeed);
  float shape = exp(-d * d * 18.0) * wave;
  if (shape < 0.004) discard;
  gl_FragColor = vec4(uColor * shape, 1.0);
}
`,
	uniforms: [
		{ key: "uColor", type: "color", labelKey: "plugin.shaderPlayground.Color", default: "#ffcc66" },
		{ key: "uSpeed", type: "float", labelKey: "plugin.shaderPlayground.Speed", min: 0.5, max: 12, step: 0.1, default: 3 },
	],
};
