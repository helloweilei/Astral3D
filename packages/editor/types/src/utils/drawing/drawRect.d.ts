/**
 * 画布中绘制矩形
 * @param {HTMLCanvasElement}  canvas 画布对象
 * @param {Array<IDrawingMark>} list 矩形数组
 **/
export declare class DrawRect {
    private canvas;
    private parentElement;
    private ctx;
    private readonly list;
    selectRectIndex: number;
    private hoverRectIndex;
    private sX;
    private sY;
    private downClientX;
    private downClientY;
    private zoom;
    private leftMouseDown;
    private isCanvasDrag;
    private canvasOffsetX;
    private canvasOffsetY;
    private isDrag;
    private isDraged;
    rectColor: string;
    rectSelectColor: string;
    private dragRect;
    constructor(canvas: HTMLCanvasElement, parentElement: HTMLDivElement);
    init(): void;
    /**
     * 准备开始画矩形标记框
     * @public
     */
    addRect(): void;
    exitRect(): void;
    /**
     * 删除rect
     */
    deleteRect(): void;
    /**
     * 图纸复位
     */
    canvasReset(): void;
    /**
     * 修改当前绘制的颜色
     * @param {string} color 颜色
     */
    setRectColor(color: string): void;
    get selectRectColor(): string | undefined;
    /**
     * 高亮选中的模型对应的rect
     * @param {string} uuid modelUuid
     */
    selectRect(uuid: string): void;
    private onmousemove;
    /**
     * 鼠标按下时
     * @param ed
     * @private
     */
    private onmousedown;
    private handleMouseDown;
    /**
     * 鼠标抬起时
     * @private
     */
    private onmouseup;
    private onmouseleave;
    private onmousewheel;
    /**
     * 重新绘制画布
     */
    reDrawCanvas(showSelectLineColor?: boolean): void;
    private onParentMouseDown;
    private onParentMouseUp;
    private onParentMouseMove;
    private onParentMouseLeave;
    dispose(): void;
}
