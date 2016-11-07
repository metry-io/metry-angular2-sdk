export interface WrappedStorage {
    setItem: (key: string, value?: any) => void;
    removeItem: (key: string) => void;
    getItem: (key: string) => any;
}
export declare function storage(): WrappedStorage;
