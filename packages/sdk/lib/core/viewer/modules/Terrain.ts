import * as THREE from "three";
import { useAddSignal, useRemoveSignal } from "@/hooks";
import App from "@/core/app/App";
import Viewer from "../Viewer";
import { ImageryLayer } from "@/core/objects/terrain/ImageryLayer";
import { Tiles3DLayer } from "@/core/objects/terrain/Tiles3DLayer";
import {
	enuToWgs84,
	setEnuOrigin,
	wgs84ToEnu,
	type Wgs84Coord,
} from "@/utils/geo/GeoUtils";

let _terrainSettingsChangedFn: (() => void) | null = null;

export class Terrain {
	private viewer: Viewer;
	private imageryLayer: ImageryLayer | null = null;
	private tiles3DLayer: Tiles3DLayer | null = null;
	private gridVisibleBeforeTerrain = true;

	constructor(viewer: Viewer) {
		this.viewer = viewer;

		_terrainSettingsChangedFn = this.applySettings.bind(this);
		useAddSignal("sceneTerrainSettingsChanged", _terrainSettingsChangedFn);
	}

	init() {
		this.applySettings();
	}

	private getTerrainConfig(): IAppProject.Terrain {
		return App.project.getKey("terrain");
	}

	private getOrigin(): Wgs84Coord {
		const origin = this.getTerrainConfig().origin;
		return {
			longitude: origin.longitude,
			latitude: origin.latitude,
			height: origin.height,
		};
	}

	applySettings() {
		const config = this.getTerrainConfig();
		setEnuOrigin(this.getOrigin());

		if (!config.enabled) {
			this.disableTerrain();
			this.requestRender();
			return;
		}

		this.enableTerrain(config);
		this.updateGeoAnchoredObjects();
		this.requestRender();
	}

	private requestRender() {
		if (this.viewer.modules?.effect) {
			this.viewer.render();
		}
	}

	private enableTerrain(config: IAppProject.Terrain) {
		if (this.viewer.grid) {
			this.gridVisibleBeforeTerrain = this.viewer.grid.visible;
			if (config.hideGrid) {
				this.viewer.grid.visible = false;
			}
		}

		const origin = this.getOrigin();
		let imageryJustEnabled = false;

		if (config.imagery.enabled) {
			if (!this.imageryLayer) {
				this.imageryLayer = new ImageryLayer(origin, config.imagery);
				this.viewer.scene.add(this.imageryLayer.group);
				imageryJustEnabled = true;
			} else {
				this.imageryLayer.updateConfig(origin, config.imagery);
			}
			this.ensureCameraFarForImagery();
			if (imageryJustEnabled) {
				this.flyToRegion();
			}
		} else if (this.imageryLayer) {
			this.viewer.scene.remove(this.imageryLayer.group);
			this.imageryLayer.dispose();
			this.imageryLayer = null;
		}

		if (config.tiles3d.enabled && config.tiles3d.url) {
			if (!this.tiles3DLayer) {
				this.tiles3DLayer = new Tiles3DLayer(this.viewer, origin, config.tiles3d);
				this.viewer.scene.add(this.tiles3DLayer.group);
			} else {
				this.tiles3DLayer.updateConfig(origin, config.tiles3d);
			}
		} else if (this.tiles3DLayer) {
			this.viewer.scene.remove(this.tiles3DLayer.group);
			this.tiles3DLayer.dispose();
			this.tiles3DLayer = null;
		}
	}

	private disableTerrain() {
		if (this.imageryLayer) {
			this.viewer.scene.remove(this.imageryLayer.group);
			this.imageryLayer.dispose();
			this.imageryLayer = null;
		}

		if (this.tiles3DLayer) {
			this.viewer.scene.remove(this.tiles3DLayer.group);
			this.tiles3DLayer.dispose();
			this.tiles3DLayer = null;
		}

		if (this.viewer.grid) {
			this.viewer.grid.visible = this.viewer.options.grid.enabled
				? this.gridVisibleBeforeTerrain
				: false;
		}
	}

	updateGeoAnchoredObjects() {
		const origin = this.getOrigin();
		setEnuOrigin(origin);

		this.viewer.scene.traverse(obj => {
			const geoAnchor = obj.userData?.geoAnchor as Wgs84Coord | undefined;
			if (!geoAnchor) return;

			const enu = wgs84ToEnu(
				{
					longitude: geoAnchor.longitude,
					latitude: geoAnchor.latitude,
					height: geoAnchor.height ?? 0,
				},
				origin
			);
			obj.position.set(enu.x, enu.y, enu.z);
		});
	}

