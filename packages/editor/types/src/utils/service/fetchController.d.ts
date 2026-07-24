/**
 * 创建一个handlerFetch
 *
 * @param limit 并发控制
 * @param timeout 超时设
 * @return function 返回一个函数
 */
export declare function fetchController(limit: number, timeout: number | boolean): (url: string, options?: any) => void;
