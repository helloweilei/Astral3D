export const PreviewOptions = (): IPreviewSetting => ({
    // 场景canvas容器
    container: undefined,
    // 场景背景及环境贴图
    hdr: undefined,
    // 请求相关
    request:{
        baseUrl:""
    },
    // 相机控制器
    control: {
        minAzimuthAngle: -Infinity,
        maxAzimuthAngle: Infinity,
        minDistance: 0.0,
        maxDistance: Infinity,
        maxPolarAngle: Math.PI,
        minPolarAngle: 0,
        maxZoom:Infinity,
        minZoom:0.01,
        dollySpeed:1,
        // 缩放是否以鼠标位置为中心
        dollyToCursor: false,
        navigationMode: "orbit",
        roamMoveSpeed: 20,
    }
})