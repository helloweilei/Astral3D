/**
 * 地面平面（XOZ）贴图预置。
 *
 * 贴图使用 canvas 程序化生成并缓存为 dataURL，无需额外静态资源，
 * 且所有图案均可无缝平铺。
 */

/** 预置底色 */
export interface GroundColorPreset {
	/** i18n 键：layout.scene.plane.colors.{nameKey} */
	nameKey: string;
	value: string;
	/** 透明色，色块以棋盘底纹展示 */
	transparent?: boolean;
}

/** 预置贴图 */
export interface GroundTexturePreset {
	id: string;
	/** i18n 键：layout.scene.plane.textures.{nameKey} */
	nameKey: string;
	/** 生成后的 dataURL */
	url: string;
}

export const GROUND_COLOR_PRESETS: GroundColorPreset[] = [
	{ nameKey: "None", value: "#ffffff00", transparent: true },
	{ nameKey: "White", value: "#ffffff" },
	{ nameKey: "Light Gray", value: "#d9d9d9" },
	{ nameKey: "Gray", value: "#8c8c8c" },
	{ nameKey: "Dark Gray", value: "#4a4a4a" },
	{ nameKey: "Black", value: "#1f1f1f" },
	{ nameKey: "Sand", value: "#d8c49a" },
	{ nameKey: "Earth", value: "#8b6b4a" },
	{ nameKey: "Grass", value: "#6f9e5a" },
	{ nameKey: "Sky Blue", value: "#7fb2d9" },
	{ nameKey: "Concrete", value: "#a8a49c" },
];

const TEXTURE_SIZE = 256;

/** 稳定随机数，保证每次生成的贴图一致 */
function createRandom(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) % 4294967296;
		return state / 4294967296;
	};
}

function createContext() {
	const canvas = document.createElement("canvas");
	canvas.width = TEXTURE_SIZE;
	canvas.height = TEXTURE_SIZE;
	return { canvas, ctx: canvas.getContext("2d") as CanvasRenderingContext2D };
}

function fillBase(ctx: CanvasRenderingContext2D, color: string) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
}

/** 绘制跨边界环绕的圆，保证图案可无缝平铺 */
function fillCircleWrapped(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
	const offsets = [-TEXTURE_SIZE, 0, TEXTURE_SIZE];
	for (const dx of offsets) {
		for (const dy of offsets) {
			ctx.beginPath();
			ctx.arc(x + dx, y + dy, radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

/** 叠加像素噪声，制造粗糙质感 */
function addNoise(ctx: CanvasRenderingContext2D, strength: number, seed: number) {
	const random = createRandom(seed);
	const image = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
	const data = image.data;

	for (let i = 0; i < data.length; i += 4) {
		const offset = (random() - 0.5) * strength;
		data[i] = Math.min(255, Math.max(0, data[i] + offset));
		data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + offset));
		data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + offset));
	}

	ctx.putImageData(image, 0, 0);
}

// 棋盘
function drawChecker(ctx: CanvasRenderingContext2D) {
	const cell = TEXTURE_SIZE / 4;
	fillBase(ctx, "#f2f2f2");
	ctx.fillStyle = "#bfbfbf";
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			if ((row + col) % 2 === 0) continue;
			ctx.fillRect(col * cell, row * cell, cell, cell);
		}
	}
}

// 瓷砖
function drawTile(ctx: CanvasRenderingContext2D) {
	const cell = TEXTURE_SIZE / 2;
	fillBase(ctx, "#9a9a95");
	ctx.fillStyle = "#dcdad3";
	const gap = 6;
	for (let row = 0; row < 2; row++) {
		for (let col = 0; col < 2; col++) {
			ctx.fillRect(col * cell + gap / 2, row * cell + gap / 2, cell - gap, cell - gap);
		}
	}
	addNoise(ctx, 12, 11);
}

