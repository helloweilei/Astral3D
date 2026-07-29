import type {Storage} from "@astral3d/engine";

export default class Config {
    private static storage: Storage;
    public static config: { [s: string]: any };

    static initialize(storage: Storage) {
        Config.storage = storage;
        Config.config = {
            // 场景界面与扩展面板分割大小
            sceneSplitSize: 0.8,
            // 左侧资源/场景树面板宽度（px）
            assetsSiderWidth: 300,
            // 图纸绘制区
            cad:{
                bgColor:0x000000
            }

        };

        for (let key of Object.keys(Config.config)) {
            Config.storage.getConfigItem(key).then(_value => {
                if (_value === null) {
                    Config.storage.setConfigItem(key, Config.config[key]);
                } else {
                    let newVal = _value;
                    // 有可能会在代码开发过程中增加新的配置项
                    if (Config.config[key] && typeof Config.config[key] === "object") {
                        newVal = Object.assign({}, Config.config[key], _value);
                    }
                    Config.config[key] = newVal;

                    if (newVal !== _value) {
                        Config.storage.setConfigItem(key, newVal);
                    }
                }
            }).catch(() => {
                Config.storage.setConfigItem(key, Config.config[key]);
            });
        }
    }

    static getKey(key: string) {
        return Config.config[key];
    }

    static setKey(...args: any[]) {
        // key, value, key, value ...
        for (let i = 0, l = args.length; i < l; i += 2) {
            const key = args[i];
            const value = args[i + 1];
            Config.config[key] = value;
            Config.storage.setConfigItem(key, value);
        }
    }

    static clear() {
        for (let key of Object.keys(Config.config)) {
            Config.storage.removeConfigItem(key);
        }
    }
}

// 初始化配置
export const initializeConfig = (storage) => Config.initialize(storage);