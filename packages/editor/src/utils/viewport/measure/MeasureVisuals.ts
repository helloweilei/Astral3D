import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { createCircleMesh } from "@astral3d/engine";

export const MEASURE_ACCENT_COLOR = 0xe63c17;

export const MEASURE_LINE_MATERIAL = new THREE.LineBasicMaterial({
	color: MEASURE_ACCENT_COLOR,
	linewidth: 2,
	transparent: true,
	opacity: 0.95,
	depthTest: false,
	depthWrite: false,
});

/** 长度格式化为可读米制字符串（不含单位） */
export function formatMeasureLength(dist: number): string {
	if (dist < 0.01) return dist.toFixed(4);
	if (dist < 0.1) return dist.toFixed(3);
	return dist.toFixed(2);
}

/** 创建测距/测面共用的屏幕朝向圆点 */
export function createMeasureMarker(point: THREE.Vector3, color = MEASURE_ACCENT_COLOR): THREE.Mesh {
	const mesh = createCircleMesh({
		innerColor: new THREE.Color(0xffffff),
		strokeColor: new THREE.Color(color),
		radius: 6,
		strokeWidth: 4,
		align: "billboard",
	});
	mesh.position.copy(point);
	mesh.renderOrder = 999;
	(mesh as any).ignore = true;
	mesh.frustumCulled = false;
	mesh.userData.measureMarker = true;
	return mesh;
}

/** 将标记缩放到近似固定屏幕像素，并朝向相机 */
export function applyMeasureMarkerScale(marker: THREE.Object3D, camera: THREE.Camera, canvasHeight: number, radiusPx = 10) {
	const cam = camera as THREE.PerspectiveCamera;
	marker.quaternion.copy(cam.quaternion);
	const dist = cam.position.distanceTo(marker.position);
	const h = canvasHeight || 800;
	const fov = cam.isPerspectiveCamera ? cam.fov : 50;
	const worldPerPixel = (2 * dist * Math.tan(THREE.MathUtils.degToRad(fov / 2))) / h;
	marker.scale.setScalar(Math.max(0.05, worldPerPixel * radiusPx));
}

export function createMeasureLine(points: THREE.Vector3[], material = MEASURE_LINE_MATERIAL): THREE.Line {
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const line = new THREE.Line(geometry, material.clone());
	line.renderOrder = 998;
	(line as any).ignore = true;
	line.frustumCulled = false;
	return line;
}

export function setMeasureLinePoints(line: THREE.Line, points: THREE.Vector3[]) {
	// 点数变化时必须换新 BufferGeometry，仅改 needsUpdate 无法扩展 draw 范围
	const prev = line.geometry;
	line.geometry = new THREE.BufferGeometry().setFromPoints(points);
	prev.dispose();
}

export function createMeasureLabel(text: string, className = "viewport-measure-label"): CSS2DObject {
	const div = document.createElement("div");
	div.className = className;
	div.textContent = text;
	div.style.cssText = [
		"padding:2px 4px",
		"border-radius:4px",
		"background:rgba(20,24,32,0.82)",
		"color:#fff",
		"font-size:9px",
		"font-weight:400",
		"white-space:nowrap",
		"border:1px solid rgba(230,60,23,0.85)",
		"pointer-events:none",
		"user-select:none",
	].join(";");

	const obj = new CSS2DObject(div);
	(obj as any).ignore = true;
	return obj;
}

export function updateMeasureLabelText(label: CSS2DObject, text: string) {
	if (label.element) label.element.textContent = text;
}

export function disposeMeasureObject(object: THREE.Object3D) {
	object.traverse(child => {
		const mesh = child as THREE.Mesh;
		if (mesh.geometry) mesh.geometry.dispose();
		const material = mesh.material;
		if (Array.isArray(material)) {
			material.forEach(m => m.dispose());
		} else if (material) {
			material.dispose();
		}
		const css2d = child as CSS2DObject;
		if (css2d.element) {
			css2d.element.parentNode?.removeChild(css2d.element);
		}
	});
}
