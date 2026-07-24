/**
 * 上传
 */
export declare function fetchUpload(data: {
    file: File;
    biz: string;
    type?: string;
}): Promise<Service.RequestResult<string>>;
