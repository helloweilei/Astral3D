import type { App } from 'vue';
import { ComputedRef } from 'vue';
export declare function setupI18n(app: App): void;
export declare function t(key: string): string;
export declare function cpt(key: string): ComputedRef<string>;
export declare function setLocale(locale: IConfig.Locale): void;
