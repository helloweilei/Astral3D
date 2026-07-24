import { WebIO, Transform, Logger } from '@gltf-transform/core';
import GLTFHandler from "./glTFHandler";
export declare class Session {
    private _io;
    private _logger;
    private setLogger;
    private _input;
    private _inputName;
    private _output;
    private _outputFormat;
    private _display;
    constructor(_io: WebIO, _logger: Logger, setLogger: (log: string) => void, _input: string, _inputName: string, _output: string);
    static create(handler: GLTFHandler, inputFileUrl: string, inputName: string, output: string): Session;
    setDisplay(display: boolean): this;
    transform(...transforms: Transform[]): Promise<File>;
}
