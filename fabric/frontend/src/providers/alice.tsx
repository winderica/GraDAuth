import * as idb from 'idb-keyval';
import { observer } from 'mobx-react-lite';
import React, { FC, useEffect, useState } from 'react';

import { api } from '../api';
import { Generators } from '../constants/types';
import { AliceContext } from '../contexts';
import { Alice } from '../utils/alice';
import { apiWrapper } from '../utils/apiWrapper';
import { PRE } from '../utils/pre';

export const AliceProvider: FC = observer(({ children }) => {
    const [alice, setAlice] = useState<Alice>();
    useEffect(() => {
        void (async () => {
            const pre = new PRE();
            await pre.init();
            const gh = await idb.get<Generators>('gh');
            if (!gh) {
                await apiWrapper(async () => {
                    const { g, h } = await api.getGenerators();
                    await idb.set('gh', { g, h });
                    setAlice(new Alice(pre, g, h));
                }, '正在获取生成元', '成功获取生成元');
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
