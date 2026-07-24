/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/9/18 22:24
 * @description
 */
export declare class ListrTask {
    private title;
    private taskFn;
    isFailed: boolean;
    constructor(title: any, taskFn: any);
    run(): Promise<void>;
}
export declare class Listr {
    private tasks;
    constructor(tasks: {
        title: string;
        task: (task: any) => Promise<void>;
    }[]);
    run(): Promise<void>;
}
