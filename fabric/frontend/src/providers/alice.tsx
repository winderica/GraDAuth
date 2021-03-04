import * as idb from 'idb-keyval';
import { observer } from 'mobx-react-lite';
import React, { FC, useEffect, useState } from 'react';

import { api } from '../api';
import { Generators } from '../constants/types';
import { AliceContext } from '../contexts';
import { useStores } from '../hooks/useStores';
import { Alice } from '../utils/alice';
import { PRE } from '../utils/pre';

export const AliceProvider = observer<FC>(({ children }) => {
    const [alice, setAlice] = useState<Alice | undefined>(undefined);
    const { notificationStore, componentStateStore } = useStores();
    useEffect(() => {
        void (async () => {
            const pre = new PRE();
            await pre.init();
            const gh = await idb.get<Generators>('gh');
            if (!gh) {
                try {
                    notificationStore.enqueueInfo('正在获取生成元');
                    componentStateStore.setProgress(true);
                    const { g, h } = await api.getGenerators();
                    notificationStore.enqueueSuccess('成功获取生成元');
                    await idb.set('gh', { g, h });
                    setAlice(new Alice(pre, g, h));
                } catch ({ message }) {
                    notificationStore.enqueueError(message);
                } finally {
                    componentStateStore.setProgress(false);
                }
            } else {
                const { g, h } = gh;
                setAlice(new Alice(pre, g, h));
            }
        })();
    }, []);
    return alice ? (
        <AliceContext.Provider value={alice}>
            {children}
        </AliceContext.Provider>
    ) : <></>;
});
