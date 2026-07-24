export default function useLoading(initValue?: boolean): {
    loading: import("vue").Ref<boolean, boolean>;
    startLoading: () => void;
    endLoading: () => void;
};
