<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
import * as THREE from "three";
import { Preview } from "@astral3d/engine";
import type { BlendingKind, GeometryKind, TopicUniform } from "@/plugin/shaderPlayground/types";

const props = defineProps<{
	vertex: string;
	fragment: string;
	geometry: GeometryKind;
	blending: BlendingKind;
	/** uniform 当前值：key -> number | hex string */
	uniformValues: Record<string, number | string>;
	uniformDefs: TopicUniform[];
}>();

const emit = defineEmits<{
	error: [message: string];
	ok: [];
}>();

const hostRef = ref<HTMLElement | null>(null);
let previewer: Preview | null = null;
let mesh: THREE.Mesh | null = null;
let material: THREE.ShaderMaterial | null = null;
let uTime = 0;
let lastTs = 0;
let compileTimer: ReturnType<typeof setTimeout> | null = null;
const resolution = new THREE.Vector2(1, 1);

onMounted(async () => {
	await nextTick();
	if (!hostRef.value) return;

	previewer = new Preview({
		container: hostRef.value,
	});
	previewer.scene.background = new THREE.Color(0x1a1a1e);

	const grid = new THREE.GridHelper(8, 16, 0x444450, 0x2e2e36);
	grid.position.y = -1.2;
	previewer.scene.add(grid);

	rebuildGeometry(props.geometry);
	applyShader();

	lastTs = performance.now();
	previewer.addEventListener("beforeRender", onBeforeRender);
});

onBeforeUnmount(() => {
	if (compileTimer) clearTimeout(compileTimer);
	previewer?.removeEventListener("beforeRender", onBeforeRender);
	disposeMesh();
	previewer?.dispose();
	previewer = null;
});

watch(
	() => [props.vertex, props.fragment, props.blending] as const,
	() => scheduleCompile(),
);

watch(
	() => props.geometry,
	g => {
		rebuildGeometry(g);
		applyShader();
	},
);

watch(
	() => props.uniformValues,
	() => syncUniforms(),
	{ deep: true },
);

function onBeforeRender() {
	if (!material || !previewer) return;
	const now = performance.now();
	const dt = Math.min((now - lastTs) / 1000, 0.1);
	lastTs = now;
	uTime += dt;
	if (material.uniforms.uTime) {
		material.uniforms.uTime.value = uTime;
	}
	const el = previewer.renderer.domElement;
	resolution.set(el.width, el.height);
	if (material.uniforms.uResolution) {
		material.uniforms.uResolution.value.copy(resolution);
	}
}

function scheduleCompile() {
	if (compileTimer) clearTimeout(compileTimer);
	compileTimer = setTimeout(() => applyShader(), 300);
}

function rebuildGeometry(kind: GeometryKind) {
	if (!previewer) return;
	disposeMesh();

	let geom: THREE.BufferGeometry;
	if (kind === "fullscreen") {
		geom = new THREE.PlaneGeometry(2, 2);
	} else if (kind === "sphere") {
		geom = new THREE.SphereGeometry(1.2, 48, 32);
	} else {
		geom = new THREE.PlaneGeometry(2.4, 2.4);
	}

	mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0x333333 }));
	mesh.frustumCulled = kind !== "fullscreen";
	mesh.name = "ShaderPlaygroundMesh";
	previewer.scene.add(mesh);

	if (kind === "uvPlane") {
		previewer.camera.position.set(0, 0, 4);
		previewer.modules.controls.setLookAt(0, 0, 4, 0, 0, 0, false);
	} else if (kind === "sphere") {
		previewer.camera.position.set(3, 2, 4);
		previewer.modules.controls.setLookAt(3, 2, 4, 0, 0, 0, false);
	} else {
		previewer.camera.position.set(0, 0, 1);
		previewer.modules.controls.setLookAt(0, 0, 1, 0, 0, 0, false);
	}
}

function buildUniforms(): Record<string, THREE.IUniform> {
	const u: Record<string, THREE.IUniform> = {
		uTime: { value: uTime },
		uResolution: { value: resolution.clone() },
	};

	for (const def of props.uniformDefs) {
		const raw = props.uniformValues[def.key] ?? def.default;
		if (def.type === "color") {
			u[def.key] = { value: new THREE.Color(String(raw)) };
		} else {
			u[def.key] = { value: Number(raw) };
		}
	}

	// 代码里可能引用但 defs 未声明的常用项
	if (!u.uIntensity && /uIntensity/.test(props.fragment)) {
		u.uIntensity = { value: 1 };
	}
	if (!u.uColor && /uColor/.test(props.fragment)) {
		u.uColor = { value: new THREE.Color("#ffffff") };
	}

	return u;
}

function applyShader() {
	if (!previewer || !mesh) return;

	const next = new THREE.ShaderMaterial({
		vertexShader: props.vertex,
		fragmentShader: props.fragment,
		uniforms: buildUniforms(),
		transparent: true,
		depthWrite: false,
		depthTest: props.geometry !== "fullscreen",
		side: THREE.DoubleSide,
		toneMapped: false,
		blending: props.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending,
	});

	let errLog = "";
	const prevErr = console.error;
	console.error = (...args: unknown[]) => {
		errLog += args.map(a => (typeof a === "string" ? a : String(a))).join(" ") + "\n";
		prevErr.apply(console, args as []);
	};

	try {
		const old = mesh.material;
		mesh.material = next;
		previewer.renderer.compile(previewer.scene, previewer.camera);
		if (old && old !== next) (old as THREE.Material).dispose();
		material = next;

		const lower = errLog.toLowerCase();
		if (lower.includes("fragment") || lower.includes("vertex") || lower.includes("shader")) {
			emit("error", errLog.trim() || "Shader compile error");
		} else {
			emit("ok");
		}
	} catch (e) {
		next.dispose();
		emit("error", e instanceof Error ? e.message : String(e));
	} finally {
		console.error = prevErr;
	}
}

function syncUniforms() {
	if (!material) return;
	for (const def of props.uniformDefs) {
		const uni = material.uniforms[def.key];
		if (!uni) continue;
		const raw = props.uniformValues[def.key] ?? def.default;
		if (def.type === "color") {
			(uni.value as THREE.Color).set(String(raw));
		} else {
			uni.value = Number(raw);
		}
	}
}

function disposeMesh() {
	if (!mesh || !previewer) return;
	previewer.scene.remove(mesh);
	mesh.geometry.dispose();
	(mesh.material as THREE.Material).dispose();
	mesh = null;
	material = null;
}

defineExpose({
	recompile: applyShader,
});
</script>

<template>
	<div ref="hostRef" class="shader-preview-host w-full h-full min-h-240px" />
</template>

<style scoped lang="less">
.shader-preview-host {
	position: relative;
	overflow: hidden;
	background: #1a1a1e;
	border-radius: 4px;

	:deep(canvas) {
		display: block;
		width: 100% !important;
		height: 100% !important;
	}
}
</style>
