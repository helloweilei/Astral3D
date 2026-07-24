/** 错误信息的显示时间 */
export declare const ERROR_MSG_DURATION: number;
/** 默认的请求错误code */
export declare const DEFAULT_REQUEST_ERROR_CODE = "DEFAULT";
/** 默认的请求错误文本 */
export declare const DEFAULT_REQUEST_ERROR_MSG = "\u8BF7\u6C42\u9519\u8BEF~";
/** 请求超时的错误code(为固定值：ECONNABORTED) */
export declare const REQUEST_TIMEOUT_CODE = "ECONNABORTED";
/** 请求超时的错误文本 */
export declare const REQUEST_TIMEOUT_MSG = "\u8BF7\u6C42\u8D85\u65F6~";
/** 网络不可用的code */
export declare const NETWORK_ERROR_CODE = "NETWORK_ERROR";
/** 网络不可用的错误文本 */
export declare const NETWORK_ERROR_MSG = "\u7F51\u7EDC\u4E0D\u53EF\u7528~";
/** 请求不成功各种状态的错误 */
export declare const ERROR_STATUS: {
    400: string;
    401: string;
    403: string;
    404: string;
    405: string;
    408: string;
    500: string;
    501: string;
    502: string;
    503: string;
    504: string;
    505: string;
    DEFAULT: string;
};
/** 不弹出错误信息的code */
export declare const NO_ERROR_MSG_CODE: (string | number)[];
/** token失效需要刷新token的code */
export declare const REFRESH_TOKEN_CODE: (string | number)[];
