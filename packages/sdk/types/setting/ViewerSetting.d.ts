declare interface IViewerEdit {
    enabled:boolean;
    helpers: boolean;
    gizmo:boolean;
}

/** 地面呈现方式：grid 网格线；texture 贴图平面 */
declare type IViewerGroundMode = "grid" | "texture";

/** XOZ 平面贴图配置 */
declare interface IViewerGroundTexture {
    /** 基础颜色，支持 8 位 hex 携带透明度 */
    color: string;
    /** 贴图地址，为空时仅使用颜色 */
    map: string;
    /** 不透明度 0~1 */
    opacity: number;
    /** 平面边长（米） */
    size: number;
    /** 贴图平铺次数 */
    repeat: number;
    /** 贴图旋转角度（度） */
    rotation: number;
    /** 是否受场景灯光影响，关闭时使用无光照材质，保证空场景下也可见 */
    lit: boolean;
    /** 粗糙度 0~1 */
    roughness: number;
    /** 金属度 0~1 */
    metalness: number;
    /** 是否接收阴影 */
    receiveShadow: boolean;
}

declare interface IViewerGrid {
    enabled:boolean;
    /** 地面呈现方式 */
    mode: IViewerGroundMode;
    color: string;
    mainColor: string;
    row:number;
    column:number;
    subGridDistance: number;
    showAxes: boolean;
    /** 贴图平面配置，`mode` 为 texture 时生效 */
    texture: IViewerGroundTexture;
}

declare type CameraNavigationMode = "orbit" | "roam";

declare interface IViewerControl {
    minAzimuthAngle:number;
    maxAzimuthAngle: number;
    minDistance: number;
    maxDistance:number;
    maxPolarAngle:number;
    minPolarAngle:number;
    maxZoom:number;
    minZoom:number;
    dollySpeed:number;
    dollyToCursor:boolean;
    /** 环视 orbit：绕目标旋转；漫游 roam：WASD 自由移动 */
    navigationMode: CameraNavigationMode;
    /** 漫游模式移动速度（米/秒） */
    roamMoveSpeed: number;
}

declare  interface IViewerRequest {
    baseUrl?:string;
}

declare interface IViewerSetting {
    container?: HTMLElement;
    hdr?: string;
    edit?: IViewerEdit;
    enableScript?: boolean;
    request?:IViewerRequest;
    grid:IViewerGrid;
    control:IViewerControl
 }