import GLTFHandler from "./glTFHandler/glTFHandler";
import PointCloudReconstructor from "./pointCloudReconstructor/PointCloudReconstructor";
import ShaderPlayground from "./shaderPlayground/ShaderPlayground";

// 注册内置插件
export const installBuiltinPlugin = (viewer) => {
    //glTF处理器
    viewer.modules.plugin.use(new GLTFHandler());
    // 语义化点云重建
    viewer.modules.plugin.use(new PointCloudReconstructor());
    // 着色器沙盒（实时学习）
    viewer.modules.plugin.use(new ShaderPlayground());
}