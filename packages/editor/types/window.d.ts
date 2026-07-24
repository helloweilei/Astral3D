declare interface Window {
	$t:(s: string)=>string;
	$cpt:(s: string)=>ComputedRef<string>;
    $loadingBar?: import("naive-ui").LoadingBarProviderInst;
	$dialog: import('naive-ui').DialogProviderInst;
	$modal: import('naive-ui').ModalProviderInst;
	$message?: import('naive-ui').MessageProviderInst;
	$notification: import('naive-ui').NotificationProviderInst;
	viewer: import('@astral3d/engine').Viewer & {
		toggleSubGridByCameraDistance: () => void;
	};
	DrawViewer: any;
	VRButton: any;
    log: import('loglevel').RootLogger;
    // wasm
    glTFHandlerEncodeGLB: (u: Uint8Array, jsonStr: string) => Uint8Array
    glTFHandlerEncodePNG: (png: Uint8Array) => Uint8Array
}

declare interface Number{
	format:()=>string
}

declare namespace Common {
    /**
     * 策略模式
     * [状态, 为true时执行的回调函数]
     */
    type StrategyAction = [boolean, () => void];
}
