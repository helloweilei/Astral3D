import type { ModalReactive } from "naive-ui";
import type { Plugin } from "@astral3d/engine";
export default class PointCloudReconstructor implements Plugin {
    icon: string;
    name: string;
    version: number;
    modalInstance: ModalReactive | undefined;
    componentRef: import("vue").Ref<any, any>;
    install(): Promise<void>;
    run(): Promise<void>;
    finish(): void;
    uninstall(): void;
}
