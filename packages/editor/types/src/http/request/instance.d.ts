import type { AxiosInstance, AxiosRequestConfig } from "axios";
export default class CustomAxiosInstance {
    instance: AxiosInstance;
    backendConfig: Service.BackendResultConfig;
    manager: any;
    /**
     *
     * @param axiosConfig - axios配置
     * @param backendConfig - 后端返回的数据配置
     */
    constructor(axiosConfig: AxiosRequestConfig, backendConfig?: Service.BackendResultConfig);
    /** 设置请求拦截器 */
    setInterceptor(): void;
}
