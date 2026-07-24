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