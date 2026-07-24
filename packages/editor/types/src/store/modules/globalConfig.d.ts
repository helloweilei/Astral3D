import type { GlobalTheme } from 'naive-ui';
/**
 * 全局配置
 */
export declare const useGlobalConfigStore: import("pinia").StoreDefinition<"global-config", Pick<{
    theme: import("@vueuse/core").RemovableRef<IConfig.Theme>;
    locale: import("@vueuse/core").RemovableRef<IConfig.Locale>;
    mainColor: import("@vueuse/core").RemovableRef<IConfig.Color>;
    loading: import("vue").Ref<boolean, boolean>;
    loadingText: import("vue").Ref<string, string>;
    getProviderTheme: () => GlobalTheme;
    setTheme: () => void;
    setLocale: (local: IConfig.Locale) => void;
    setPrimaryColor: (color: IConfig.Color) => void;
}, "theme" | "locale" | "mainColor" | "loading" | "loadingText">, Pick<{
    theme: import("@vueuse/core").RemovableRef<IConfig.Theme>;
    locale: import("@vueuse/core").RemovableRef<IConfig.Locale>;
    mainColor: import("@vueuse/core").RemovableRef<IConfig.Color>;
    loading: import("vue").Ref<boolean, boolean>;
    loadingText: import("vue").Ref<string, string>;
    getProviderTheme: () => GlobalTheme;
    setTheme: () => void;
    setLocale: (local: IConfig.Locale) => void;
    setPrimaryColor: (color: IConfig.Color) => void;
}, never>, Pick<{
    theme: import("@vueuse/core").RemovableRef<IConfig.Theme>;
    locale: import("@vueuse/core").RemovableRef<IConfig.Locale>;
    mainColor: import("@vueuse/core").RemovableRef<IConfig.Color>;
    loading: import("vue").Ref<boolean, boolean>;
    loadingText: import("vue").Ref<string, string>;
    getProviderTheme: () => GlobalTheme;
    setTheme: () => void;
    setLocale: (local: IConfig.Locale) => void;
    setPrimaryColor: (color: IConfig.Color) => void;
}, "getProviderTheme" | "setTheme" | "setLocale" | "setPrimaryColor">>;
export declare function useGlobalConfigStoreWithOut(): import("pinia").Store<"global-config", Pick<{
    theme: import("@vueuse/core").RemovableRef<IConfig.Theme>;
    locale: import("@vueuse/core").RemovableRef<IConfig.Locale>;
    mainColor: import("@vueuse/core").RemovableRef<IConfig.Color>;
    loading: import("vue").Ref<boolean, boolean>;
    loadingText: import("vue").Ref<string, string>;
    getProviderTheme: () => GlobalTheme;
    setTheme: () => void;
    setLocale: (local: IConfig.Locale) => void;
    setPrimaryColor: (color: IConfig.Color) => void;
}, "theme" | "locale" | "mainColor" | "loading" | "loadingText">, Pick<{
    theme: import("@vueuse/core").RemovableRef<IConfig.Theme>;
    locale: import("@vueuse/core").RemovableRef<IConfig.Locale>;
    mainColor: import("@vueuse/core").RemovableRef<IConfig.Color>;
    loading: import("vue").Ref<boolean, boolean>;
    loadingText: import("vue").Ref<string, string>;
    getProviderTheme: () => GlobalTheme;
    setTheme: () => void;
    setLocale: (local: IConfig.Locale) => void;
    setPrimaryColor: (color: IConfig.Color) => void;
}, never>, Pick<{
    theme: import("@vueuse/core").RemovableRef<IConfig.Theme>;
    locale: import("@vueuse/core").RemovableRef<IConfig.Locale>;
    mainColor: import("@vueuse/core").RemovableRef<IConfig.Color>;
    loading: import("vue").Ref<boolean, boolean>;
    loadingText: import("vue").Ref<string, string>;
    getProviderTheme: () => GlobalTheme;
    setTheme: () => void;
    setLocale: (local: IConfig.Locale) => void;
    setPrimaryColor: (color: IConfig.Color) => void;
}, "getProviderTheme" | "setTheme" | "setLocale" | "setPrimaryColor">>;
