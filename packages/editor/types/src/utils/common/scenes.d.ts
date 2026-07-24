import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons';
export interface IModel extends THREE.Object3D {
    metadata: Object;
}
export declare function getMaterialName(material: any): any;
export declare function getObjectType(object: any): "Scene" | "Camera" | "Light" | "Mesh" | "Line" | "Points" | "Object3D";
/**
 * 获取当前选中模型 path
 */
export declare function getSelectedModelPath(): string;
export declare function screenToWorld(x: number, y: number): THREE.Vector3;
export declare function reBufferGeometryUv(geometry: THREE.BufferGeometry): void;
export declare function setUserData(object: IModel, key: string, value: any): void;
export declare function setMetaData(object: IModel, key: string, value: any): void;
/**
 * 创建基础场景（会用于轻量展示）
 */
export declare function createBasicScene(container: HTMLElement): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    dispose: () => void;
};
