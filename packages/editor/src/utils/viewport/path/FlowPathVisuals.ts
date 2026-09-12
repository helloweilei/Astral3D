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
		// vUv.x 表示路径宽度方向上的位置：
		// 左边缘为 0.0，中心为 0.5，右边缘为 1.0。
		// 减去 0.5 后取绝对值，再乘以 2，可将它转换成：
		// 路径中心为 0.0，左右两侧边缘都为 1.0。
		float across = abs(vUv.x - 0.5) * 2.0;

		// smoothstep(0.74, 1.0, across) 会在路径宽度的 74% 到边缘之间
		// 从 0 平滑变化到 1。用 1.0 减去它后，效果正好相反：
		// 路径中间保持不透明，越靠近左右边缘越透明，从而得到柔和的边缘。
		float band = 1.0 - smoothstep(0.74, 1.0, across);

		// 当前像素已经完全透明时，直接停止处理该像素。
		// 这样既不会绘制路径外部的像素，也可以减少一些无意义的计算。
		if (band <= 0.0) discard;

		// vUv.y 表示当前像素在整条路径上的位置：
		// 起点为 0.0，终点为 1.0。
		// uRepeat 决定整条路径上重复显示多少组箭头；
		// uTime 是不断增加的动画时间；uSpeed 控制移动速度。
		// fract() 只保留小数部分，将结果始终限制在 0.0 到 1.0，
		// 所以箭头到达一个周期末尾后会回到开头，形成连续循环的流动效果。
		// 这里使用减号，是为了让图案沿 vUv.y 增大的方向移动，
		// 也就是从路径起点朝终点移动。
		float seg = fract(vUv.y * uRepeat - uTime * uSpeed);

		// target 表示箭头亮线在当前横向位置上应该出现的位置。
		// 路径中心 across=0 时，target 为 0.62；
		// 越靠近左右两侧，target 越小，最低接近 0.28。
		// 因此中心部分比两侧更靠前，组合起来就形成一个指向终点的 V 形箭头。
		float target = 0.62 - 0.34 * across;

		// 计算当前像素的循环位置 seg 与箭头亮线 target 之间的距离。
		// 距离越小，说明该像素越接近箭头主体。
		float d = abs(seg - target);

		// 动画周期的 0.0 和 1.0 实际上是相连的。
		// 例如 seg=0.98、target=0.02 时，直接相减的距离是 0.96，
		// 但跨过周期接缝后的真实距离只有 0.04。
		// 取普通距离和跨接缝距离中的较小值，可避免箭头经过接缝时被切断。
		d = min(d, 1.0 - d);

		// arrow 是箭头主体的亮度遮罩：
		// d=0 时最亮；距离增加到 0.09 时平滑衰减为 0。
		float arrow = 1.0 - smoothstep(0.0, 0.09, d);

		// trail 是箭头周围更宽、更暗的光晕。
		// 它在 0.09 到 0.32 的范围内逐渐消失，并乘以 0.5 降低亮度，
		// 让流动效果不会只剩下一条边缘生硬的细线。
		float trail = (1.0 - smoothstep(0.09, 0.32, d)) * 0.5;

		// 在路径基础色 uColor 和箭头高亮色 uArrowColor 之间混合。
		// 箭头主体提供主要混合强度，光晕只贡献 40%，
		// clamp 确保混合系数始终处于 0.0 到 1.0。
		vec3 color = mix(uColor, uArrowColor, clamp(arrow + trail * 0.4, 0.0, 1.0));

		// 计算最终透明度：
		// 0.3 是路径底色的基础透明度；
		// arrow 和 trail 分别提高箭头主体及光晕位置的透明度；
		// band 让路径左右边缘柔和淡出；
		// uOpacity 用于从外部统一控制整条路径的透明度。
		float alpha = (0.3 + arrow * 0.62 + trail * 0.22) * band * uOpacity;

		// 输出当前像素的最终颜色和透明度。
		// 再次使用 clamp，防止多个透明度数值相加后超过 1.0。
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

/**
 * 沿用户点击的折线生成路径曲线。
 * 不使用 CatmullRom 平滑：急弯处样条会向外过冲，偏离绘制预览的折线。
 */
function buildCurve(points: THREE.Vector3[]): THREE.Curve<THREE.Vector3> {
	const cloned = points.map(p => p.clone());
	if (cloned.length === 2) {
		return new THREE.LineCurve3(cloned[0], cloned[1]);
	}
	const path = new THREE.CurvePath<THREE.Vector3>();
	for (let i = 0; i < cloned.length - 1; i++) {
		path.add(new THREE.LineCurve3(cloned[i], cloned[i + 1]));
	}
	return path;
}

/**
 * 根据路径中心线上的一组采样点，生成一条有宽度的带状网格。
 *
 * 可以把它想象成：先沿路径摆放很多根短横杆，再把相邻横杆的端点连接起来，
 * 最终组成一条连续的“道路”。每个采样点都会生成左、右两个顶点：
 *
 *   左0 ----- 右0
 *    |  \      |
 *   左1 ----- 右1
 *    |  \      |
 *   左2 ----- 右2
 *
 * 相邻两排顶点组成一个四边形，而 WebGL 只能直接绘制三角形，
 * 所以每个四边形还要拆成两个三角形。
 *
 * UV 坐标会同时写入几何体，供片元着色器绘制流动箭头：
 * - U（uv.x）：路径宽度方向，左边为 0，右边为 1。
 * - V（uv.y）：路径前进方向，起点为 0，终点为 1。
 *
 * `samples` 应尽量是等弧长采样点。这样 V 坐标在空间中分布得更均匀，
 * 着色器绘制出的箭头间距和移动速度才不会在弯道处忽快忽慢。
 *
 * @param samples 路径中心线上的采样点，按起点到终点的顺序排列
 * @param halfWidth 路径宽度的一半，用于从中心点向左右各偏移一次
 * @param lift 整条路径向上抬升的距离，用于避免路径与地面重叠闪烁
 * @returns 可直接用于 THREE.Mesh 的带状 BufferGeometry
 */
