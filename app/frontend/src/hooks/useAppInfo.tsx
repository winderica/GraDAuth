import { useEffect, useState } from 'react';

interface AppInfo {
    pk: string;
    callback: string;
    data: string[];
}

export const useAppInfo = () => {
    const [appInfo, setAppInfo] = useState<AppInfo>();
    useEffect(() => {
        void (async () => {
            const appInfo = await (await fetch(`http://${location.hostname}:4001/appInfo`, {
                credentials: 'include',
            })).json();
            setAppInfo(appInfo);
        })();
    }, []);
    return appInfo;
};
