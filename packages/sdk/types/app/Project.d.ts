declare namespace IAppProject {
	interface Renderer {
		fps: number;
		antialias: boolean;
		toneMapping: import("three").ToneMapping; //number;
		toneMappingExposure: number;
		shadow: {
			enabled: boolean;
			type: import("three").ShadowMapType; //number;
		};
	}

	interface CSM {
		enabled: boolean;
		fade: boolean;
		maxFar: number;
		mode: "practical" | "logarithmic" | "uniform";
		shadowMapSize: 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384;
		lightDirectionX: number;
		lightDirectionY: number;
		lightDirectionZ: number;
		lightIntensity: number;
		lightColor: string;
	}

	interface Effect {
		enabled: boolean;
		Outline: {
			enabled: boolean;
			edgeStrength: number;
			edgeGlow: number;
			edgeThickness: number;
			pulsePeriod: number;
			usePatternTexture: boolean;
			visibleEdgeColor: string;
			hiddenEdgeColor: string;
		};
		FXAA: {
			enabled: boolean;
		};
		UnrealBloom: {
			enabled: boolean;
			threshold: number;
			strength: number;
			radius: number;
		};
		Bokeh: {
			enabled: boolean;
			focus: number;
			aperture: number;
			maxblur: number;
		};
		Pixelate: {
			enabled: boolean;
			pixelSize: number;
			normalEdgeStrength: number;
			depthEdgeStrength: number;
		};
		Halftone: {
			enabled: boolean;
			shape: number;
			radius: number;
			rotateR: number;
			rotateG: number;
			rotateB: number;
			scatter: number;
			blending: number;
			blendingMode: number;
			greyscale: boolean;
		};
		LUT: {
			enabled: boolean;
			lut: string;
			intensity: number;
		};
		Afterimage: {
			enabled: boolean;
			damp: number;
		};
	}

	interface Terrain {
		enabled: boolean;
		/** 启用地形时隐藏场景地面（网格线或贴图平面），避免遮挡影像瓦片 */
		hideGrid: boolean;
		origin: {
			longitude: number;
			latitude: number;
			height: number;
		};
		imagery: {
			enabled: boolean;
			provider: "custom" | "osm" | "tianditu_vec" | "tianditu_img";
			url: string;
			token: string;
			minZoom: number;
			maxZoom: number;
			opacity: number;
			lockLevel: boolean;
			lockedLevel: number;
			tilePadding: number;
			fixedBounds: boolean;
			bounds: {
				west: number;
				south: number;
				east: number;
				north: number;
			};
		};
		tiles3d: {
			enabled: boolean;
			url: string;
			maximumScreenSpaceError: number;
			/** 整体调整：相对定位点的偏移（米，场景坐标） */
			offset: { x: number; y: number; z: number };
			/** 整体调整：以定位点为枢轴的旋转（度） */
			rotation: { x: number; y: number; z: number };
			/** 整体调整：整体缩放 */
			scale: number;
			/**
			 * 定位：把瓦片集中心放置到指定经纬度/高度。
			 * 未启用时使用瓦片集自身的地理锚点。
			 * 旧场景数据可能缺省该字段。
			 */
			placement?: {
				enabled: boolean;
				longitude: number;
				latitude: number;
				height: number;
			};
			/**
			 * 地形描边：在影像平面绘制 3D Tiles 足迹边界线，便于与底图区分。
			 * 旧场景数据可能缺省该字段。
			 */
			outline?: {
				enabled: boolean;
				/** 描边颜色（hex） */
				color: string;
				/** 描边宽度（屏幕像素） */
				width: number;
			};
		};
	}

	interface Weather {
		fog: {
			enabled: boolean;
			type: "Fog" | "FogExp2";
			color: string;
			near: number;
			far: number;
			density: number;
		};
		rain: {
			enabled: boolean;
			speed: number;
			color: string;
			size: number;
			radian: number;
			alpha: number;
		};
		snow: {
			enabled: boolean;
			size: number;
			density: number;
			speed: number;
			alpha: number;
			accumulation: boolean;
		};
		lightning: {
			enabled: boolean;
			size: number;
			density: number;
			speed: number;
			alpha: number;
		};
		clouds: {
			enabled: boolean;
			color: string;
			/** 云层厚度/浓度 0–1 */
			thickness: number;
			/** 云层高度（世界 Y） */
			height: number;
			/** 漂移速度 */
			speed: number;
			/** 覆盖密度 0–1 */
			density: number;
			/** 整体透明度 0–1 */
			alpha: number;
			/** 云朵尺度 */
			scale: number;
		};
	}

	interface SceneInfo {
		id: string;
		sceneType: string;
		sceneName: string;
		sceneIntroduction: string;
		sceneVersion: number;
		projectType: number;
		coverPicture: string;
		hasDrawing: boolean;
		zip: string;
		zipSize: string;
	}

	interface DrawingMark {
		x: number;
		y: number;
		w: number;
		h: number;
		color?: string;
		modelUuid?: string;
		modelPath?: string;
	}

	interface DrawingImgInfo {
		width: number;
		height: number;
	}

	interface Drawing {
		isUploaded: boolean;
		imgSrc: string;
		isCad: boolean;
		layers: ICad.DxfLayers;
		isDrawingRect: boolean;
		selectedRectIndex: number;
		markList: DrawingMark[];
		imgInfo: DrawingImgInfo;
	}

	interface Viewport {
		/** 是否显示视口小地图 */
		miniMap: boolean;
		miniMapSize: number;
		miniMapRenderSize: number;
	}

	interface Config {
		xr: boolean;
		renderer: Renderer;
		csm: CSM;
		effect: Effect;
		weather: Weather;
		terrain: Terrain;
		viewport: Viewport;
	}

	interface Info extends Config {
		sceneInfo: SceneInfo;
		drawing: Drawing;
	}
}
