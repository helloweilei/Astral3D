import Signal from "signals";

interface SignalObj<T = any> {
	add(listener: (...params: T[]) => void, listenerContext?: any, priority?: Number): void;
	addOnce(listener: (...params: T[]) => void, listenerContext?: any, priority?: Number): void;
	dispatch(...params: T[]): void;
	remove(listener: (...params: T[]) => void, context?: any): void;
	removeAll(): void;
	setActive(active: boolean): void;
	halt(): void;
	dispose(): void;
	has(listener: (...params: T[]) => void, context?: any): boolean;
	active: boolean;
}

interface SignalRegister {
	[s: string]: SignalObj;
}

/**
 * App
 * @path lib/core/App
 */
const appSignals: SignalRegister = {
	// xr
	enterXR: new Signal(),
	offerXR: new Signal(),
	leaveXR: new Signal(),

	sceneCleared: new Signal(),

	transformModeChanged: new Signal(),
	snapChanged: new Signal(),
	spaceChanged: new Signal(),
	rendererCreated: new Signal(),
	rendererUpdated: new Signal(),
	rendererConfigUpdate: new Signal(),
	rendererDetectKTX2Support: new Signal(),

	sceneBackgroundChanged: new Signal(),
	sceneEnvironmentChanged: new Signal(),
	sceneFogSettingsChanged: new Signal(),
	// 雨效果配置参数变更
	sceneRainSettingsChanged: new Signal(),
	// 雪效果配置参数变更
	sceneSnowSettingsChanged: new Signal(),
	sceneLightningSettingsChanged: new Signal(),
	sceneTerrainSettingsChanged: new Signal(),
	sceneGraphChanged: new Signal(),
	sceneRendered: new Signal(),
	sceneResize: new Signal(),

	cameraAdded: new Signal(),
	cameraRemoved: new Signal(),
	cameraChanged: new Signal(),
	cameraReset: new Signal(),

	geometryChanged: new Signal(),

	objectSelected: new Signal(),
	objectFocused: new Signal(),
	objectFocusByUuid: new Signal(),

	// 锁定模型
	objectLocked: new Signal(),
	// 解锁模型
	objectUnlocked: new Signal(),

	objectAdded: new Signal(),
	objectChanged: new Signal(),
	objectRemoved: new Signal(),

	materialAdded: new Signal(),
	materialChanged: new Signal(),
	materialRemoved: new Signal(),
	materialCurrentSlotChange: new Signal(),

	scriptAdded: new Signal(),
	scriptChanged: new Signal(),
	scriptRemoved: new Signal(),

	showGridChanged: new Signal(),
	historyChanged: new Signal(),

	// 场景主相机变更
	viewportCameraChanged: new Signal(),
	viewportShadingChanged: new Signal(),

	intersectionsDetected: new Signal(),

	pathTracerUpdated: new Signal(),

	// 实例化ShaderMaterial类型内置材质
	instantiateShaderMaterial: new Signal(),

	// 场景加载完成
	sceneLoadComplete: new Signal(),

	// 添加日志
	addLog: new Signal(),
	// 删除日志
	deleteLog: new Signal(),
	// 清空日志
	clearLogs: new Signal(),

	// 动画更新渲染
	animationMixerUpdate: new Signal(),
	// 动画轨道时间变化(游标拖动)
	timelineTimeChanged: new Signal(),
	// 动画轨道行变化（添加/删除）
	timelineRowChanged: new Signal(),
};

/**
 * Viewer
 * @path lib/core/Viewer
 */
const ViewerSignals: SignalRegister = {
	// viewer 初始化完毕，即构造函数执行完毕
	viewerInitCompleted: new Signal(),
	// 插件注册
	pluginInstall: new Signal(),
	// 插件卸载
	pluginUninstall: new Signal(),
	IFCPropertiesVisible: new Signal(),
	// 启用/禁用后处理
	effectEnabledChange: new Signal(),
	// 后处理通道配置变更
	effectPassConfigChange: new Signal(),
	// 粒子body使用的Object3D变更
	particleBodyChanged: new Signal(),
	// 粒子系统添加emitter后触发
	particleSystemAddEmitter: new Signal(),
	// 将emitter添加到粒子系统：fromJSON时触发
	emitterAdd2ParticleSystem: new Signal(),
};

/**
 * 图纸 相关
 */
const drawingSignals: SignalRegister = {
	drawingMarkDone: new Signal(), // 新增/编辑 图纸标记完成回调
	cadViewerResize: new Signal(), // 图纸面板移动
};

export const SignalsRegister: SignalRegister = {
	...appSignals,
	...ViewerSignals,
	...drawingSignals,
};

// signal注册器
export const SignalsRegisterFn = (newSignals: Array<string>) => {
	newSignals.forEach(key => {
		SignalsRegister[key] = new Signal();
	});
};
