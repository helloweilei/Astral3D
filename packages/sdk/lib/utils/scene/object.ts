import { Object3D, Box3 } from "three";

export function distanceToGround(object: Object3D) {
	const box = new Box3().setFromObject(object);
	return box.min.y;
}
