/**
 * 获取资产分类树
 */
export declare function fetchAssetsCategoryTreeList(params?: {
    type: string;
}): Promise<Service.RequestResult<IAssets.Category[]>>;
