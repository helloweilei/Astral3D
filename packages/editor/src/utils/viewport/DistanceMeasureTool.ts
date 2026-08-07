import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { BaseMeasureTool } from "./measure/BaseMeasureTool";
import type { DistanceMeasureListener, DistanceMeasureState } from "./measure/types";
import { createMeasureLabel, createMeasureLine, formatMeasureLength, setMeasureLinePoints, updateMeasureLabelText } from "./measure/MeasureVisuals";

export type { MeasurePointInfo, DistanceMeasureState, DistanceMeasureListener } from "./measure/types";

/**
 * 视口多点测距：依次打点，相邻点显示段距离，末点旁显示总距离。
 * 双击或 UI「完成」结束拾取；测面积可复用 BaseMeasureTool + MeasureVisuals。
 */
export class DistanceMeasureTool extends BaseMeasureTool {
	private listener: DistanceMeasureListener | null = null;
	private pathLine: THREE.Line | null = null;
	private segmentLabels: CSS2DObject[] = [];
	private totalLabel: CSS2DObject | null = null;

	protected get groupName() {
		return "ViewportDistanceMeasure";
	}

	protected canAddMorePoints() {
		return this.picking;
	}

	open(listener: DistanceMeasureListener) {
		this.listener = listener;
		this.beginSession();
	}

	close() {
		this.listener = null;
		this.endSession();
	}

	override reset() {
		this.pathLine = null;
		this.segmentLabels = [];
		this.totalLabel = null;
		super.reset();
	}

	override finishPicking() {
		super.finishPicking();
	}

	override dispose() {
		this.listener = null;
		super.dispose();
	}

	protected clearBusinessVisuals() {
		this.pathLine = null;
		this.segmentLabels = [];
		this.totalLabel = null;
	}

	protected onPointAdded(_point: THREE.Vector3) {
		if (!this.group) return;
		this.syncPathLine();
		this.syncSegmentLabels();
		this.syncTotalLabel();
	}

	protected emitState() {
		const points = this.points.map(p => this.toPointInfo(p));
		const segments: number[] = [];
		for (let i = 1; i < this.points.length; i++) {
			segments.push(Number(this.points[i - 1].distanceTo(this.points[i]).toFixed(2)));
		}
		const total = segments.length > 0 ? Number(segments.reduce((a, b) => a + b, 0).toFixed(2)) : null;

		const state: DistanceMeasureState = {
			points,
			segments,
			total,
			picking: this.picking,
		};
		this.listener?.(state);
	}

	private syncPathLine() {
		if (!this.group || this.points.length < 2) return;

		if (!this.pathLine) {
			this.pathLine = createMeasureLine(this.points);
			this.group.add(this.pathLine);
		} else {
			setMeasureLinePoints(this.pathLine, this.points);
		}
		// 确保折线始终参与渲染（包围体过期时也可能被裁掉）
		this.pathLine.frustumCulled = false;
		this.pathLine.visible = true;
	}

	private syncSegmentLabels() {
		if (!this.group) return;

		const need = Math.max(0, this.points.length - 1);
		while (this.segmentLabels.length > need) {
			const label = this.segmentLabels.pop()!;
			this.group.remove(label);
			label.element?.parentNode?.removeChild(label.element);
		}

		for (let i = 0; i < need; i++) {
			const a = this.points[i];
			const b = this.points[i + 1];
			const dist = a.distanceTo(b);
			const mid = a.clone().add(b).multiplyScalar(0.5);
			const text = `${formatMeasureLength(dist)} m`;

			let label = this.segmentLabels[i];
			if (!label) {
				label = createMeasureLabel(text);
				this.segmentLabels.push(label);
				this.group.add(label);
			} else {
				updateMeasureLabelText(label, text);
			}
			label.position.copy(mid);
		}
	}

	private readonly _totalOffset = new THREE.Vector3();

	private syncTotalLabel() {
		if (!this.group) return;

		if (this.points.length < 2) {
			if (this.totalLabel) {
				this.group.remove(this.totalLabel);
				this.totalLabel.element?.parentNode?.removeChild(this.totalLabel.element);
				this.totalLabel = null;
			}
			return;
		}

		let total = 0;
		for (let i = 1; i < this.points.length; i++) {
			total += this.points[i - 1].distanceTo(this.points[i]);
		}
		const last = this.points[this.points.length - 1];
		const prev = this.points[this.points.length - 2];
		const text = `总距离： ${formatMeasureLength(total)} m`;

		if (!this.totalLabel) {
			this.totalLabel = createMeasureLabel(text, "viewport-measure-label viewport-measure-label--total");
			// 锚在标签左下角附近，整体落在点的右上方，不挡住终点圆点
			this.totalLabel.center.set(-0.05, 1.2);
			this.group.add(this.totalLabel);
		} else {
			updateMeasureLabelText(this.totalLabel, text);
		}

		// 沿末段方向外延一小段，再略抬高，保证在终点「旁边」
		this._totalOffset.copy(last).sub(prev);
		this._totalOffset.y = 0;
		if (this._totalOffset.lengthSq() < 1e-6) {
			this._totalOffset.set(1, 0, 0);
		} else {
			this._totalOffset.normalize();
		}
		const along = Math.max(8, last.distanceTo(prev) * 0.04);
		this.totalLabel.position.copy(last).addScaledVector(this._totalOffset, along);
		this.totalLabel.position.y = last.y + Math.max(2, along * 0.15);
	}
}
