/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2025/01/07
 * @description 贴相机的下雨效果
 */
import * as THREE from "three";
import type CameraControls from "camera-controls";

interface IRainOption {
	speed: number;
	color: string;
	size: number;
	radian: number;
	alpha: number;
}

export default class Rain {
	options: IRainOption;
	mesh: THREE.Mesh;
	controls: CameraControls;

	constructor(option: IRainOption, controls: CameraControls) {
		const defaultOption: IRainOption = {
			speed: 0.4,
			color: "#ffffff",
			size: 0.5,
			radian: 95 * THREE.MathUtils.DEG2RAD,
			alpha: 0.4,
		};

		this.options = Object.assign({}, defaultOption, option);

		this.controls = controls;

		this.mesh = this.createMesh();

		this.updatePosition();
	}

	createMesh() {
		const geometry = new THREE.PlaneGeometry(200, 200);

		const uniforms = {
			u_time: {
				type: "f",
				value: 0.0,
			},
			tDiffuse: { value: null },
			u_resolution: {
				type: "v2",
				value: new THREE.Vector2(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio),
			},
			alpha: {
				type: "f",
				value: this.options.alpha,
			},
			size: { value: this.options.size },
			radian: { value: this.options.radian * THREE.MathUtils.DEG2RAD },
			speed: { value: this.options.speed },
			color: { value: new THREE.Color(this.options.color) },
		};

		const material = new THREE.ShaderMaterial({
			transparent: true,
			depthTest: false,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			side: THREE.DoubleSide,
			uniforms: uniforms,
			vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4( position, 1.0 );
                }
            `,
			fragmentShader: `
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform float speed;
                uniform vec3 color;
                uniform float radian;
                uniform float alpha;
                uniform float size;
                varying highp vec2 vUv;
                float hash(vec2 p){
                    p  = 50.0*fract( p*0.3183099 + vec2(0.71,0.113));
                    return -1.0+2.0*fract( p.x*p.y*(p.x+p.y) );
                }
                float noise( in vec2 p ){
                    vec2 i = floor( p );
                    vec2 f = fract( p );
                    vec2 u = f*f*(3.0-2.0*f);
                    return mix( mix( hash( i + vec2(0.0,0.0) ),
                            hash( i + vec2(1.0,0.0) ), u.x),
                        mix( hash( i + vec2(0.0,1.0) ),
                            hash( i + vec2(1.0,1.0) ), u.x), u.y);
                }

                void main(){
                    vec2 q = gl_FragCoord.xy / u_resolution.xy;
                    vec2 p = -1.0 + 2.0 * q;
                    vec2 st = (p * vec2(.5, .01) + vec2(u_time) * 0.05 * speed) - vec2(q.y * cos(radian), 0.0);
                    st *= (1000.0 - size * 500.0);
                    float f = noise(st) * noise(st * .773) * 1.55;
                    f = clamp(pow(abs(f), 23.0) * 13.0, 0.0, q.y * .14) * 2.7;
                    float intensity = clamp(f, 0.0, 1.0);
                    // 仅雨丝处有颜色，空白处完全透明，避免全屏黑幕遮挡场景/云层
                    if (intensity < 0.001) discard;
                    gl_FragColor = vec4(color * intensity * alpha, 1.0);
                }
        `,
		});

		const mesh = new THREE.Mesh(geometry, material);
		mesh.renderOrder = 999;
		mesh.frustumCulled = false;
		return mesh;
	}

	updatePosition() {
		if (this.controls && this.mesh) {
			const position = this.controls.getPosition(new THREE.Vector3());
			const center = this.controls.getTarget(new THREE.Vector3());
			this.mesh.position.copy(center);
			if (position.y < 100) {
				this.mesh.position.y = -100;
			} else {
				this.mesh.position.y = 0;
			}
		}
	}

	updateOptions(option) {
		const material = <THREE.ShaderMaterial>this.mesh.material;
		for (const key in option) {
			this.options[key] = option[key];

			if (material.uniforms[key]) {
				let value = option[key];

				switch (key) {
					case "radian":
						value *= THREE.MathUtils.DEG2RAD;
						break;
					case "color":
						value = new THREE.Color(value);
						break;
				}
				material.uniforms[key].value = value;
			}
		}
	}

	update(deltaTime) {
		this.updatePosition();

		if (this.mesh.material && this.mesh.material instanceof THREE.ShaderMaterial) {
			this.mesh.material.uniforms.u_time.value += deltaTime;
		}
	}

	dispose() {
		this.mesh.geometry.dispose();
		(<THREE.Material>this.mesh.material).dispose();
		this.mesh.removeFromParent();
	}
}
