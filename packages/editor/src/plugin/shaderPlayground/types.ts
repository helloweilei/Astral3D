/**
 * 着色器沙盒：难度固定三档，知识点可无限扩展
 */
export type GradeId = "beginner" | "intermediate" | "advanced";

export type GeometryKind = "fullscreen" | "uvPlane" | "sphere";

export type BlendingKind = "normal" | "additive";

export interface TopicUniform {
	key: string;
	type: "float" | "color";
	/** i18n key under plugin.shaderPlayground.* */
	labelKey: string;
	min?: number;
	max?: number;
	step?: number;
	default: number | string;
}

export interface Topic {
	id: string;
	grade: GradeId;
	order: number;
	titleKey: string;
	/** 页脚短摘要（i18n） */
	summaryKey: string;
	hintKey?: string;
	/**
	 * 完整知识点文档（Markdown）。
	 * 可通过「新标签预览」打开；扩展时建议用 `xxx.md?raw` 引入。
	 */
	docMarkdown: string;
	geometry: GeometryKind;
	blending?: BlendingKind;
	vertex: string;
	fragment: string;
	uniforms: TopicUniform[];
}

export const GRADE_ORDER: GradeId[] = ["beginner", "intermediate", "advanced"];

export const DEFAULT_VERTEX_MVP = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const DEFAULT_VERTEX_FULLSCREEN = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
