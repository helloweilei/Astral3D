/**
 * 获取cad列表
 */
export declare function fetchGetCadList(params: any): Promise<Service.RequestResult<Service.ListPageResult<ICad.Data>>>;
/**
 * 添加数据并启动cad解析（ 需传入接收结果的websocket uname）
 */
export declare function fetchAddDwg2dxf(data: any): Promise<Service.RequestResult<ICad.Data>>;
