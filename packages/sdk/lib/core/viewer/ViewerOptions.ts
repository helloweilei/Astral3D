export const ViewerOptions = (): IViewerSetting => ({
	// 场景canvas容器
	container: undefined,
	// 场景背景及环境贴图
	hdr: undefined,
	// 编辑模式
	edit: {
		// 是否启用
		enabled: false,
		// 是否显示辅助线
		helpers: true,
		// 是否现实gizmo三坐标轴
		gizmo: true,
	},
	// 是否启用脚本，自动运行脚本
	enableScript: true,
	// 请求相关
	request: {
		baseUrl: "",
	},
	// 场景地面（网格线 / 贴图平面）
	grid: {
		enabled: true,
		mode: "grid",
		color: "#555555",
		mainColor: "#666666",
		row: 200,
		column: 200,
		subGridDistance: 32,
		showAxes: true,
		texture: {
			color: "#ffffff",
			map: "",
			opacity: 1,
			size: 200,
			repeat: 20,
			rotation: 0,
			lit: false,
			roughness: 1,
			metalness: 0,
			receiveShadow: true,
		},
	},
	// 相机控制器
	control: {
		minAzimuthAngle: -Infinity,
		maxAzimuthAngle: Infinity,
		minDistance: 0.0,
		maxDistance: Infinity,
		maxPolarAngle: Math.PI,
		minPolarAngle: 0,
		maxZoom: Infinity,
		minZoom: 0.01,
		dollySpeed: 1,
		// 缩放是否以鼠标位置为中心
		dollyToCursor: false,
		navigationMode: "orbit",
		roamMoveSpeed: 20,
	},
});
