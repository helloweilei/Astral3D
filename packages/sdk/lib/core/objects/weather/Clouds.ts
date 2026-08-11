/**
 * @description 多层水平云层：随相机距离缩放 + 视角/边缘软化，减轻缩放时的“薄片假感”
 */
import * as THREE from "three";
import type CameraControls from "camera-controls";

export interface ICloudsOption {
	color: string;
	/** 云层厚度/浓度（0–1） */
	thickness: number;
	/** 云层高度（世界 Y） */
	height: number;
	/** 漂移速度 */
	speed: number;
	/** 覆盖密度（0–1） */
	density: number;
	/** 整体透明度（0–1） */
	alpha: number;
	/** 噪声缩放（云朵大小，越大云朵越大） */
	scale: number;
}

/** 基准平面边长；实际尺度会随相机距离放大，避免看见硬边 */
const BASE_PLANE_SIZE = 2000;
const LAYER_COUNT = 3;

export default class Clouds {
	options: ICloudsOption;
	/** 对外兼容：挂到场景的根对象 */
	mesh: THREE.Group;
	controls: CameraControls;

	private layers: THREE.Mesh[] = [];
	private readonly _camPos = new THREE.Vector3();
	private readonly _target = new THREE.Vector3();

	constructor(option: Partial<ICloudsOption>, controls: CameraControls) {
		const defaultOption: ICloudsOption = {
			color: "#ffffff",
			thickness: 0.55,
			height: 180,
			speed: 0.15,
			density: 0.55,
			alpha: 0.75,
			scale: 1.0,
		};

		this.options = Object.assign({}, defaultOption, option);
		this.controls = controls;
		this.mesh = this.createMesh();
		(this.mesh as any).ignore = true;
		this.updatePosition();
	}

	createMesh() {
		const group = new THREE.Group();
		group.name = "WeatherClouds";
		group.renderOrder = 50;

		const sharedGeo = new THREE.PlaneGeometry(BASE_PLANE_SIZE, BASE_PLANE_SIZE, 1, 1);
		sharedGeo.rotateX(-Math.PI / 2);

		for (let i = 0; i < LAYER_COUNT; i++) {
			const layerT = i / (LAYER_COUNT - 1); // 0..1
			const material = new THREE.ShaderMaterial({
				transparent: true,
				depthWrite: false,
				depthTest: true,
				side: THREE.DoubleSide,
				uniforms: {
					u_time: { value: 0.0 },
					u_camPos: { value: new THREE.Vector3() },
					u_layer: { value: layerT },
					color: { value: new THREE.Color(this.options.color) },
					thickness: { value: this.options.thickness },
					speed: { value: this.options.speed },
					density: { value: this.options.density },
					alpha: { value: this.options.alpha },
					scale: { value: this.options.scale },
					height: { value: this.options.height },
				},
				vertexShader: /* glsl */ `
					varying vec2 vUv;
					varying vec3 vWorldPos;
					void main() {
						vUv = uv;
						vec4 worldPos = modelMatrix * vec4(position, 1.0);
						vWorldPos = worldPos.xyz;
						gl_Position = projectionMatrix * viewMatrix * worldPos;
					}
				`,
				fragmentShader: /* glsl */ `
					uniform float u_time;
					uniform vec3 u_camPos;
					uniform float u_layer;
					uniform vec3 color;
					uniform float thickness;
					uniform float speed;
					uniform float density;
					uniform float alpha;
					uniform float scale;
					uniform float height;
					varying vec2 vUv;
					varying vec3 vWorldPos;

					float hash(vec2 p) {
						p = fract(p * vec2(123.34, 456.21));
						p += dot(p, p + 45.32);
						return fract(p.x * p.y);
					}

					float noise(vec2 p) {
						vec2 i = floor(p);
						vec2 f = fract(p);
						float a = hash(i);
						float b = hash(i + vec2(1.0, 0.0));
						float c = hash(i + vec2(0.0, 1.0));
						float d = hash(i + vec2(1.0, 1.0));
						vec2 u = f * f * (3.0 - 2.0 * f);
						return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
					}

					float fbm(vec2 p) {
						float v = 0.0;
						float a = 0.5;
						mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
						for (int i = 0; i < 5; i++) {
							v += a * noise(p);
							p = m * p;
							a *= 0.5;
						}
						return v;
					}

					void main() {
						// 各层不同漂移/缩放，形成视差厚度感
						float layerSpeed = speed * (0.55 + u_layer * 0.9);
						float layerScale = max(scale, 0.05) * (1.0 + u_layer * 0.35);
						vec2 drift = vec2(u_time * layerSpeed * 0.07, u_time * layerSpeed * 0.04);
						drift += u_layer * vec2(19.7, 7.3);

						vec2 uv = vWorldPos.xz * (0.0016 / layerScale) + drift;
						float n = fbm(uv);
						float n2 = fbm(uv * 2.15 + 13.0 + u_layer * 5.0);
						float cloud = mix(n, n2, 0.4);

						float threshold = mix(0.78, 0.32, clamp(density, 0.0, 1.0));
						float soft = mix(0.42, 0.12, clamp(thickness, 0.0, 1.0));
						float mask = smoothstep(threshold - soft, threshold + soft * 0.45, cloud);
						mask = pow(mask, mix(1.5, 0.75, thickness));

						// 平面径向软边：避免看见方形硬边界
						float radial = length(vUv - vec2(0.5)) * 2.0;
						float edgeFade = 1.0 - smoothstep(0.62, 0.98, radial);

						// 视角软化：接近侧视时变淡，减少“纸片”感
						vec3 viewDir = normalize(u_camPos - vWorldPos);
						float facing = abs(dot(viewDir, vec3(0.0, 1.0, 0.0)));
						float angleFade = smoothstep(0.04, 0.28, facing);

						// 相机贴近云层时淡出，避免穿片
						float distY = abs(u_camPos.y - height);
						float nearFade = smoothstep(3.0, 55.0, distY);

						float layerAlpha = mix(0.35, 1.0, 1.0 - abs(u_layer - 0.5) * 1.2);
						float a = mask * alpha * mix(0.4, 1.0, thickness) * edgeFade * angleFade * nearFade * layerAlpha;
						if (a < 0.012) discard;

						vec3 col = color * (0.7 + 0.4 * cloud);
						// 下层略暗，增强体积感
						col *= mix(0.82, 1.08, u_layer);
						gl_FragColor = vec4(col, a);
					}
				`,
			});

			const mesh = new THREE.Mesh(sharedGeo, material);
			mesh.frustumCulled = false;
			mesh.renderOrder = 50 + i;
			(mesh as any).ignore = true;
			this.layers.push(mesh);
			group.add(mesh);
		}

		return group;
	}

