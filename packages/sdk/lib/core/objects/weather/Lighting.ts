/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2025/01/09
 * @description 贴相机闪电：分形电弧丝带（芯+光晕）+ 天空闪照回击
 */
import * as THREE from "three";
import type CameraControls from "camera-controls";

interface ILightningOption {
	speed: number;
	density: number;
	size: number;
	alpha: number;
	color?: string;
}

interface IStrikeState {
	cooldown: number;
	phase: number;
	intensity: number;
	strokesLeft: number;
	nextStrokeIn: number;
	totalStrokes: number;
	flicker: number;
}

type Pt = { x: number; y: number };

function hash(n: number): number {
	const x = Math.sin(n * 127.1) * 43758.5453;
	return x - Math.floor(x);
}

/** 中点位移分形折线，更接近真实电弧 */
function fractalPolyline(a: Pt, b: Pt, depth: number, seed: number, roughness: number): Pt[] {
	if (depth <= 0) return [a, b];
	const mid: Pt = {
		x: (a.x + b.x) * 0.5,
		y: (a.y + b.y) * 0.5,
	};
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.hypot(dx, dy) || 1e-4;
	const px = -dy / len;
	const py = dx / len;
	const offset = (hash(seed) - 0.5) * 2 * roughness * len;
	mid.x += px * offset;
	mid.y += py * offset;
	const left = fractalPolyline(a, mid, depth - 1, seed * 1.7 + 3.1, roughness * 0.72);
	const right = fractalPolyline(mid, b, depth - 1, seed * 2.3 + 5.9, roughness * 0.72);
	return left.slice(0, -1).concat(right);
}

function buildBoltPolylines(seed: number, size: number): { points: Pt[]; width: number }[] {
	const paths: { points: Pt[]; width: number }[] = [];
	const startX = (hash(seed) - 0.5) * 1.0;
	const endX = startX + (hash(seed + 2) - 0.5) * 0.35;
	const main = fractalPolyline({ x: startX, y: 1.08 }, { x: endX, y: -0.35 }, 4, seed + 11, 0.55);
	paths.push({ points: main, width: THREE.MathUtils.lerp(0.012, 0.028, size) });

	// 分支偏少：沿主干稀疏取样，二级分叉更罕见
	const branchChance = THREE.MathUtils.lerp(0.12, 0.28, THREE.MathUtils.clamp(size, 0, 1));
	const step = Math.max(4, Math.floor(main.length / 5));
	for (let i = 4; i < main.length - 3; i += step) {
		if (hash(seed + i * 17.3) > branchChance) continue;
		const p = main[i];
		const side = hash(seed + i * 29) > 0.5 ? 1 : -1;
		const len = 0.14 + hash(seed + i * 41) * 0.22;
		const end: Pt = {
			x: p.x + side * len * (0.55 + hash(seed + i * 7) * 0.5),
			y: p.y - len * (0.45 + hash(seed + i * 9) * 0.55),
		};
		const branch = fractalPolyline(p, end, 2, seed + i * 50, 0.4);
		paths.push({
			points: branch,
			width: THREE.MathUtils.lerp(0.006, 0.014, size) * (0.55 + hash(seed + i) * 0.35),
		});

		if (hash(seed + i * 61) > 0.82 && branch.length > 3) {
			const bp = branch[Math.floor(branch.length * 0.45)];
			const s2 = side * (hash(seed + i * 71) > 0.5 ? 1 : -1);
			const len2 = len * (0.3 + hash(seed + i * 81) * 0.25);
			const end2: Pt = {
				x: bp.x + s2 * len2 * 0.7,
				y: bp.y - len2 * 0.55,
			};
			paths.push({
				points: fractalPolyline(bp, end2, 1, seed + i * 90, 0.35),
				width: THREE.MathUtils.lerp(0.004, 0.008, size),
			});
		}
	}

	if (hash(seed + 99) > 0.78) {
		const sx = (hash(seed + 100) - 0.5) * 1.2;
		const weak = fractalPolyline({ x: sx, y: 1.0 }, { x: sx + (hash(seed + 101) - 0.5) * 0.4, y: 0.15 }, 4, seed + 110, 0.5);
		paths.push({ points: weak, width: THREE.MathUtils.lerp(0.006, 0.012, size) });
	}

	return paths;
}

