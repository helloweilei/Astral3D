import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { BaseMeasureTool } from "./measure/BaseMeasureTool";
import type { AreaMeasureListener, AreaMeasureState } from "./measure/types";
import {
	createMeasureArea,
	createMeasureLabel,
	createMeasureLine,
	disposeMeasureObject,
	formatMeasureLength,
	setMeasureAreaPoints,
	setMeasureLinePoints,
	updateMeasureLabelText,
} from "./measure/MeasureVisuals";

export type { MeasurePointInfo, DistanceMeasureState, DistanceMeasureListener } from "./measure/types";

/**
 * 视口多点测距：依次打点，相邻点显示段距离，末点旁显示总距离。
 * 双击或 UI「完成」结束拾取；测面积可复用 BaseMeasureTool + MeasureVisuals。
 */
export class AreaMeasureTool extends BaseMeasureTool {
	private listener: AreaMeasureListener | null = null;
	private pathLine: THREE.Line | null = null;
	private fillMesh: THREE.Mesh | null = null;
	private totalLabel: CSS2DObject | null = null;
	private _anotherTempLine: THREE.Line | null = null;

	protected get groupName() {
		return "ViewportAreaMeasure";
	}

	protected canAddMorePoints() {
		return this.picking;
	}

	protected override clearTemp() {
		if (this._anotherTempLine) {
			this.scene?.remove(this._anotherTempLine);
			disposeMeasureObject(this._anotherTempLine);
			this._anotherTempLine = null;
		}
		super.clearTemp();
	}

	override onFlushPreview(mouseMovePoint: THREE.Vector3) {
		if (this.points.length >= 2) {
			if (!this._anotherTempLine) {
				this._anotherTempLine = createMeasureLine([this.points[0], mouseMovePoint]);
				this.scene?.add(this._anotherTempLine);
			} else {
				setMeasureLinePoints(this._anotherTempLine, [this.points[0], mouseMovePoint]);
			}
			this.syncFillMesh([...this.points, mouseMovePoint]);
		}
	}

	open(listener: AreaMeasureListener) {
		this.listener = listener;
		this.beginSession();
	}

	close() {
		this.listener = null;
		this.endSession();
	}

	override reset() {
		this.pathLine = null;
		this.fillMesh = null;
		this.totalLabel = null;
		super.reset();
	}

	override finishPicking() {
		super.finishPicking();
		this.syncPathLine(true);
		this.syncTotalLabel();
		this.syncFillMesh();
	}

	override dispose() {
		this.listener = null;
		if (this.fillMesh) {
			this.group?.remove(this.fillMesh);
			disposeMeasureObject(this.fillMesh);
			this.fillMesh = null;
		}
		if (this.pathLine) {
			this.group?.remove(this.pathLine);
			disposeMeasureObject(this.pathLine);
			this.pathLine = null;
		}
		super.dispose();
	}

	protected clearBusinessVisuals() {
		this.pathLine = null;
		this.fillMesh = null;
		this.totalLabel = null;
	}

	protected onPointAdded(_point: THREE.Vector3) {
		if (!this.group) return;
		this.syncPathLine();
		this.syncFillMesh();
	}

	// 计算空间多边形面积
	private calculateArea() {
		if (this.points.length < 3) return null;
		let totalArea = 0;
		let point0 = this.points[0];
		for (let i = 1; i < this.points.length - 1; i++) {
			const a = this.points[i];
			const b = this.points[i + 1];
			const area = new THREE.Vector3();
			area.crossVectors(a.clone().sub(point0), b.clone().sub(point0));
			totalArea += area.length() / 2;
		}
		return totalArea;
	}

	protected emitState() {
		const points = this.points.map(p => this.toPointInfo(p));
		const area = !this.picking ? this.calculateArea() : undefined;

		const state: AreaMeasureState = {
			points,
			area,
			picking: this.picking,
		};
		this.listener?.(state);
	}

	private syncPathLine(close = false) {
		if (!this.group || this.points.length < 2) return;

		if (!this.pathLine) {
			this.pathLine = createMeasureLine(this.points, undefined, close);
			this.group.add(this.pathLine);
		} else {
			setMeasureLinePoints(this.pathLine, this.points, close);
		}
		// 确保折线始终参与渲染（包围体过期时也可能被裁掉）
		this.pathLine.frustumCulled = false;
		this.pathLine.visible = true;
	}

	private syncFillMesh(points?: THREE.Vector3[]) {
		if (!this.group) return;
		const areaPoints = points || this.points;
		if (areaPoints.length < 3) return;
		if (!this.fillMesh) {
			this.fillMesh = createMeasureArea(areaPoints);
			this.group.add(this.fillMesh);
		} else {
			setMeasureAreaPoints(this.fillMesh, areaPoints);
		}
	}

	private syncTotalLabel() {
		if (!this.group) return;

		if (this.points.length < 3) {
			if (this.totalLabel) {
				this.group.remove(this.totalLabel);
				this.totalLabel.element?.parentNode?.removeChild(this.totalLabel.element);
				this.totalLabel = null;
			}
			return;
		}

		const area = this.calculateArea();
		const text = `面积： ${formatMeasureLength(area ?? 0)} m²`;

		if (!this.totalLabel) {
			this.totalLabel = createMeasureLabel(text, "viewport-measure-label viewport-measure-label--total");
			this.group.add(this.totalLabel);
		} else {
			updateMeasureLabelText(this.totalLabel, text);
		}
		const center = new THREE.Vector3();
		for (const p of this.points) center.add(p);
		center.divideScalar(this.points.length);
		this.totalLabel.position.copy(center);
	}
}
