declare interface IViewerEdit {
    enabled:boolean;
    helpers: boolean;
    gizmo:boolean;
}

declare interface IViewerGrid {
    enabled:boolean;
    color: string;
    mainColor: string;
    row:number;
    column:number;
    subGridDistance: number;
    showAxes: boolean;
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