/** 将折线挤成带 UV 的丝带三角带（clip-space） */
function pathsToRibbonGeometry(paths: { points: Pt[]; width: number }[]): THREE.BufferGeometry {
	const positions: number[] = [];
	const uvs: number[] = [];
	const along: number[] = [];

	for (const path of paths) {
		const pts = path.points;
		if (pts.length < 2) continue;
		const half = path.width * 0.5;
		let distAcc = 0;

		for (let i = 0; i < pts.length - 1; i++) {
			const a = pts[i];
			const b = pts[i + 1];
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const len = Math.hypot(dx, dy) || 1e-4;
			const nx = (-dy / len) * half;
			const ny = (dx / len) * half;

			const taperA = 1 - (i / (pts.length - 1)) * 0.35;
			const taperB = 1 - ((i + 1) / (pts.length - 1)) * 0.35;

			// 两三角形：aL aR bR / aL bR bL
			const aLx = a.x - nx * taperA;
			const aLy = a.y - ny * taperA;
			const aRx = a.x + nx * taperA;
			const aRy = a.y + ny * taperA;
			const bLx = b.x - nx * taperB;
			const bLy = b.y - ny * taperB;
			const bRx = b.x + nx * taperB;
			const bRy = b.y + ny * taperB;

			const u0 = distAcc;
			distAcc += len;
			const u1 = distAcc;

			positions.push(aLx, aLy, 0, aRx, aRy, 0, bRx, bRy, 0);
			uvs.push(0, 0, 1, 0, 1, 1);
			along.push(u0, u0, u1);

			positions.push(aLx, aLy, 0, bRx, bRy, 0, bLx, bLy, 0);
			uvs.push(0, 0, 1, 1, 0, 1);
			along.push(u0, u1, u1);
		}
	}

	const geom = new THREE.BufferGeometry();
	geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
	geom.setAttribute("along", new THREE.Float32BufferAttribute(along, 1));
	return geom;
}

export default class Lightning {
	options: ILightningOption;
	mesh: THREE.Group;
	controls: CameraControls;

	private flashMesh: THREE.Mesh;
	private boltMesh: THREE.Mesh;
	private boltGeom: THREE.BufferGeometry;
	private flashMat: THREE.ShaderMaterial;
	private boltMat: THREE.ShaderMaterial;
	private state: IStrikeState;
	private boltSeed = 1;
	private time = 0;

	constructor(option: ILightningOption, controls: CameraControls) {
		const defaultOption: ILightningOption = {
			speed: 1.0,
			density: 1.0,
			size: 0.5,
			alpha: 0.85,
			color: "#d7e9ff",
		};

		this.options = Object.assign({}, defaultOption, option);
		this.controls = controls;

		this.state = {
			cooldown: 0,
			phase: 0,
			intensity: 0,
			strokesLeft: 0,
			nextStrokeIn: 0,
			totalStrokes: 0,
			flicker: 1,
		};

		this.mesh = new THREE.Group();
		this.mesh.name = "Lightning";
		this.mesh.frustumCulled = false;
		this.mesh.renderOrder = 999;

		const color = new THREE.Color(this.options.color || "#d7e9ff");

		this.flashMat = new THREE.ShaderMaterial({
			transparent: true,
			depthTest: false,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			toneMapped: false,
			uniforms: {
				uIntensity: { value: 0 },
				uColor: { value: color.clone() },
				uAlpha: { value: this.options.alpha },
				uResolution: {
					value: new THREE.Vector2(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio),
				},
				uFlicker: { value: 1 },
			},
			vertexShader: `
				void main() {
					gl_Position = vec4(position.xy, 0.0, 1.0);
				}
			`,
			fragmentShader: `
				uniform float uIntensity;
				uniform vec3 uColor;
				uniform float uAlpha;
				uniform vec2 uResolution;
				uniform float uFlicker;
				void main() {
					vec2 q = gl_FragCoord.xy / max(uResolution, vec2(1.0));
					float sky = pow(smoothstep(0.0, 0.85, q.y), 1.15);
					float vig = 1.0 - 0.35 * length((q - vec2(0.5, 0.55)) * vec2(1.2, 1.0));
					float a = uIntensity * uAlpha * uFlicker;
					if (a < 0.001) discard;
					vec3 col = uColor * sky * vig * (0.55 + 0.9 * uIntensity);
					// 地平线更亮一点，模拟云底反射
					col += uColor * pow(sky, 2.5) * 0.45 * uIntensity;
					gl_FragColor = vec4(col * a, 1.0);
				}
			`,
		});

		this.flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.flashMat);
		this.flashMesh.frustumCulled = false;
		this.flashMesh.renderOrder = 998;
		this.flashMesh.visible = false;

