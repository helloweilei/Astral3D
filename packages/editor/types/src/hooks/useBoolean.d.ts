/**
 * boolean组合式函数
 * @param initValue 初始值
 */
export default function useBoolean(initValue?: boolean): {
    bool: import("vue").Ref<boolean, boolean>;
    setBool: (value: boolean) => void;
    setTrue: () => void;
    setFalse: () => void;
    toggle: () => void;
};
