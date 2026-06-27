/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2025/01/09
 * @description 贴相机的闪电效果
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

export default class Lightning {
	options: ILightningOption;
	mesh: THREE.Mesh;
	controls: CameraControls;

	constructor(option: ILightningOption, controls: CameraControls) {
		const defaultOption: ILightningOption = {
			speed: 1.0,
			density: 1.0,
			size: 0.5,
			alpha: 0.8,
			color: "#ffffff",
		};

		this.options = Object.assign({}, defaultOption, option);

		this.controls = controls;

		this.mesh = this.createMesh();
		this.mesh.renderOrder = 100;

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
			speed: { value: this.options.speed },
			density: { value: this.options.density },
			size: { value: this.options.size },
			color: { value: new THREE.Color(this.options.color || "#ffffff") },
		};

		const material = new THREE.ShaderMaterial({
			transparent: true,
			uniforms: uniforms,
			side: 2,
			depthTest: false,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4( position, 1.0 );
                }
            `,
			fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform float speed;
                uniform float density;
                uniform float size;
                uniform vec3 color;
                uniform float alpha;
                varying highp vec2 vUv;

                float hash(float n) {
                    return fract(sin(n) * 43758.5453123);
                }

                float noise(float x) {
                    float i = floor(x);
                    float f = fract(x);
                    float u = f * f * (3.0 - 2.0 * f);
                    return mix(hash(i), hash(i + 1.0), u);
                }

                float distToSegment(vec2 p, vec2 a, vec2 b) {
                    vec2 ab = b - a;
                    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
                    return length(p - (a + t * ab));
                }

                float fbm(float x) {
                    float v = 0.0;
                    float a = 0.5;
                    for (int i = 0; i < 4; i++) {
                        v += a * noise(x);
                        x *= 2.0;
                        a *= 0.5;
                    }
                    return v;
                }

                float jaggedBolt(vec2 uv, float seed) {
                    float bolt = 0.0;
                    float steps = 16.0;
                    
                    float startX = 0.2 + hash(seed) * 0.6;
                    vec2 prev = vec2(startX, 1.0);
                    
                    for (float i = 1.0; i <= steps; i++) {
                        float t = i / steps;
                        float prog = t;
                        
                        float offset = (hash(seed + i * 3.7) - 0.5) * 0.12;
                        offset += (hash(seed + i * 7.3) - 0.5) * 0.06;
                        offset += (hash(seed + i * 11.1) - 0.5) * 0.03;
                        
                        float currX = prev.x + offset;
                        float currY = 1.0 - prog;
                        vec2 curr = vec2(currX, currY);
                        
                        float d = distToSegment(uv, prev, curr);
                        float lineWidth = 0.0015;
                        
                        float core = exp(-d / lineWidth);
                        float glow = exp(-d / (lineWidth * 6.0)) * 0.4;
                        
                        bolt += core + glow;
                        
                        if (hash(seed + i * 13.0) > 0.75 && prog > 0.15 && prog < 0.85) {
                            float branchLen = 0.15 + hash(seed + i * 17.0) * 0.2;
                            vec2 branchStart = mix(prev, curr, hash(seed + i * 19.0));
                            float branchAngle = (hash(seed + i * 23.0) - 0.5) * 1.5;
                            vec2 branchDir = normalize(vec2(sin(branchAngle), -cos(branchAngle)));
                            vec2 branchEnd = branchStart + branchDir * branchLen;
                            
                            float bd = distToSegment(uv, branchStart, branchEnd);
                            float bWidth = lineWidth * 0.7;
                            float bCore = exp(-bd / bWidth) * 0.6;
                            float bGlow = exp(-bd / (bWidth * 5.0)) * 0.25;
                            
                            bolt += bCore + bGlow;
                        }
                        
                        prev = curr;
                    }
                    
                    return clamp(bolt, 0.0, 1.0);
                }

                void main(){
                    vec3 col = texture(tDiffuse, vUv).rgb;
                    vec2 q = gl_FragCoord.xy / u_resolution.xy;
                    vec2 uv = q;
                    uv.x *= u_resolution.x / u_resolution.y;

                    float t = u_time * speed;
                    float flashSeed = hash(floor(t * density));

                    float currentFlash = 0.0;
                    float boltSeed = 0.0;
                    if (flashSeed > (1.0 - density * 0.4)) {
                        float flashPhase = fract(t * density);
                        float flashCurve = exp(-flashPhase * 25.0 / size);
                        currentFlash = flashCurve;
                        boltSeed = floor(t * density);
                    }

                    float skyMask = smoothstep(0.3, 0.6, uv.y);

                    float bolt1 = jaggedBolt(uv, boltSeed + 0.0) * skyMask;
                    float bolt2 = jaggedBolt(uv, boltSeed + 500.0) * skyMask * 0.5;

                    float totalBolt = (bolt1 + bolt2) * currentFlash;

                    float flash1 = fbm(u_time * 10.0 * speed) * currentFlash;
                    float flash2 = fbm(u_time * 15.0 * speed + 100.0) * currentFlash * 0.5;
                    float flash3 = noise(u_time * 30.0 * speed) * currentFlash * 0.3;
                    float ambientFlash = (flash1 + flash2 + flash3) * 0.3;

                    vec3 lightningColor = color * (totalBolt + ambientFlash);
                    col += lightningColor;

                    col += color * ambientFlash * 0.5;

                    gl_FragColor = vec4(col, alpha * (totalBolt + ambientFlash * 0.5));
                }
            `,
		});

		return new THREE.Mesh(geometry, material);
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
