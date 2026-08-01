<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as THREE from "three";
import { App, Hooks } from "@astral3d/engine";
import { t } from "@/language";

/** 地形开启时才显示方位指示器 */
const visible = ref(false);
/** 罗盘旋转角（度）：使「北」始终指向场景北向（-Z） */
const rotationDeg = ref(0);

const _dir = new THREE.Vector3();

function syncVisible() {
	visible.value = !!App.project.getKey("terrain.enabled");
}

/**
 * 根据相机水平朝向更新罗盘。
 * 场景约定：x=东，y=天，z=南（北=-Z）。
 * heading=0 朝北，正值为朝东；罗盘取负角使「北」指向屏幕上的地理北。
 */
function updateHeading() {
	if (!visible.value) return;
	const camera = window.viewer?.camera;
	if (!camera) return;

	camera.getWorldDirection(_dir);
	const headingRad = Math.atan2(_dir.x, -_dir.z);
	rotationDeg.value = -THREE.MathUtils.radToDeg(headingRad);
}

onMounted(() => {
	syncVisible();
	updateHeading();
	Hooks.useAddSignal("sceneTerrainSettingsChanged", syncVisible);
	Hooks.useAddSignal("sceneRendered", updateHeading);
});

onBeforeUnmount(() => {
	Hooks.useRemoveSignal("sceneTerrainSettingsChanged", syncVisible);
	Hooks.useRemoveSignal("sceneRendered", updateHeading);
});
</script>

<template>
	<div
		v-if="visible"
		class="viewport-compass"
		:title="t('layout.scene.compass.Orientation')"
	>
		<div class="viewport-compass__dial" :style="{ transform: `rotate(${rotationDeg}deg)` }">
			<span class="viewport-compass__label viewport-compass__label--n">{{ t("layout.scene.compass.N") }}</span>
			<span class="viewport-compass__label viewport-compass__label--e">{{ t("layout.scene.compass.E") }}</span>
			<span class="viewport-compass__label viewport-compass__label--s">{{ t("layout.scene.compass.S") }}</span>
			<span class="viewport-compass__label viewport-compass__label--w">{{ t("layout.scene.compass.W") }}</span>
			<div class="viewport-compass__needle" />
			<div class="viewport-compass__tick viewport-compass__tick--n" />
			<div class="viewport-compass__tick viewport-compass__tick--e" />
			<div class="viewport-compass__tick viewport-compass__tick--s" />
			<div class="viewport-compass__tick viewport-compass__tick--w" />
		</div>
		<div class="viewport-compass__hub" />
	</div>
</template>

<style scoped lang="less">
.viewport-compass {
	position: relative;
	width: 72px;
	height: 72px;
	pointer-events: none;
	user-select: none;
	flex-shrink: 0;
}

.viewport-compass__dial {
	position: relative;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	border: 1px solid rgba(255, 255, 255, 0.45);
	background: radial-gradient(circle at 50% 40%, rgba(40, 48, 58, 0.72), rgba(16, 20, 28, 0.78));
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
	backdrop-filter: blur(4px);
	will-change: transform;
}

.viewport-compass__hub {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 7px;
	height: 7px;
	margin: -3.5px 0 0 -3.5px;
	border-radius: 50%;
	background: #e8edf2;
	box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
}

.viewport-compass__needle {
	position: absolute;
	top: 14px;
	left: 50%;
	width: 0;
	height: 0;
	margin-left: -5px;
	border-left: 5px solid transparent;
	border-right: 5px solid transparent;
	border-bottom: 22px solid #ef5350;
	filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45));
}

.viewport-compass__needle::after {
	content: "";
	position: absolute;
	top: 22px;
	left: -4px;
	width: 0;
	height: 0;
	border-left: 4px solid transparent;
	border-right: 4px solid transparent;
	border-top: 18px solid rgba(220, 226, 234, 0.9);
}

.viewport-compass__label {
	position: absolute;
	font-size: 11px;
	font-weight: 600;
	line-height: 1;
	color: rgba(232, 237, 242, 0.92);
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);

	&--n {
		top: 5px;
		left: 50%;
		transform: translateX(-50%);
		color: #ff6b6b;
	}

	&--e {
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
	}

	&--s {
		bottom: 5px;
		left: 50%;
		transform: translateX(-50%);
	}

	&--w {
		left: 6px;
		top: 50%;
		transform: translateY(-50%);
	}
}

.viewport-compass__tick {
	position: absolute;
	background: rgba(255, 255, 255, 0.35);

	&--n,
	&--s {
		left: 50%;
		width: 1px;
		height: 6px;
		margin-left: -0.5px;
	}

	&--n {
		top: 18px;
	}

	&--s {
		bottom: 18px;
	}

	&--e,
	&--w {
		top: 50%;
		width: 6px;
		height: 1px;
		margin-top: -0.5px;
	}

	&--e {
		right: 18px;
	}

	&--w {
		left: 18px;
	}
}
</style>
