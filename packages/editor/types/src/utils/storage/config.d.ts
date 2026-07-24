import type { Storage } from "@astral3d/engine";
export default class Config {
    private static storage;
    static config: {
        [s: string]: any;
    };
    static initialize(storage: Storage): void;
    static getKey(key: string): any;
    static setKey(...args: any[]): void;
    static clear(): void;
}
export declare const initializeConfig: (storage: any) => void;
