import * as THREE from "three";

const DEFAULT_OPTIONS: {
	innerColor: THREE.Color;
	strokeColor: THREE.Color;
	radius: number;
	strokeWidth: number;
	/**
	 * `ground`：平面贴在 XZ（俯视圆、斜视成椭圆）；
	 * `billboard`：平面在 XY，由调用方每帧对齐相机，始终显示为圆。
	 */
	align: "ground" | "billboard";
} = {
	innerColor: new THREE.Color(0xffffff),
	strokeColor: new THREE.Color(0xe63c17),
	radius: 4,
	strokeWidth: 4,
	align: "ground",
};

export function createCircleMesh(options: Partial<typeof DEFAULT_OPTIONS> = {}) {
	const { innerColor, strokeColor, radius, strokeWidth, align } = { ...DEFAULT_OPTIONS, ...options };
	const geometry = new THREE.PlaneGeometry(1, 1);
	// 贴地：转到水平面；billboard 保持 XY，正面朝向由外部 quaternion 控制
	if (align === "ground") {
		geometry.rotateX(Math.PI / 2);
	}
	const totalRadius = Math.max(radius + strokeWidth, 1e-6);

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
            float d = distance(vUv, vec2(0.5));
            float outerRadius = radius + strokeWidth;

            if (d <= radius) {
                gl_FragColor = vec4(innerColor, 1.0);
            } else if (d <= outerRadius) {
                gl_FragColor = vec4(strokeColor, 1.0);
            } else {
                discard;
            }
        }
    `,
		transparent: true,
		side: THREE.DoubleSide,
		depthTest: false,
		depthWrite: false,
	});

	const circle = new THREE.Mesh(geometry, material);
	circle.position.set(0, 0, 0);
	return circle;
}