// 砖块
function drawBrick(ctx: CanvasRenderingContext2D) {
	const rows = 8;
	const cols = 4;
	const brickHeight = TEXTURE_SIZE / rows;
	const brickWidth = TEXTURE_SIZE / cols;
	const gap = 3;

	fillBase(ctx, "#cfc7bb");
	ctx.fillStyle = "#a3563f";

	for (let row = 0; row < rows; row++) {
		const offset = row % 2 === 0 ? 0 : -brickWidth / 2;
		for (let col = -1; col <= cols; col++) {
			ctx.fillRect(col * brickWidth + offset + gap / 2, row * brickHeight + gap / 2, brickWidth - gap, brickHeight - gap);
		}
	}

	addNoise(ctx, 18, 23);
}

// 木纹
function drawWood(ctx: CanvasRenderingContext2D) {
	const random = createRandom(37);
	const plankWidth = TEXTURE_SIZE / 4;

	fillBase(ctx, "#a9784c");

	for (let i = 0; i < 4; i++) {
		const shade = 0.9 + random() * 0.2;
		ctx.fillStyle = `rgba(169, 120, 76, ${shade})`;
		ctx.fillRect(i * plankWidth, 0, plankWidth, TEXTURE_SIZE);

		ctx.strokeStyle = "rgba(90, 58, 32, 0.5)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(i * plankWidth, 0);
		ctx.lineTo(i * plankWidth, TEXTURE_SIZE);
		ctx.stroke();
	}

	// 木纹
	ctx.strokeStyle = "rgba(120, 80, 45, 0.35)";
	ctx.lineWidth = 1;
	for (let i = 0; i < 60; i++) {
		const x = random() * TEXTURE_SIZE;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.bezierCurveTo(x + random() * 6 - 3, TEXTURE_SIZE / 3, x + random() * 6 - 3, (TEXTURE_SIZE * 2) / 3, x, TEXTURE_SIZE);
		ctx.stroke();
	}
}

