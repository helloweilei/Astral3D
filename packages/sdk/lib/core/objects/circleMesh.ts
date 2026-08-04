import * as THREE from "three";

const DEFAULT_OPTIONS: {
	innerColor: THREE.Color;
	strokeColor: THREE.Color;
	radius: number;
	strokeWidth: number;
} = {
	innerColor: new THREE.Color(0xffffff),
	strokeColor: new THREE.Color(0xe63c17),
	radius: 4,
	strokeWidth: 4,
};
export function createCircleMesh(options: Partial<typeof DEFAULT_OPTIONS> = {}) {
	const { innerColor, strokeColor, radius, strokeWidth } = { ...DEFAULT_OPTIONS, ...options };
	const geometry = new THREE.PlaneGeometry(1, 1);
	geometry.rotateX(Math.PI / 2);
	const totalRadius = radius + strokeWidth;

	// 2. 定义着色器材质
	const material = new THREE.ShaderMaterial({
		uniforms: {
			innerColor: { value: innerColor },
			strokeColor: { value: strokeColor },
			radius: { value: radius / totalRadius / 2 },
			strokeWidth: { value: strokeWidth / totalRadius / 2 },
		},
		vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
		fragmentShader: `
        uniform vec3 innerColor;
        uniform vec3 strokeColor;
        uniform float radius;
        uniform float strokeWidth;
        varying vec2 vUv;

        void main() {
            // 计算当前像素到中心点 (0.5, 0.5) 的距离
            float d = distance(vUv, vec2(0.5));
            float outerRadius = radius + strokeWidth;

            // 如果在圆内，显示填充色
            if (d <= radius) {
                gl_FragColor = vec4(innerColor, 1.0);
            }
            // 如果在描边区域内，显示描边色
            else if (d <= outerRadius) {
                gl_FragColor = vec4(strokeColor, 1.0);
            }
            // 否则，丢弃该片段（透明）
            else {
                discard;
            }
        }
    `,
		transparent: true, // 开启透明，让圆外部分透明
		side: THREE.DoubleSide,
		depthTest: false,
		depthWrite: false,
	});

	// 3. 创建网格并添加到场景
	const circle = new THREE.Mesh(geometry, material);
	circle.position.set(0, 0, 0);
	return circle;
}
