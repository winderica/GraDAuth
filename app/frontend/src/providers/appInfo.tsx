import React, { createContext, FC, useContext, useEffect, useState } from 'react';

interface AppInfo {
    pk: string;
    callback: string;
    data: string[];
}

export const AppInfoContext = createContext<AppInfo>(null as unknown as AppInfo);

export const useAppInfo = () => useContext(AppInfoContext);

export const AppInfoProvider: FC = ({ children }) => {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    useEffect(() => {
        void (async () => {
            const appInfo = await (await fetch(`http://${location.hostname}:4001/appInfo`, {
                credentials: 'include',
            })).json();
            setAppInfo(appInfo);
        })();
    }, []);
    return appInfo ? (
        <AppInfoContext.Provider value={appInfo}>
            {children}
        </AppInfoContext.Provider>
    ) : null;
};
