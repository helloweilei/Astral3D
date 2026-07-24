/**
 * 开启 WebSocket 链接，全局只需执行一次
 * @param url
 */
export declare function connectWebSocket(url: any): void;
/**
 * 添加 WebSocket 消息监听
 * @param callback
 */
export declare function onWebSocket(callback: (data: object) => any): void;
/**
 * 解除 WebSocket 消息监听
 *
 * @param callback
 */
export declare function offWebSocket(callback: (data: object) => any): void;
export declare function useWebSocket(): {
    data: string | null;
    status: import("@vueuse/core").WebSocketStatus;
    close: WebSocket["close"];
    open: import("@vueuse/core").Fn;
    send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
    ws: WebSocket | undefined;
} | null;
export declare function send(message: string | ArrayBuffer | Blob): void;
