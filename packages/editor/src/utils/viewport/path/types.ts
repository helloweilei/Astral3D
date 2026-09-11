import type { MeasurePointInfo } from "../measure/types";

/** 绘制路径状态 */
export interface PathDrawState {
	points: MeasurePointInfo[];
	/** 路径长度（米）：绘制中为折线长，生成后为平滑曲线弧长；不足 2 点为 null */
	length: number | null;
	/** 是否仍在绘制中 */
	picking: boolean;
	/** 是否已生成流动路径 */
	generated: boolean;
}

export type PathDrawListener = (state: PathDrawState) => void;
