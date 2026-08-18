import type { Topic } from "../../types";
import { DEFAULT_VERTEX_FULLSCREEN } from "../../types";
import solidColorDoc from "./solid-color.md?raw";
import meetUvDoc from "./meet-uv.md?raw";
import screenVsUvDoc from "./screen-vs-uv.md?raw";

export const beginnerSolidColor: Topic = {
	id: "beginner.solid-color",
	grade: "beginner",
	order: 10,
	titleKey: "plugin.shaderPlayground.Solid color",
	summaryKey: "plugin.shaderPlayground.Solid color summary",
	hintKey: "plugin.shaderPlayground.Solid color hint",
	docMarkdown: solidColorDoc,
	geometry: "fullscreen",
	vertex: DEFAULT_VERTEX_FULLSCREEN,
	fragment: /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  // 每个像素都会跑一遍 main；这里整屏同一颜色
  // 也可写注释色：#5b8def
  gl_FragColor = vec4(uColor * uIntensity, 1.0);
}
`,
	uniforms: [
		{ key: "uColor", type: "color", labelKey: "plugin.shaderPlayground.Color", default: "#5b8def" },
		{ key: "uIntensity", type: "float", labelKey: "plugin.shaderPlayground.Intensity", min: 0, max: 2, step: 0.05, default: 1 },
	],
};

export const beginnerUvGradient: Topic = {
	id: "beginner.uv-gradient",
	grade: "beginner",
	order: 20,
	titleKey: "plugin.shaderPlayground.Meet UV",
	summaryKey: "plugin.shaderPlayground.Meet UV summary",
	hintKey: "plugin.shaderPlayground.Meet UV hint",
	docMarkdown: meetUvDoc,
	geometry: "uvPlane",
	vertex: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
	fragment: /* glsl */ `
varying vec2 vUv;
uniform float uIntensity;

void main() {
  // vUv 来自几何：左下约 (0,0)，右上约 (1,1)
  vec3 col = vec3(vUv.x, vUv.y, 0.4) * uIntensity;
  gl_FragColor = vec4(col, 1.0);
}
`,
	uniforms: [
		{ key: "uIntensity", type: "float", labelKey: "plugin.shaderPlayground.Intensity", min: 0, max: 2, step: 0.05, default: 1 },
	],
};

export const beginnerScreenVsUv: Topic = {
	id: "beginner.screen-vs-uv",
	grade: "beginner",
	order: 30,
	titleKey: "plugin.shaderPlayground.Screen vs UV",
	summaryKey: "plugin.shaderPlayground.Screen vs UV summary",
	hintKey: "plugin.shaderPlayground.Screen vs UV hint",
	docMarkdown: screenVsUvDoc,
	geometry: "fullscreen",
	vertex: DEFAULT_VERTEX_FULLSCREEN,
	fragment: /* glsl */ `
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  // 屏幕像素坐标归一化（和闪电闪照类似）
  vec2 q = gl_FragCoord.xy / max(uResolution, vec2(1.0));
  // 左：屏幕坐标；右：mesh UV —— 对比两种「坐标」
  vec3 left = vec3(q.x, q.y, 0.2);
  vec3 right = vec3(vUv.x, vUv.y, 0.2);
  vec3 col = mix(left, right, step(0.5, vUv.x));
  // 中间分割线
  col = mix(col, vec3(1.0), smoothstep(0.002, 0.0, abs(vUv.x - 0.5)));
  gl_FragColor = vec4(col, 1.0);
}
`,
	uniforms: [],
};
