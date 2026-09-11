import * as THREE from "three";

/** 路径主体色 */
export const FLOW_PATH_COLOR = 0x1f7ae0;
/** 流动箭头色 */
export const FLOW_PATH_ARROW_COLOR = 0xdaf3ff;
/** 起点标记色 */
export const FLOW_PATH_START_COLOR = 0x14b86a;
/** 终点标记色 */
export const FLOW_PATH_END_COLOR = 0xe63c17;

const vertexShader = /* glsl */ `
	varying vec2 vUv;

	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const fragmentShader = /* glsl */ `
	precision highp float;

	varying vec2 vUv;

	uniform float uTime;
	uniform float uSpeed;
	uniform float uRepeat;
	uniform vec3 uColor;
	uniform vec3 uArrowColor;
	uniform float uOpacity;

	void main() {
		// 横向：中心实、两侧收边
		float across = abs(vUv.x - 0.5) * 2.0;
		float band = 1.0 - smoothstep(0.74, 1.0, across);
		if (band <= 0.0) discard;

		// 沿路径循环推进：uTime 增大即由起点流向终点
		float seg = fract(vUv.y * uRepeat - uTime * uSpeed);

		// 箭头：中心比两侧更靠前，构成指向终点的 V 形
		float target = 0.62 - 0.34 * across;
		float d = abs(seg - target);
		// 跨周期取近端，避免箭头在接缝被切断
		d = min(d, 1.0 - d);

		float arrow = 1.0 - smoothstep(0.0, 0.09, d);
		float trail = (1.0 - smoothstep(0.09, 0.32, d)) * 0.5;

		vec3 color = mix(uColor, uArrowColor, clamp(arrow + trail * 0.4, 0.0, 1.0));
		float alpha = (0.3 + arrow * 0.62 + trail * 0.22) * band * uOpacity;
		gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
	}
`;

export interface FlowPathOptions {
	/** 路径宽度（米）；缺省按路径长度自适应 */
	width?: number;
	/** 流动速度倍率 */
	speed?: number;
	/** 沿路径采样段数 */
	segments?: number;
	/** 采样点贴地高度回调，返回 null 表示保留曲线高度 */
	sampleHeight?: (x: number, z: number) => number | null | undefined;
}

export interface FlowPathResult {
	mesh: THREE.Mesh;
	/** 路径弧长（米） */
	length: number;
	/** 实际使用的宽度（米） */
	width: number;
}

function buildCurve(points: THREE.Vector3[]): THREE.Curve<THREE.Vector3> {
	const cloned = points.map(p => p.clone());
	if (cloned.length === 2) {
		return new THREE.LineCurve3(cloned[0], cloned[1]);
	}
	return new THREE.CatmullRomCurve3(cloned, false, "catmullrom", 0.5);
}

/**
 * 沿采样点生成水平带状几何：u 为横向(0~1)，v 为沿程(0~1，起点→终点)。
 * 采样点等弧长，箭头间距才会均匀。
 */
function buildRibbonGeometry(samples: THREE.Vector3[], halfWidth: number, lift: number) {
	const count = samples.length;
	const positions = new Float32Array(count * 2 * 3);
	const uvs = new Float32Array(count * 2 * 2);
	const indices: number[] = [];

	const tangent = new THREE.Vector3();
	const normal = new THREE.Vector3();
	const up = new THREE.Vector3(0, 1, 0);
	const fallback = new THREE.Vector3(1, 0, 0);

	for (let i = 0; i < count; i++) {
		const point = samples[i];
		const prev = samples[Math.max(0, i - 1)];
		const next = samples[Math.min(count - 1, i + 1)];

		tangent.copy(next).sub(prev);
		if (tangent.lengthSq() < 1e-10) tangent.copy(fallback);
		tangent.normalize();

		// 与 up 叉乘得到水平法线，路径始终平铺在地面上
		normal.crossVectors(tangent, up);
		if (normal.lengthSq() < 1e-10) normal.copy(fallback);
		normal.normalize().multiplyScalar(halfWidth);

		const v = count > 1 ? i / (count - 1) : 0;
		const po = i * 6;
		positions[po] = point.x - normal.x;
		positions[po + 1] = point.y + lift;
		positions[po + 2] = point.z - normal.z;
		positions[po + 3] = point.x + normal.x;
		positions[po + 4] = point.y + lift;
		positions[po + 5] = point.z + normal.z;

		const uo = i * 4;
		uvs[uo] = 0;
		uvs[uo + 1] = v;
		uvs[uo + 2] = 1;
		uvs[uo + 3] = v;

		if (i < count - 1) {
			const a = i * 2;
			indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
		}
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	return geometry;
}

/** 生成带流动箭头的路径网格（不入场景树，由调用方挂载） */
export function createFlowPath(points: THREE.Vector3[], options: FlowPathOptions = {}): FlowPathResult {
	const curve = buildCurve(points);
	const length = Math.max(curve.getLength(), 1e-4);

	// 场景尺度差异大，宽度随路径长度自适应，箭头密度才不会失真
	const width = options.width ?? THREE.MathUtils.clamp(length * 0.03, 0.2, 24);
	const segments = options.segments ?? THREE.MathUtils.clamp(points.length * 24, 48, 600);
	// repeat 取整，v=0 与 v=1 处图案才能无缝衔接
	const repeat = THREE.MathUtils.clamp(Math.round(length / (width * 2.4)), 3, 240);

	const samples = curve.getSpacedPoints(segments);
	if (options.sampleHeight) {
		// 地形起伏时让路径贴着地表，而不是在控制点之间凌空插值
		for (const sample of samples) {
			const y = options.sampleHeight(sample.x, sample.z);
			if (y !== null && y !== undefined && Number.isFinite(y)) sample.y = y;
		}
	}
	const geometry = buildRibbonGeometry(samples, width / 2, Math.max(0.05, width * 0.04));

	const material = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uSpeed: { value: options.speed ?? 1 },
			uRepeat: { value: repeat },
			uColor: { value: new THREE.Color(FLOW_PATH_COLOR) },
			uArrowColor: { value: new THREE.Color(FLOW_PATH_ARROW_COLOR) },
			uOpacity: { value: 1 },
		},
		vertexShader,
		fragmentShader,
		transparent: true,
		side: THREE.DoubleSide,
		// 与测量图形一致：始终压在场景之上，避免与地形穿插闪烁
		depthTest: false,
		depthWrite: false,
	});
	material.name = "FlowPathMaterial";

	const mesh = new THREE.Mesh(geometry, material);
	mesh.name = "FlowPath";
	mesh.renderOrder = 997;
	(mesh as any).ignore = true;
	mesh.frustumCulled = false;

	return { mesh, length, width };
}

/** 推进流动动画（dt 为秒） */
export function advanceFlowPath(mesh: THREE.Mesh, dt: number) {
	const material = mesh.material as THREE.ShaderMaterial;
	if (!material?.uniforms?.uTime) return;
	material.uniforms.uTime.value = (material.uniforms.uTime.value + dt) % 1e6;
}

export function setFlowPathSpeed(mesh: THREE.Mesh, speed: number) {
	const material = mesh.material as THREE.ShaderMaterial;
	if (!material?.uniforms?.uSpeed) return;
	material.uniforms.uSpeed.value = speed;
}
