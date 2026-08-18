import type { Topic } from "../../types";
import { DEFAULT_VERTEX_FULLSCREEN } from "../../types";
import additiveBlobDoc from "./additive-blob.md?raw";
import boltProfileDoc from "./bolt-profile.md?raw";

export const advancedAdditiveBlob: Topic = {
	id: "advanced.additive-blob",
	grade: "advanced",
	order: 10,
	titleKey: "plugin.shaderPlayground.Additive blob",
	summaryKey: "plugin.shaderPlayground.Additive blob summary",
	hintKey: "plugin.shaderPlayground.Additive blob hint",
	docMarkdown: additiveBlobDoc,
	geometry: "fullscreen",
	blending: "additive",
	vertex: DEFAULT_VERTEX_FULLSCREEN,
	fragment: /* glsl */ `
uniform float uIntensity;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float d = length(vUv - vec2(0.5, 0.55));
  float core = exp(-d * d * 40.0);
  float glow = exp(-d * d * 6.0) * 0.45;
  float a = (core + glow) * uIntensity;
  if (a < 0.004) discard;
  // 能量乘进 RGB，alpha 固定 1，Additive 更可预期（同闪电）
  gl_FragColor = vec4(uColor * a, 1.0);
}
`,
	uniforms: [
		{ key: "uColor", type: "color", labelKey: "plugin.shaderPlayground.Color", default: "#c8e0ff" },
		{ key: "uIntensity", type: "float", labelKey: "plugin.shaderPlayground.Intensity", min: 0, max: 2, step: 0.05, default: 1 },
	],
};

export const advancedBoltProfile: Topic = {
	id: "advanced.bolt-profile",
	grade: "advanced",
	order: 20,
	titleKey: "plugin.shaderPlayground.Bolt profile",
	summaryKey: "plugin.shaderPlayground.Bolt profile summary",
	hintKey: "plugin.shaderPlayground.Bolt profile hint",
	docMarkdown: boltProfileDoc,
	geometry: "fullscreen",
	blending: "additive",
	vertex: DEFAULT_VERTEX_FULLSCREEN,
	fragment: /* glsl */ `
uniform float uCoreK;
uniform float uMidK;
uniform float uGlowK;
uniform float uIntensity;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  // 模拟丝带横截面：vUv.x 当「离中线距离」（中心 0.5）
  float d = abs(vUv.x - 0.5) * 2.0;
  float core = exp(-d * d * uCoreK);
  float mid = exp(-d * d * uMidK) * 0.55;
  float glow = exp(-d * d * uGlowK) * 0.35;
  float shape = (core * 1.4 + mid + glow) * uIntensity;
  // 只在竖直中带显示，方便看成「一条电」
  shape *= smoothstep(0.02, 0.0, abs(vUv.y - 0.5) - 0.48);
  if (shape < 0.004) discard;
  vec3 hot = vec3(1.0);
  vec3 cool = mix(uColor, vec3(0.65, 0.82, 1.0), 0.45);
  vec3 col = mix(cool, hot, core);
  gl_FragColor = vec4(col * shape, 1.0);
}
`,
	uniforms: [
		{ key: "uColor", type: "color", labelKey: "plugin.shaderPlayground.Color", default: "#d7e9ff" },
		{ key: "uIntensity", type: "float", labelKey: "plugin.shaderPlayground.Intensity", min: 0, max: 2, step: 0.05, default: 1 },
		{ key: "uCoreK", type: "float", labelKey: "plugin.shaderPlayground.Core sharpness", min: 4, max: 80, step: 1, default: 28 },
		{ key: "uMidK", type: "float", labelKey: "plugin.shaderPlayground.Mid sharpness", min: 1, max: 40, step: 0.5, default: 8 },
		{ key: "uGlowK", type: "float", labelKey: "plugin.shaderPlayground.Glow sharpness", min: 0.2, max: 12, step: 0.1, default: 1.8 },
	],
};