	private syncLayerHeights() {
		const t = this.options.thickness;
		const h = this.options.height;
		// 厚度越大，层间距越大（世界单位）
		const span = 12 + t * 70;
		for (let i = 0; i < this.layers.length; i++) {
			const tLayer = i / (LAYER_COUNT - 1);
			this.layers[i].position.y = (tLayer - 0.5) * span;
		}
		this.mesh.position.y = h;
	}

	updatePosition() {
		if (!this.controls || !this.mesh) return;
		this.controls.getPosition(this._camPos);
		this.controls.getTarget(this._target);

		// 水平跟随相机，高度用配置
		this.mesh.position.x = this._camPos.x;
		this.mesh.position.z = this._camPos.z;
		this.syncLayerHeights();

		// 随视距放大平面，缩放时尽量不露出边缘
		const dist = Math.max(30, this._camPos.distanceTo(this._target));
		const worldSize = Math.max(BASE_PLANE_SIZE, dist * 10);
		const s = worldSize / BASE_PLANE_SIZE;
		this.mesh.scale.set(s, 1, s);

		for (const layer of this.layers) {
			const mat = layer.material as THREE.ShaderMaterial;
			mat.uniforms.u_camPos.value.copy(this._camPos);
			mat.uniforms.height.value = this.options.height;
		}
	}

	updateOptions(option: Partial<ICloudsOption>) {
		for (const key in option) {
			const k = key as keyof ICloudsOption;
			const value = option[k];
			if (value === undefined) continue;
			(this.options as any)[k] = value;

			for (const layer of this.layers) {
				const mat = layer.material as THREE.ShaderMaterial;
				if (k === "height") continue;
				if (!mat.uniforms[k]) continue;
				if (k === "color") {
					mat.uniforms.color.value = new THREE.Color(value as string);
				} else {
					mat.uniforms[k].value = value;
				}
			}
		}
		this.updatePosition();
	}

	update(deltaTime: number) {
		this.updatePosition();
		for (const layer of this.layers) {
			const mat = layer.material as THREE.ShaderMaterial;
			mat.uniforms.u_time.value += deltaTime;
		}
	}

	dispose() {
		for (const layer of this.layers) {
			(layer.material as THREE.Material).dispose();
			layer.removeFromParent();
		}
		// 几何共享，只 dispose 一次
		if (this.layers[0]) {
			this.layers[0].geometry.dispose();
		}
		this.layers = [];
		this.mesh.removeFromParent();
	}
}
