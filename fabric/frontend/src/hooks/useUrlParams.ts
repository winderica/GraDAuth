import { useSearchParams } from 'react-router-dom';

export const useUrlParams = <T>(key: string) => {
    const [searchParams] = useSearchParams();
    const res = searchParams.get(key);
    if (!res) {
        return undefined;
    }
    try {
        return JSON.parse(res) as T;
    } catch {
        return undefined;
    }
};
