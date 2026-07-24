export declare const request: {
    get: <T>(url: string, config?: import("axios").AxiosRequestConfig) => Promise<Service.RequestResult<T>>;
    post: <T>(url: string, data?: any, config?: import("axios").AxiosRequestConfig) => Promise<Service.RequestResult<T>>;
    put: <T>(url: string, data?: any, config?: import("axios").AxiosRequestConfig) => Promise<Service.RequestResult<T>>;
    delete: <T>(url: string, config: import("axios").AxiosRequestConfig) => Promise<Service.RequestResult<T>>;
};
