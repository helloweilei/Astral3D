import type { AxiosError, AxiosResponse } from 'axios';
import { Service } from "../../../types/network";
/**
 * 策略模式
 * @param actions 每一种可能执行的操作
 */
export declare function exeStrategyActions(actions: Common.StrategyAction[]): void;
/**
 * 处理axios请求失败的错误
 * @param axiosError - 错误
 */
export declare function handleAxiosError(axiosError: AxiosError): Service.RequestError;
/**
 * 处理请求成功后的错误
 * @param response - 请求的响应
 */
export declare function handleResponseError(response: AxiosResponse): Service.RequestError;
/**
 * 处理后端返回的错误(业务错误)
 * @param backendResult - 后端接口的响应数据
 */
export declare function handleBackendError(backendResult: Record<string, any>, config: Service.BackendResultConfig): Service.RequestError;
