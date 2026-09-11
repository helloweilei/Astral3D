import * as THREE from "three";
import { t } from "@/language";
import { BaseMeasureTool } from "./measure/BaseMeasureTool";
import {
	createMeasureLabel,
	createMeasureLine,
	createMeasureMarker,
	disposeMeasureObject,
	setMeasureLinePoints,
} from "./measure/MeasureVisuals";
import {
	advanceFlowPath,
	createFlowPath,
	setFlowPathSpeed,
	FLOW_PATH_END_COLOR,
	FLOW_PATH_START_COLOR,
} from "./path/FlowPathVisuals";
import type { PathDrawListener, PathDrawState } from "./path/types";

export type { PathDrawState, PathDrawListener } from "./path/types";

/**
 * 视口绘制路径：绘制阶段与测距一致（依次打点 + 折线预览），
 * 双击或 UI「完成」后把折线换成起点→终点的平滑路径，并带流动箭头指示方向。
 */
export class PathDrawTool extends BaseMeasureTool {
	private listener: PathDrawListener | null = null;
	/** 绘制阶段的折线 */
	private draftLine: THREE.Line | null = null;
	/** 完成后生成的流动路径 */
	private flowMesh: THREE.Mesh | null = null;
	/** 生成后的平滑曲线弧长（米） */
	private generatedLength: number | null = null;
	private speed = 0.7;
	private ticking = false;
	private readonly clock = new THREE.Clock();

	protected get groupName() {
		return "ViewportPathDraw";
	}

	protected canAddMorePoints() {
		return this.picking;
	}

	override onFlushPreview() {}

	open(listener: PathDrawListener) {
		this.listener = listener;
		this.beginSession();
		this.startTick();
	}

	close() {
		this.listener = null;
		this.stopTick();
		this.endSession();
	}

	override finishPicking() {
		if (!this.picking) return;
		super.finishPicking();
		this.generateFlowPath();
		this.emitState();
	}

	override dispose() {
		this.listener = null;
		this.stopTick();
		super.dispose();
	}

	/** 流动速度倍率 */
	setSpeed(speed: number) {
		this.speed = speed;
		if (this.flowMesh) setFlowPathSpeed(this.flowMesh, speed);
		this.dirty = true;
	}

	protected clearBusinessVisuals() {
		this.draftLine = null;
		this.flowMesh = null;
		this.generatedLength = null;
	}

	protected onPointAdded() {
		this.syncDraftLine();
	}

	protected emitState() {
		const state: PathDrawState = {
			points: this.points.map(p => this.toPointInfo(p)),
			length: this.generatedLength ?? this.polylineLength(),
			picking: this.picking,
			generated: !!this.flowMesh,
		};
		this.listener?.(state);
	}

	/** 绘制阶段的折线长度 */
	private polylineLength(): number | null {
		if (this.points.length < 2) return null;

		let total = 0;
		for (let i = 1; i < this.points.length; i++) {
			total += this.points[i - 1].distanceTo(this.points[i]);
		}
		return Number(total.toFixed(2));
	}

	private syncDraftLine() {
		if (!this.group || this.points.length < 2) return;

		if (!this.draftLine) {
			this.draftLine = createMeasureLine(this.points);
			this.group.add(this.draftLine);
		} else {
			setMeasureLinePoints(this.draftLine, this.points);
		}
		this.draftLine.frustumCulled = false;
		this.draftLine.visible = true;
	}

	/** 折线 + 打点标记替换为流动路径与起终点标记 */
	private generateFlowPath() {
		if (!this.group || this.points.length < 2) return;

		if (this.draftLine) {
			this.group.remove(this.draftLine);
			disposeMeasureObject(this.draftLine);
			this.draftLine = null;
		}
		for (const child of [...this.group.children]) {
			if (child.userData.measureMarker) {
				this.group.remove(child);
				disposeMeasureObject(child);
			}
		}

		const terrain = window.viewer?.modules?.terrain;
		const sampleHeight = terrain ? (x: number, z: number) => terrain.pickSurfaceHeight(x, z) : undefined;
		const { mesh, length } = createFlowPath(this.points, { speed: this.speed, sampleHeight });
		this.flowMesh = mesh;
		this.generatedLength = Number(length.toFixed(2));
		this.group.add(mesh);

		this.addEndpoint(this.points[0], FLOW_PATH_START_COLOR, t("layout.scene.tools.Start"));
		this.addEndpoint(this.points[this.points.length - 1], FLOW_PATH_END_COLOR, t("layout.scene.tools.End"));

		this.dirty = true;
	}

	private addEndpoint(point: THREE.Vector3, color: number, text: string) {
		if (!this.group) return;

		const marker = createMeasureMarker(point, color);
		this.applyMarkerScale(marker);
		this.group.add(marker);

		const label = createMeasureLabel(text);
		// 锚在标签左下角附近，避免挡住端点圆点
		label.center.set(-0.1, 1.3);
		label.position.copy(point);
		label.element.style.borderColor = `#${color.toString(16).padStart(6, "0")}`;
		this.group.add(label);
	}

	private startTick() {
		if (this.ticking) return;
		this.ticking = true;
		// 丢弃上次停止到本次开始之间累计的时间
		this.clock.getDelta();
		window.viewer?.addEventListener("afterAnimation", this.onTick as any);
	}

	private stopTick() {
		if (!this.ticking) return;
		this.ticking = false;
		window.viewer?.removeEventListener("afterAnimation", this.onTick as any);
	}

	private readonly onTick = (event: { toBeRender: (need?: boolean) => void }) => {
		// 无论是否有路径都要取走 delta，否则下次会一次性跳变
		const dt = this.clock.getDelta();
		if (!this.flowMesh) return;

		advanceFlowPath(this.flowMesh, dt);
		event.toBeRender(true);
	};
}
