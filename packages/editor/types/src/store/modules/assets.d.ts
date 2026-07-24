/**
 * 资产管理
 */
export declare const useAssetsStore: import("pinia").StoreDefinition<"assets-manager", Pick<{
    getCategoryChildren: (category: string) => IAssets.Category[];
    fetchCategory: () => Promise<void>;
    categories: import("vue").Ref<{
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[], {
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[]>;
}, "categories">, Pick<{
    getCategoryChildren: (category: string) => IAssets.Category[];
    fetchCategory: () => Promise<void>;
    categories: import("vue").Ref<{
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[], {
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[]>;
}, never>, Pick<{
    getCategoryChildren: (category: string) => IAssets.Category[];
    fetchCategory: () => Promise<void>;
    categories: import("vue").Ref<{
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[], {
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[]>;
}, "getCategoryChildren" | "fetchCategory">>;
export declare function useAssetsStoreWithOut(): import("pinia").Store<"assets-manager", Pick<{
    getCategoryChildren: (category: string) => IAssets.Category[];
    fetchCategory: () => Promise<void>;
    categories: import("vue").Ref<{
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[], {
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[]>;
}, "categories">, Pick<{
    getCategoryChildren: (category: string) => IAssets.Category[];
    fetchCategory: () => Promise<void>;
    categories: import("vue").Ref<{
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[], {
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[]>;
}, never>, Pick<{
    getCategoryChildren: (category: string) => IAssets.Category[];
    fetchCategory: () => Promise<void>;
    categories: import("vue").Ref<{
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[], {
        key: IAssets.SupportType;
        label: string | ComputedRef<string>;
        icon: any;
        children: {
            id: string | number;
            key: string;
            label: string;
            pkey: string | null;
            sortNum: number;
            type: IAssets.SupportType;
            children: /*elided*/ any[];
        }[];
    }[]>;
}, "getCategoryChildren" | "fetchCategory">>;
