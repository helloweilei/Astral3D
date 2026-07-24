import * as THREE from 'three';
import { ClippedEdgesBox, Measure, ModelExplode, Roaming, MiniMap } from "@astral3d/engine";
export declare class MenuOperation {
    static InitControlsState: string;
    static lastRoadCameraPos: THREE.Vector3;
    static lastRoadCameraTarget: THREE.Vector3;
    static explodeLayer: number;
    static explodeModel: THREE.Object3D | null;
    static _clippedEdgesBox: ClippedEdgesBox | null;
    static _measure: Measure | null;
    static _explode: ModelExplode | null;
    static _roaming: Roaming | null;
    static _miniMap: MiniMap | null;
    static Init(key: string): void;
    static get ClippedEdgesBox(): ClippedEdgesBox;
    static get Measure(): Measure;
    static get Explode(): ModelExplode;
    static get Roaming(): Roaming;
    static get MiniMap(): MiniMap;
    /**
     * 还原视角
     */
    static toHome(): void;
    /**
     * 自动旋转
     */
    static autoRotate(): void;
    /**
     * 剖切
     */
    static cutting(): void;
    static distance(): void;
    static angle(): void;
    static area(): void;
    static clearMeasure(): void;
    static explode(): void;
    static roaming(): void;
    static enterRoaming(): void;
    static leaveRoaming(): void;
    static miniMap(): void;
    static settings(): void;
    static fullscreen(): void;
    static exitFullscreen(): void;
}
