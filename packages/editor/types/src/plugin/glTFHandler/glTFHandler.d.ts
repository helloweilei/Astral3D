import type { ModalReactive } from "naive-ui";
import type { Plugin } from "@astral3d/engine";
import { Logger, WebIO } from '@gltf-transform/core';
export declare const MICROMATCH_OPTIONS: {
    nocase: boolean;
    contains: boolean;
};
export default class GLTFHandler implements Plugin {
    icon: string;
    name: string;
    version: number;
    logger: Logger;
    io: WebIO;
    modalInstance: ModalReactive | undefined;
    GLTFHandlerComponentRef: import("vue").Ref<any, any>;
    dracoScript: {
        encoder: boolean;
        decoder: boolean;
        failMsg: string;
    };
    install(): Promise<void>;
    run(): Promise<void>;
    finish(): void;
    uninstall(): void;
    setLogger(log: string): void;
    registerDependencies(): Promise<void>;
    optimize(opts: IPlugin.GLTFHandlerOptimizeModel, inputFile: File, outputFileName?: string): Promise<File | undefined>;
}
