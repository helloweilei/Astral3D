/**
 * websocket相关
 */
export declare const useWebsocketStore: import("pinia").StoreDefinition<"websocket", Pick<{
    getIsOpen: () => boolean | null;
    setWebsocket: (websocket: any) => void;
    setUname: (uname: string) => void;
    send: (message: string | ArrayBuffer | Blob) => void;
    ws: import("vue").Ref<{
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null, {
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null>;
    uname: import("vue").Ref<string, string>;
}, "ws" | "uname">, Pick<{
    getIsOpen: () => boolean | null;
    setWebsocket: (websocket: any) => void;
    setUname: (uname: string) => void;
    send: (message: string | ArrayBuffer | Blob) => void;
    ws: import("vue").Ref<{
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null, {
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null>;
    uname: import("vue").Ref<string, string>;
}, never>, Pick<{
    getIsOpen: () => boolean | null;
    setWebsocket: (websocket: any) => void;
    setUname: (uname: string) => void;
    send: (message: string | ArrayBuffer | Blob) => void;
    ws: import("vue").Ref<{
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null, {
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null>;
    uname: import("vue").Ref<string, string>;
}, "send" | "getIsOpen" | "setWebsocket" | "setUname">>;
export declare function useWebsocketStoreWithOut(): import("pinia").Store<"websocket", Pick<{
    getIsOpen: () => boolean | null;
    setWebsocket: (websocket: any) => void;
    setUname: (uname: string) => void;
    send: (message: string | ArrayBuffer | Blob) => void;
    ws: import("vue").Ref<{
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null, {
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null>;
    uname: import("vue").Ref<string, string>;
}, "ws" | "uname">, Pick<{
    getIsOpen: () => boolean | null;
    setWebsocket: (websocket: any) => void;
    setUname: (uname: string) => void;
    send: (message: string | ArrayBuffer | Blob) => void;
    ws: import("vue").Ref<{
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null, {
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null>;
    uname: import("vue").Ref<string, string>;
}, never>, Pick<{
    getIsOpen: () => boolean | null;
    setWebsocket: (websocket: any) => void;
    setUname: (uname: string) => void;
    send: (message: string | ArrayBuffer | Blob) => void;
    ws: import("vue").Ref<{
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null, {
        data: string | null;
        status: import("@vueuse/core").WebSocketStatus;
        close: WebSocket["close"];
        open: import("@vueuse/core").Fn;
        send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
        ws: WebSocket | undefined;
    } | null>;
    uname: import("vue").Ref<string, string>;
}, "send" | "getIsOpen" | "setWebsocket" | "setUname">>;
