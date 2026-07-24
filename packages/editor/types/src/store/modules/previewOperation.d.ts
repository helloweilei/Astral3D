import type { Component } from 'vue';
export interface IPreviewOperation {
    name: string;
    active?: boolean;
    disabled?: boolean;
    loading?: boolean;
    show?: boolean;
    icon: Component;
    children?: {
        [key: string]: IPreviewOperation;
    };
}
interface IPreviewOperationState {
    menuList: {
        [key: string]: IPreviewOperation;
    };
    autoRotateSpeed: number;
    explodeScalar: number;
}
export declare const usePreviewOperationStore: import("pinia").StoreDefinition<"previewOperation", IPreviewOperationState, {}, {}>;
export declare function usePreviewOperationStoreWithOut(): import("pinia").Store<"previewOperation", IPreviewOperationState, {}, {}>;
export {};
