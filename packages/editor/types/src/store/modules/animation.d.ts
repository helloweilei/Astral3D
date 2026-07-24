import type { TimelineTrack } from "@astral3d/engine";
export interface IAnimationItem {
    name: string;
    uuid: string;
    isRunning: boolean;
    isPaused: boolean;
}
/**
 * 模型动画（动画编辑器）
 */
export declare const useAnimationStore: import("pinia").StoreDefinition<"model-animation", Pick<{
    getStepVal: () => number;
    getFormattedDuration: import("vue").ComputedRef<string>;
    getFormattedCurrentTime: import("vue").ComputedRef<string>;
    setTimelineInstance: (instance: TimelineTrack) => void;
    setList: (_list: Array<IAnimationItem>, _current?: IAnimationItem | null) => void;
    setCurrent: (value: IAnimationItem | null) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    jumpToStart: () => void;
    jumpToEnd: () => void;
    addKeyframe: (attr: string) => void;
    setPlayTime: (time: number) => void;
    list: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[], {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[]>;
    current: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null, {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null>;
    trackTree: import("vue").Ref<{
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[], {
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[]>;
    mixerTimeScale: import("vue").Ref<number, number>;
    currentTime: import("vue").Ref<number, number>;
    duration: import("vue").Ref<number, number>;
}, "duration" | "list" | "current" | "trackTree" | "mixerTimeScale" | "currentTime">, Pick<{
    getStepVal: () => number;
    getFormattedDuration: import("vue").ComputedRef<string>;
    getFormattedCurrentTime: import("vue").ComputedRef<string>;
    setTimelineInstance: (instance: TimelineTrack) => void;
    setList: (_list: Array<IAnimationItem>, _current?: IAnimationItem | null) => void;
    setCurrent: (value: IAnimationItem | null) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    jumpToStart: () => void;
    jumpToEnd: () => void;
    addKeyframe: (attr: string) => void;
    setPlayTime: (time: number) => void;
    list: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[], {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[]>;
    current: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null, {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null>;
    trackTree: import("vue").Ref<{
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[], {
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[]>;
    mixerTimeScale: import("vue").Ref<number, number>;
    currentTime: import("vue").Ref<number, number>;
    duration: import("vue").Ref<number, number>;
}, "getFormattedDuration" | "getFormattedCurrentTime">, Pick<{
    getStepVal: () => number;
    getFormattedDuration: import("vue").ComputedRef<string>;
    getFormattedCurrentTime: import("vue").ComputedRef<string>;
    setTimelineInstance: (instance: TimelineTrack) => void;
    setList: (_list: Array<IAnimationItem>, _current?: IAnimationItem | null) => void;
    setCurrent: (value: IAnimationItem | null) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    jumpToStart: () => void;
    jumpToEnd: () => void;
    addKeyframe: (attr: string) => void;
    setPlayTime: (time: number) => void;
    list: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[], {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[]>;
    current: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null, {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null>;
    trackTree: import("vue").Ref<{
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[], {
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[]>;
    mixerTimeScale: import("vue").Ref<number, number>;
    currentTime: import("vue").Ref<number, number>;
    duration: import("vue").Ref<number, number>;
}, "pause" | "play" | "getStepVal" | "setTimelineInstance" | "setList" | "setCurrent" | "stop" | "jumpToStart" | "jumpToEnd" | "addKeyframe" | "setPlayTime">>;
export declare function useAnimationStoreWithOut(): import("pinia").Store<"model-animation", Pick<{
    getStepVal: () => number;
    getFormattedDuration: import("vue").ComputedRef<string>;
    getFormattedCurrentTime: import("vue").ComputedRef<string>;
    setTimelineInstance: (instance: TimelineTrack) => void;
    setList: (_list: Array<IAnimationItem>, _current?: IAnimationItem | null) => void;
    setCurrent: (value: IAnimationItem | null) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    jumpToStart: () => void;
    jumpToEnd: () => void;
    addKeyframe: (attr: string) => void;
    setPlayTime: (time: number) => void;
    list: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[], {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[]>;
    current: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null, {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null>;
    trackTree: import("vue").Ref<{
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[], {
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[]>;
    mixerTimeScale: import("vue").Ref<number, number>;
    currentTime: import("vue").Ref<number, number>;
    duration: import("vue").Ref<number, number>;
}, "duration" | "list" | "current" | "trackTree" | "mixerTimeScale" | "currentTime">, Pick<{
    getStepVal: () => number;
    getFormattedDuration: import("vue").ComputedRef<string>;
    getFormattedCurrentTime: import("vue").ComputedRef<string>;
    setTimelineInstance: (instance: TimelineTrack) => void;
    setList: (_list: Array<IAnimationItem>, _current?: IAnimationItem | null) => void;
    setCurrent: (value: IAnimationItem | null) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    jumpToStart: () => void;
    jumpToEnd: () => void;
    addKeyframe: (attr: string) => void;
    setPlayTime: (time: number) => void;
    list: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[], {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[]>;
    current: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null, {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null>;
    trackTree: import("vue").Ref<{
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[], {
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[]>;
    mixerTimeScale: import("vue").Ref<number, number>;
    currentTime: import("vue").Ref<number, number>;
    duration: import("vue").Ref<number, number>;
}, "getFormattedDuration" | "getFormattedCurrentTime">, Pick<{
    getStepVal: () => number;
    getFormattedDuration: import("vue").ComputedRef<string>;
    getFormattedCurrentTime: import("vue").ComputedRef<string>;
    setTimelineInstance: (instance: TimelineTrack) => void;
    setList: (_list: Array<IAnimationItem>, _current?: IAnimationItem | null) => void;
    setCurrent: (value: IAnimationItem | null) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    jumpToStart: () => void;
    jumpToEnd: () => void;
    addKeyframe: (attr: string) => void;
    setPlayTime: (time: number) => void;
    list: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[], {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    }[]>;
    current: import("vue").Ref<{
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null, {
        name: string;
        uuid: string;
        isRunning: boolean;
        isPaused: boolean;
    } | null>;
    trackTree: import("vue").Ref<{
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[], {
        [x: string]: unknown;
        key?: import("naive-ui/es/tree/src/interface").Key | undefined;
        label?: string | undefined;
        checkboxDisabled?: boolean | undefined;
        disabled?: boolean | undefined;
        isLeaf?: boolean | undefined;
        children?: /*elided*/ any[] | undefined;
        prefix?: (() => import("vue").VNodeChild) | undefined;
        suffix?: (() => import("vue").VNodeChild) | undefined;
    }[]>;
    mixerTimeScale: import("vue").Ref<number, number>;
    currentTime: import("vue").Ref<number, number>;
    duration: import("vue").Ref<number, number>;
}, "pause" | "play" | "getStepVal" | "setTimelineInstance" | "setList" | "setCurrent" | "stop" | "jumpToStart" | "jumpToEnd" | "addKeyframe" | "setPlayTime">>;
