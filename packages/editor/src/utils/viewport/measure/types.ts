import type * as THREE from "three";

/** 地形开启时附带经纬度/高度 */
export interface MeasurePointInfo {
	longitude?: number;
	latitude?: number;
	height?: number;
}

/** 测距状态（多点折线） */
export interface DistanceMeasureState {
	points: MeasurePointInfo[];
	/** 相邻两点间距离（米），length = points.length - 1 */
	segments: number[];
	/** 折线总长（米）；不足 2 点时为 null */
	total: number | null;
	/** 是否仍在拾取中 */
	picking: boolean;
}

/** 测面积状态（多点多边形） */
export interface AreaMeasureState {
	points: MeasurePointInfo[];
	/** 多边形面积（平方米）；不足 3 点时为 null */
	area?: number | null;
	/** 是否仍在拾取中 */
	picking: boolean;
}

export type DistanceMeasureListener = (state: DistanceMeasureState) => void;
export type AreaMeasureListener = (state: AreaMeasureState) => void;
/** 场景世界坐标点（内部绘制用） */
export type MeasureWorldPoint = THREE.Vector3;