	private ensureCameraFarForImagery(): boolean {
		if (!this.imageryLayer) return false;

		const origin = this.getOrigin();
		const target = new THREE.Vector3();
		this.viewer.modules.controls.getTarget(target);
		const viewDistance = this.viewer.camera.position.distanceTo(target);
		const requiredFar = this.imageryLayer.getRequiredCameraFar(this.viewer.camera, origin, {
			viewDistance,
			target,
		});

		if (requiredFar <= this.viewer.camera.far) return false;

		this.viewer.camera.far = requiredFar;
		this.viewer.camera.updateProjectionMatrix();
		return true;
	}

	update(_delta: number): boolean {
		const config = this.getTerrainConfig();
		if (!config.enabled) return false;

		let needRender = false;
		const origin = this.getOrigin();
		const target = new THREE.Vector3();
		this.viewer.modules.controls.getTarget(target);
		const viewDistance = this.viewer.camera.position.distanceTo(target);

		if (this.imageryLayer) {
			const imageryContext = { viewDistance, target };
			if (this.ensureCameraFarForImagery()) {
				needRender = true;
			}

			needRender =
				this.imageryLayer.update(this.viewer.camera, origin, imageryContext) || needRender;
		}

		if (this.tiles3DLayer) {
			needRender = this.tiles3DLayer.update() || needRender;
		}

		return needRender;
	}

	getCurrentImageryLevel(): number {
		return this.imageryLayer?.getCurrentLevel() ?? -1;
	}

	flyToRegion() {
		const config = this.getTerrainConfig();
		const { bounds } = config.imagery;
		const { origin } = config;
		const centerLon = (bounds.west + bounds.east) / 2;
		const centerLat = (bounds.south + bounds.north) / 2;
		const enu = wgs84ToEnu(
			{ longitude: centerLon, latitude: centerLat, height: 0 },
			{
				longitude: origin.longitude,
				latitude: origin.latitude,
				height: origin.height,
			}
		);

		const lonSpan = Math.abs(bounds.east - bounds.west);
		const latSpan = Math.abs(bounds.north - bounds.south);
		const distance = Math.max(lonSpan, latSpan) * 111320 * 1.5;

		const controls = this.viewer.modules.controls;
		controls.setLookAt(
			enu.x + distance * 0.6,
			distance * 0.5,
			enu.z + distance * 0.6,
			enu.x,
			enu.y,
			enu.z,
			true
		);
	}

	estimateBoundsFromCamera(): IAppProject.Terrain["imagery"]["bounds"] {
		const target = new THREE.Vector3();
		this.viewer.modules.controls.getTarget(target);
		const origin = this.getOrigin();
		const wgs84 = enuToWgs84({ x: target.x, y: target.y, z: target.z }, origin);
		const offset = 0.005;

		return {
			west: wgs84.longitude - offset,
			south: wgs84.latitude - offset,
			east: wgs84.longitude + offset,
			north: wgs84.latitude + offset,
		};
	}

	pickSurfaceHeight(x: number, z: number): number | null {
		const config = this.getTerrainConfig();
		if (!config.enabled) return null;

		const raycaster = new THREE.Raycaster();
		const origin = new THREE.Vector3(x, 10000, z);
		const direction = new THREE.Vector3(0, -1, 0);
		raycaster.set(origin, direction);

		const targets: THREE.Object3D[] = [];
		if (this.imageryLayer) {
			targets.push(...this.imageryLayer.getPickTargets());
		}
		if (this.tiles3DLayer) {
			targets.push(...this.tiles3DLayer.getPickTargets());
		}

		const hits = raycaster.intersectObjects(targets, true);
		if (hits.length > 0) {
			return hits[0].point.y;
		}

		return 0;
	}

	get tiles3dLoadState() {
		return this.tiles3DLayer?.loadState ?? "idle";
	}

	get tiles3dErrorMessage() {
		return this.tiles3DLayer?.errorMessage ?? "";
	}

	setObjectGeoAnchor(object: THREE.Object3D, anchor: Wgs84Coord | null) {
		if (anchor) {
			object.userData.geoAnchor = { ...anchor };
			const enu = wgs84ToEnu(anchor, this.getOrigin());
			object.position.set(enu.x, enu.y, enu.z);
		} else {
			delete object.userData.geoAnchor;
		}
	}

	dispose() {
		if (_terrainSettingsChangedFn) {
			useRemoveSignal("sceneTerrainSettingsChanged", _terrainSettingsChangedFn);
		}
		this.disableTerrain();
	}
}
