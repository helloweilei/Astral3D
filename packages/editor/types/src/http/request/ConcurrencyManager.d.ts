declare const ConcurrencyManager: (axios: any, MAX_CONCURRENT?: number) => {
    queue: any;
    running: any;
    shiftInitial: () => void;
    push: (reqHandler: any) => void;
    shift: () => void;
    requestHandler: (req: any) => Promise<unknown>;
    responseHandler: (res: any) => any;
    responseErrorHandler: (res: any) => Promise<never>;
    interceptors: {
        request: null;
        response: null;
    };
    detach: () => void;
};
export default ConcurrencyManager;
