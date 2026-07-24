/**
 * 获取资产列表
 */
export declare function fetchGetAssetsList(params: Service.ListPageQueryParams): Promise<Service.RequestResult<Service.ListPageResult<IAssets.Item>>>;
/**
 * 新增资产
 */
export declare function fetchAddAsset(data: IAssets.Item): Promise<Service.RequestResult<IAssets.Item>>;
/**
 * 更新资产
 */
export declare function fetchUpdateAsset(data: IAssets.Item): Promise<Service.RequestResult<IAssets.Item>>;
/**
 * 移除资产
 */
export declare function fetchRemoveAsset(id: IAssets.Item['id']): Promise<Service.RequestResult<unknown>>;
/**
 * 获取分类下的资产tags
 */
export declare function fetchGetAssetCategoryTags(type: IAssets.SupportType, category: string): Promise<Service.RequestResult<string[]>>;
