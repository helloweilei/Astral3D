import { Object3D, Box3, Vector3 } from "three";

export function distanceToGround(object: Object3D) {
	const box = new Box3().setFromObject(object);
	return box.min.y;
}

/**
 * 把物体整体抬/降到地面。
 * 地形开启时贴地形表面，否则贴 y=0 地平面。
 * 以包围盒底面为准，而不是物体原点。
 */
export function snapObjectToGround(object: Object3D) {
	const anyObject = object as Object3D & { isLight?: boolean; isCamera?: boolean };
	if (anyObject.isLight || anyObject.isCamera) return;

	object.updateWorldMatrix(true, true);
	const box = new Box3().setFromObject(object);
	if (box.isEmpty() || !Number.isFinite(box.min.y)) return;

	const center = box.getCenter(new Vector3());
	let groundY = 0;
	const terrain = (globalThis as { viewer?: { modules?: { terrain?: { pickSurfaceHeight?: (x: number, z: number) => number | null } } } }).viewer?.modules?.terrain;
	const height = terrain?.pickSurfaceHeight?.(center.x, center.z);
	if (typeof height === "number") groundY = height;

	const delta = groundY - box.min.y;
	if (Math.abs(delta) < 1e-3) return;
	object.position.y += delta;
}
