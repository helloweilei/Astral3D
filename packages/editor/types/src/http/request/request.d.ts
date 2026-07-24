import type { Ref } from "vue";
import type { AxiosRequestConfig } from "axios";
/**
 * 创建请求
 * @param axiosConfig - axios配置
 * @param backendConfig - 后端接口字段配置
 */
export declare function createRequest(axiosConfig: AxiosRequestConfig, backendConfig?: Service.BackendResultConfig): {
    get: <T>(url: string, config?: AxiosRequestConfig) => Promise<Service.RequestResult<T>>;
    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<Service.RequestResult<T>>;
    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<Service.RequestResult<T>>;
    delete: <T>(url: string, config: AxiosRequestConfig) => Promise<Service.RequestResult<T>>;
};
interface RequestResultHook<T = any> {
    data: Ref<T | null>;
    error: Ref<Service.RequestError | null>;
    loading: Ref<boolean>;
    network: Ref<boolean>;
}
/**
 * 创建hooks请求
 * @param axiosConfig - axios配置
 * @param backendConfig - 后端接口字段配置
 */
export declare function createHookRequest(axiosConfig: AxiosRequestConfig, backendConfig?: Service.BackendResultConfig): {
    get: <T>(url: string, config?: AxiosRequestConfig) => RequestResultHook<T>;
    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => RequestResultHook<T>;
    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => RequestResultHook<T>;
    delete: <T>(url: string, config: AxiosRequestConfig) => RequestResultHook<T>;
};
export {};