function buildRibbonGeometry(samples: THREE.Vector3[], halfWidth: number, lift: number) {
	const count = samples.length;

	// 每个采样点生成左、右两个顶点。
	// 一个顶点的位置包含 x、y、z 三个数字，因此数组长度是：
	// 采样点数量 × 2 个顶点 × 3 个坐标值。
	const positions = new Float32Array(count * 2 * 3);

	// 每个顶点还需要 u、v 两个纹理坐标，因此数组长度是：
	// 采样点数量 × 2 个顶点 × 2 个 UV 值。
	const uvs = new Float32Array(count * 2 * 2);

	// indices 不直接保存坐标，而是保存顶点编号。
	// 每连续三个编号构成一个三角形。
	const indices: number[] = [];

	// tangent：路径在当前采样点处的前进方向。
	// normal：路径的横向方向，用来计算左右两侧顶点。
	// 这些 Vector3 放在循环外复用，避免每次循环都创建新对象。
	const tangent = new THREE.Vector3();
	const normal = new THREE.Vector3();

	// 当前项目以 Y 轴为向上方向。
	const up = new THREE.Vector3(0, 1, 0);

	// 当前后采样点完全重合，无法算出方向时，使用 X 轴作为备用方向。
	const fallback = new THREE.Vector3(1, 0, 0);

	for (let i = 0; i < count; i++) {
		// point 是当前中心点。
		// prev 和 next 分别取前后相邻点。
		// 第一个点没有前一点，所以用它自己；最后一个点同理。
		const point = samples[i];
		const prev = samples[Math.max(0, i - 1)];
		const next = samples[Math.min(count - 1, i + 1)];

		// next - prev 得到路径经过当前点的大致前进方向。
		// 中间点同时参考前后两个点，转弯处会比只参考一侧更平滑。
		tangent.copy(next).sub(prev);

		// 如果前后点重合，向量长度接近 0，normalize() 无法得到可靠方向，
		// 此时改用备用的 X 轴方向。
		if (tangent.lengthSq() < 1e-10) tangent.copy(fallback);

		// 单位化后，tangent 的长度变成 1，只保留方向。
		tangent.normalize();

		// 前进方向 tangent 与世界向上方向 up 做叉乘，
		// 得到一个垂直于前进方向、且位于水平面内的横向向量 normal。
		// 这个横向向量就是道路从中心指向一侧的方向。
		normal.crossVectors(tangent, up);

		// 当路径几乎垂直向上时，tangent 与 up 平行，叉乘结果会接近 0；
		// 同样用备用方向避免产生无效顶点。
		if (normal.lengthSq() < 1e-10) normal.copy(fallback);

		// 先把横向向量单位化，再乘以半宽。
		// 此后 point - normal 是左侧顶点，point + normal 是右侧顶点。
		normal.normalize().multiplyScalar(halfWidth);

		// 当前点在整条路径上的归一化进度：
		// 第一个点为 0，最后一个点为 1，中间点按索引均匀分布。
		// 它会作为左右两个顶点共同的 V 坐标。
		const v = count > 1 ? i / (count - 1) : 0;

		// 当前采样点对应 2 个顶点、每个顶点有 3 个坐标，
		// 所以它在 positions 数组中的起始偏移量是 i × 6。
		const po = i * 6;

		// 写入左侧顶点：中心点减去横向偏移。
		// Y 坐标额外加 lift，使路径略微浮在地面上方。
		positions[po] = point.x - normal.x;
		positions[po + 1] = point.y + lift;
		positions[po + 2] = point.z - normal.z;

		// 写入右侧顶点：中心点加上横向偏移。
		positions[po + 3] = point.x + normal.x;
		positions[po + 4] = point.y + lift;
		positions[po + 5] = point.z + normal.z;

		// 当前采样点对应 2 个顶点、每个顶点有 2 个 UV 值，
		// 所以它在 uvs 数组中的起始偏移量是 i × 4。
		const uo = i * 4;

		// 左侧顶点的 U=0，右侧顶点的 U=1；
		// 两个顶点位于同一条横截面上，因此 V 都等于当前路径进度 v。
		uvs[uo] = 0;
		uvs[uo + 1] = v;
		uvs[uo + 2] = 1;
		uvs[uo + 3] = v;

		// 最后一个采样点后面没有下一排顶点，因此不需要再创建三角形。
		if (i < count - 1) {
			// 每个采样点有两个顶点，所以当前左顶点编号为 i × 2，
			// 当前右顶点为 a+1，下一排左右顶点分别为 a+2、a+3。
			const a = i * 2;

			// 将当前排和下一排组成的四边形拆成两个三角形：
			// 三角形 1：当前左、当前右、下一左；
			// 三角形 2：下一左、当前右、下一右。
			indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
		}
	}

	// 创建空的 BufferGeometry，并把上面准备好的数据交给 Three.js。
	const geometry = new THREE.BufferGeometry();

	// position 属性告诉 GPU 每个顶点在三维空间中的位置。
	// 参数 3 表示每三个数字组成一个顶点的 x、y、z。
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

	// uv 属性告诉 GPU 每个顶点对应的二维纹理坐标。
	// 参数 2 表示每两个数字组成一个顶点的 u、v。
	geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

	// 索引指定这些顶点应按什么顺序组成三角形。
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
