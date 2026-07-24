/**
 * 获取所有示例场景
 */
export declare function fetchSceneExampleList(params: any): Promise<Service.RequestResult<Service.ListPageResult<ISceneFetchData>>>;
/**
 * 获取示例场景
 */
export declare function fetchSceneExample(id: any): Promise<Service.RequestResult<unknown>>;
/**
 * 新增示例场景
 */
export declare function fetchAddSceneExample(data: any): Promise<Service.RequestResult<unknown>>;
/**
 * 删除示例场景
 * @param {number} id
 */
export declare function fetchDeleteSceneExample(id: number): Promise<Service.RequestResult<unknown>>;
