/**
 * 通过Fetch API下载文件/图片（支持跨域/Blob处理）
 * @param {string} url 文件地址
 * @param {string} filename 保存的文件名
 */
export declare function downloadWithFetch(url: string, filename?: string): Promise<void>;
/**
 * 文件大小 字节转换单位
 * @param {number} size
 * @returns {string|*}
 */
export declare const filterSize: (size: number) => string | any;
export declare const getServiceStaticFile: (url: string) => string;
