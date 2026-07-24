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
	// 场景内网格
	grid: {
		enabled: true,
		color: "#555555",
		mainColor: "#666666",
		row: 200,
		column: 200,
		subGridDistance: 32,
		showAxes: true,
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
	},
});
