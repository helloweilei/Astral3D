/**
 * 获取bim转换列表
 */
export declare function fetchGetBim2GltfList(params: any): Promise<Service.RequestResult<Service.ListPageResult<IBIMData>>>;
/**
 * 上传bim文件
 */
export declare function fetchUploadRvt(data: any): Promise<Service.RequestResult<unknown>>;
/**
 * 添加数据并启动revit转换（ 需传入接收结果的websocket uname）
 */
export declare function fetchAddBim2Gltf(data: any): Promise<Service.RequestResult<unknown>>;