		this.boltGeom = new THREE.BufferGeometry();
		this.boltMat = new THREE.ShaderMaterial({
			transparent: true,
			depthTest: false,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			toneMapped: false,
			side: THREE.DoubleSide,
			uniforms: {
				uIntensity: { value: 0 },
				uColor: { value: color.clone() },
				uAlpha: { value: this.options.alpha },
				uFlicker: { value: 1 },
				uTime: { value: 0 },
			},
			vertexShader: `
				attribute float along;
				varying vec2 vUv;
				varying float vAlong;
				void main() {
					vUv = uv;
					vAlong = along;
					gl_Position = vec4(position.xy, 0.0, 1.0);
				}
			`,
			fragmentShader: `
				uniform float uIntensity;
				uniform vec3 uColor;
				uniform float uAlpha;
				uniform float uFlicker;
				uniform float uTime;
				varying vec2 vUv;
				varying float vAlong;

				void main() {
					// uv.x: 0..1 横向（中心为 0.5）；用距离做芯 + 宽光晕
					float d = abs(vUv.x - 0.5) * 2.0;
					float core = exp(-d * d * 28.0);
					float mid = exp(-d * d * 8.0) * 0.55;
					float glow = exp(-d * d * 1.8) * 0.35;
					float filament = 0.85 + 0.15 * sin(vAlong * 40.0 + uTime * 30.0);
					float shape = (core * 1.4 + mid + glow) * filament;

					float a = shape * uIntensity * uAlpha * uFlicker;
					if (a < 0.004) discard;

					vec3 hot = vec3(1.0, 1.0, 1.0);
					vec3 cool = mix(uColor, vec3(0.65, 0.82, 1.0), 0.45);
					vec3 col = mix(cool, hot, core);
					col *= (0.9 + 1.4 * core) * uIntensity;

					gl_FragColor = vec4(col * a, 1.0);
				}
			`,
		});

		this.boltMesh = new THREE.Mesh(this.boltGeom, this.boltMat);
		this.boltMesh.frustumCulled = false;
		this.boltMesh.renderOrder = 999;
		this.boltMesh.visible = false;

		this.mesh.add(this.flashMesh);
		this.mesh.add(this.boltMesh);

