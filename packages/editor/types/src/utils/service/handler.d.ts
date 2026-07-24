/** 统一失败和成功的请求结果的数据类型 */
export declare function handleServiceResult(error: Service.RequestError | null, data: any, other?: any): Promise<any>;
/** 请求结果的适配器：用于接收适配器函数和请求结果 */
export declare function adapter<T extends Service.ServiceAdapter>(adapterFun: T, ...args: Service.MultiRequestResult<any>): Service.RequestResult<ReturnType<T>>;
