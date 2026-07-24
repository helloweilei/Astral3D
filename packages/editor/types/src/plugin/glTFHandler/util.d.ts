export declare const XMPContext: Record<string, string>;
export declare function formatLong(x: number): string;
export declare function formatBytes(bytes: number, decimals?: number): string;
export declare function dim(str: string): string;
export declare function encodeGLB(u8: Uint8Array, meta?: Record<string, any>): Promise<Uint8Array<ArrayBufferLike>>;
export declare function encodePNG(png: Uint8Array): Promise<Uint8Array<ArrayBufferLike>>;