// 混凝土
function drawConcrete(ctx: CanvasRenderingContext2D) {
	const random = createRandom(53);
	fillBase(ctx, "#a8a49c");

	for (let i = 0; i < 90; i++) {
		const radius = 6 + random() * 26;
		const alpha = 0.04 + random() * 0.08;
		ctx.fillStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(60,60,60,${alpha})`;
		fillCircleWrapped(ctx, random() * TEXTURE_SIZE, random() * TEXTURE_SIZE, radius);
	}

	addNoise(ctx, 26, 59);
}

// 水泥
function drawCement(ctx: CanvasRenderingContext2D) {
	const random = createRandom(131);
	fillBase(ctx, "#b6b3ad");

	// 抹面留下的大块色差
	for (let i = 0; i < 40; i++) {
		const alpha = 0.03 + random() * 0.05;
		ctx.fillStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(90,90,90,${alpha})`;
		fillCircleWrapped(ctx, random() * TEXTURE_SIZE, random() * TEXTURE_SIZE, 20 + random() * 40);
	}

	// 分格缝
	ctx.strokeStyle = "rgba(120, 118, 112, 0.55)";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, TEXTURE_SIZE / 2);
	ctx.lineTo(TEXTURE_SIZE, TEXTURE_SIZE / 2);
	ctx.moveTo(TEXTURE_SIZE / 2, 0);
	ctx.lineTo(TEXTURE_SIZE / 2, TEXTURE_SIZE);
	ctx.stroke();

	addNoise(ctx, 14, 137);
}
// 沥青
function drawAsphalt(ctx: CanvasRenderingContext2D) {
	const random = createRandom(149);
	fillBase(ctx, "#3a3a3c");

	// 骨料颗粒
	for (let i = 0; i < 900; i++) {
		const light = 70 + random() * 90;
		ctx.fillStyle = `rgba(${light}, ${light}, ${light + 4}, ${0.25 + random() * 0.45})`;
		fillCircleWrapped(ctx, random() * TEXTURE_SIZE, random() * TEXTURE_SIZE, 0.6 + random() * 1.8);
	}

	addNoise(ctx, 30, 151);
}
// 泥土
function drawDirt(ctx: CanvasRenderingContext2D) {
	const random = createRandom(163);
	fillBase(ctx, "#6b4f35");

	// 深浅土块
	for (let i = 0; i < 70; i++) {
		const alpha = 0.06 + random() * 0.12;
		ctx.fillStyle = random() > 0.5 ? `rgba(150, 116, 78, ${alpha})` : `rgba(56, 38, 24, ${alpha})`;
		fillCircleWrapped(ctx, random() * TEXTURE_SIZE, random() * TEXTURE_SIZE, 10 + random() * 34);
	}

	// 碎石与土粒
	for (let i = 0; i < 320; i++) {
		const light = 90 + random() * 80;
		ctx.fillStyle = `rgba(${light}, ${Math.round(light * 0.8)}, ${Math.round(light * 0.6)}, ${0.3 + random() * 0.4})`;
		fillCircleWrapped(ctx, random() * TEXTURE_SIZE, random() * TEXTURE_SIZE, 0.8 + random() * 2.2);
	}

	addNoise(ctx, 26, 167);
}
// 碎石
function drawGravel(ctx: CanvasRenderingContext2D) {
	const random = createRandom(179);
	fillBase(ctx, "#5c574f");

	for (let i = 0; i < 420; i++) {
		const light = 90 + random() * 110;
		ctx.fillStyle = `rgb(${light}, ${Math.round(light * 0.97)}, ${Math.round(light * 0.9)})`;
		fillCircleWrapped(ctx, random() * TEXTURE_SIZE, random() * TEXTURE_SIZE, 2.5 + random() * 5.5);
	}

	addNoise(ctx, 22, 181);
}
// 石板
function drawStone(ctx: CanvasRenderingContext2D) {
	const random = createRandom(191);
	const rows = 4;
	const cols = 4;
	const slabHeight = TEXTURE_SIZE / rows;
	const slabWidth = TEXTURE_SIZE / cols;
	const gap = 5;

	// 灰缝
	fillBase(ctx, "#4f4b45");

	// 每块石板颜色按列索引取模复用，跨边界的副本才能与本体一致
	const slabColors = Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => {
			const light = Math.round(130 + random() * 45);
			return `rgb(${light}, ${light + 2}, ${Math.round(light * 0.96)})`;
		})
	);

	for (let row = 0; row < rows; row++) {
		const offset = row % 2 === 0 ? 0 : -slabWidth / 2;
		for (let col = -1; col <= cols; col++) {
			ctx.fillStyle = slabColors[row][(col + cols) % cols];
			ctx.fillRect(col * slabWidth + offset + gap / 2, row * slabHeight + gap / 2, slabWidth - gap, slabHeight - gap);
		}
	}

	addNoise(ctx, 20, 193);
}
// 草地
function drawGrass(ctx: CanvasRenderingContext2D) {
	const random = createRandom(67);
	fillBase(ctx, "#5f8c46");

	for (let i = 0; i < 2600; i++) {
		const x = random() * TEXTURE_SIZE;
		const y = random() * TEXTURE_SIZE;
		const light = 60 + random() * 70;
		ctx.strokeStyle = `rgb(${Math.round(light * 0.6)}, ${Math.round(light + 50)}, ${Math.round(light * 0.5)})`;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + random() * 3 - 1.5, y - 2 - random() * 4);
		ctx.stroke();
	}

	addNoise(ctx, 14, 71);
}
// 沙地
function drawSand(ctx: CanvasRenderingContext2D) {
	const random = createRandom(83);
	fillBase(ctx, "#d8c49a");

	for (let i = 0; i < 40; i++) {
		ctx.strokeStyle = `rgba(180, 158, 116, ${0.15 + random() * 0.2})`;
		ctx.lineWidth = 2 + random() * 3;
		ctx.beginPath();
		const y = random() * TEXTURE_SIZE;
		ctx.moveTo(0, y);
		ctx.bezierCurveTo(TEXTURE_SIZE / 3, y + random() * 16 - 8, (TEXTURE_SIZE * 2) / 3, y + random() * 16 - 8, TEXTURE_SIZE, y);
		ctx.stroke();
	}

	addNoise(ctx, 22, 89);
}

