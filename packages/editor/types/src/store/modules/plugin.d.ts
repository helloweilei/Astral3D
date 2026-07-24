export declare const usePluginStore: import("pinia").StoreDefinition<"plugin", Pick<{
    getPluginsList: () => import("vue").ComputedRef<IPlugin.Item[]>;
    setPlugins: (_plugins: IPlugin.Item[]) => void;
    addPlugin: (plugin: IPlugin.Item) => void;
    removePlugin: (pluginName: string) => void;
    plugins: import("vue").Ref<{
        [name: string]: IPlugin.Item;
    }, {
        [name: string]: IPlugin.Item;
    }>;
}, "plugins">, Pick<{
    getPluginsList: () => import("vue").ComputedRef<IPlugin.Item[]>;
    setPlugins: (_plugins: IPlugin.Item[]) => void;
    addPlugin: (plugin: IPlugin.Item) => void;
    removePlugin: (pluginName: string) => void;
    plugins: import("vue").Ref<{
        [name: string]: IPlugin.Item;
    }, {
        [name: string]: IPlugin.Item;
    }>;
}, never>, Pick<{
    getPluginsList: () => import("vue").ComputedRef<IPlugin.Item[]>;
    setPlugins: (_plugins: IPlugin.Item[]) => void;
    addPlugin: (plugin: IPlugin.Item) => void;
    removePlugin: (pluginName: string) => void;
    plugins: import("vue").Ref<{
        [name: string]: IPlugin.Item;
    }, {
        [name: string]: IPlugin.Item;
    }>;
}, "getPluginsList" | "setPlugins" | "addPlugin" | "removePlugin">>;
export declare function usePluginStoreWithOut(): import("pinia").Store<"plugin", Pick<{
    getPluginsList: () => import("vue").ComputedRef<IPlugin.Item[]>;
    setPlugins: (_plugins: IPlugin.Item[]) => void;
    addPlugin: (plugin: IPlugin.Item) => void;
    removePlugin: (pluginName: string) => void;
    plugins: import("vue").Ref<{
        [name: string]: IPlugin.Item;
    }, {
        [name: string]: IPlugin.Item;
    }>;
}, "plugins">, Pick<{
    getPluginsList: () => import("vue").ComputedRef<IPlugin.Item[]>;
    setPlugins: (_plugins: IPlugin.Item[]) => void;
    addPlugin: (plugin: IPlugin.Item) => void;
    removePlugin: (pluginName: string) => void;
    plugins: import("vue").Ref<{
        [name: string]: IPlugin.Item;
    }, {
        [name: string]: IPlugin.Item;
    }>;
}, never>, Pick<{
    getPluginsList: () => import("vue").ComputedRef<IPlugin.Item[]>;
    setPlugins: (_plugins: IPlugin.Item[]) => void;
    addPlugin: (plugin: IPlugin.Item) => void;
    removePlugin: (pluginName: string) => void;
    plugins: import("vue").Ref<{
        [name: string]: IPlugin.Item;
    }, {
        [name: string]: IPlugin.Item;
    }>;
}, "getPluginsList" | "setPlugins" | "addPlugin" | "removePlugin">>;