		this.rebuildBolt(1);
		this.updatePosition();
	}

	private rebuildBolt(seed: number) {
		this.boltSeed = seed;
		const paths = buildBoltPolylines(seed, this.options.size);
		// 外层加宽光晕丝带
		const glowPaths = paths.map(p => ({
			points: p.points,
			width: p.width * 4.5,
		}));
		const all = glowPaths.concat(paths);
		const next = pathsToRibbonGeometry(all);
		this.boltMesh.geometry.dispose();
		this.boltMesh.geometry = next;
		this.boltGeom = next;
	}

	private triggerStrike() {
		const d = Math.max(0.05, this.options.density);
		const baseGap = THREE.MathUtils.lerp(3.8, 0.7, THREE.MathUtils.clamp(d / 2, 0, 1));
		this.state.cooldown = (baseGap / Math.max(this.options.speed, 0.05)) * (0.55 + hash(this.boltSeed + 9) * 0.9);

		this.state.phase = 1;
		this.state.totalStrokes = 1 + Math.floor(hash(this.boltSeed + 3) * 2.6);
		this.state.strokesLeft = this.state.totalStrokes;
		this.state.nextStrokeIn = 0;
		this.rebuildBolt(Math.floor(hash(performance.now() * 0.001 + this.boltSeed) * 100000));
		this.fireStroke();
	}

	private fireStroke() {
		const strokeIndex = this.state.totalStrokes - this.state.strokesLeft;
		const peak = strokeIndex === 0 ? 1.0 : 0.4 + hash(this.boltSeed + strokeIndex) * 0.45;
		this.state.intensity = Math.max(this.state.intensity, peak);
		this.state.nextStrokeIn = 0.035 + hash(this.boltSeed + 7 + strokeIndex) * 0.12;
		this.state.strokesLeft -= 1;
	}

	updatePosition() {
		if (this.controls && this.mesh) {
			const center = this.controls.getTarget(new THREE.Vector3());
			this.mesh.position.copy(center);
			this.mesh.position.y = 0;
		}
	}

	updateOptions(option: Partial<ILightningOption>) {
		Object.assign(this.options, option);
		const color = new THREE.Color(this.options.color || "#d7e9ff");
		this.flashMat.uniforms.uColor.value.copy(color);
		this.flashMat.uniforms.uAlpha.value = this.options.alpha;
		this.boltMat.uniforms.uColor.value.copy(color);
		this.boltMat.uniforms.uAlpha.value = this.options.alpha;
	}

	update(deltaTime: number) {
		this.updatePosition();

		const dt = Math.min(Math.max(deltaTime, 0), 0.1);
		this.time += dt;
		const res = this.flashMat.uniforms.uResolution.value as THREE.Vector2;
		res.set(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio);

		if (this.state.phase === 0) {
			this.state.cooldown -= dt;
			if (this.state.cooldown <= 0) this.triggerStrike();
		} else {
			const decay = 11 / Math.max(this.options.size, 0.2);
			this.state.intensity *= Math.exp(-dt * decay);
			// 高频微闪烁
			this.state.flicker = 0.82 + 0.18 * Math.sin(this.time * 90 + this.boltSeed) * Math.sin(this.time * 37);

			this.state.nextStrokeIn -= dt;
			if (this.state.strokesLeft > 0 && this.state.nextStrokeIn <= 0) {
				this.fireStroke();
				if (hash(this.boltSeed + this.state.strokesLeft) > 0.4) {
					this.rebuildBolt(this.boltSeed + 19 + this.state.strokesLeft);
				}
			}

			if (this.state.strokesLeft <= 0 && this.state.intensity < 0.02) {
				this.state.phase = 0;
				this.state.intensity = 0;
				this.state.flicker = 1;
			}
		}

		const inten = this.state.intensity;
		const flick = this.state.phase ? this.state.flicker : 1;
		this.flashMat.uniforms.uIntensity.value = inten * 0.95;
		this.flashMat.uniforms.uFlicker.value = flick;
		this.boltMat.uniforms.uIntensity.value = inten;
		this.boltMat.uniforms.uFlicker.value = flick;
		this.boltMat.uniforms.uTime.value = this.time;
		this.flashMesh.visible = inten > 0.001;
		this.boltMesh.visible = inten > 0.001;
	}

	dispose() {
		this.flashMesh.geometry.dispose();
		this.flashMat.dispose();
		this.boltGeom.dispose();
		this.boltMat.dispose();
		this.mesh.removeFromParent();
	}
}
