import { Preview } from "@astral3d/engine";
export declare class AssetPreview {
    #private;
    previewer: Preview;
    private container;
    static getInstance(container?: HTMLElement): AssetPreview;
    constructor(container?: HTMLElement);
    updateContainer(container: HTMLElement): void;
    /**
     * 加载预览项
     */
    load(fileOrUrl: string | File, type?: string): Promise<unknown>;
    clear(): void;
    dispose(): void;
}