// 大理石
function drawMarble(ctx: CanvasRenderingContext2D) {
	const random = createRandom(97);
	fillBase(ctx, "#eceae6");

	for (let i = 0; i < 26; i++) {
		ctx.strokeStyle = `rgba(120, 120, 130, ${0.12 + random() * 0.22})`;
		ctx.lineWidth = 1 + random() * 2.5;
		ctx.beginPath();
		const y = random() * TEXTURE_SIZE;
		ctx.moveTo(0, y);
		ctx.bezierCurveTo(TEXTURE_SIZE / 3, y + random() * 60 - 30, (TEXTURE_SIZE * 2) / 3, y + random() * 60 - 30, TEXTURE_SIZE, y);
		ctx.stroke();
	}

	addNoise(ctx, 8, 101);
}

// 条纹
function drawStripe(ctx: CanvasRenderingContext2D) {
	const period = TEXTURE_SIZE / 8;
	fillBase(ctx, "#e8e8e8");
	ctx.strokeStyle = "#b0b8c4";
	ctx.lineWidth = period / 2;

	// 45° 斜纹，周期整除边长时可无缝平铺
	for (let i = -TEXTURE_SIZE; i < TEXTURE_SIZE * 2; i += period) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i + TEXTURE_SIZE, TEXTURE_SIZE);
		ctx.stroke();
	}
}

// 圆点
function drawDots(ctx: CanvasRenderingContext2D) {
	const cell = TEXTURE_SIZE / 4;
	fillBase(ctx, "#3f4650");
	ctx.fillStyle = "#79838f";

	for (let row = 0; row <= 4; row++) {
		for (let col = 0; col <= 4; col++) {
			ctx.beginPath();
			ctx.arc(col * cell, row * cell, cell * 0.18, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

const TEXTURE_DRAWERS: Array<{ id: string; nameKey: string; draw: (ctx: CanvasRenderingContext2D) => void }> = [
	{ id: "checker", nameKey: "Checker", draw: drawChecker },
	{ id: "tile", nameKey: "Tile", draw: drawTile },
	{ id: "brick", nameKey: "Brick", draw: drawBrick },
	{ id: "stone", nameKey: "Stone", draw: drawStone },
	{ id: "wood", nameKey: "Wood", draw: drawWood },
	{ id: "concrete", nameKey: "Concrete", draw: drawConcrete },
	{ id: "cement", nameKey: "Cement", draw: drawCement },
	{ id: "asphalt", nameKey: "Asphalt", draw: drawAsphalt },
	{ id: "dirt", nameKey: "Dirt", draw: drawDirt },
	{ id: "gravel", nameKey: "Gravel", draw: drawGravel },
	{ id: "grass", nameKey: "Grass", draw: drawGrass },
	{ id: "sand", nameKey: "Sand", draw: drawSand },
	{ id: "marble", nameKey: "Marble", draw: drawMarble },
	{ id: "stripe", nameKey: "Stripe", draw: drawStripe },
	{ id: "dots", nameKey: "Dots", draw: drawDots },
];

let cachedPresets: GroundTexturePreset[] | null = null;

/**
 * 获取预置贴图列表，首次调用时生成并缓存。
 */
export function getGroundTexturePresets(): GroundTexturePreset[] {
	if (cachedPresets) return cachedPresets;

	cachedPresets = TEXTURE_DRAWERS.map(item => {
		const { canvas, ctx } = createContext();
		item.draw(ctx);
		return { id: item.id, nameKey: item.nameKey, url: canvas.toDataURL("image/png") };
	});

	return cachedPresets;
}
