import { useEffect } from 'react';

import { api } from '../api';
import { decrypt } from '../utils/aliceWrapper';
import { asyncAction } from '../utils/asyncAction';

import { useAlice } from './useAlice';
import { useStores } from './useStores';

export const useUserData = () => {
    const alice = useAlice();
    const { keyStore, userDataStore } = useStores();
    useEffect(() => {
        if (!userDataStore.dataArray.length) {
            void asyncAction(async () => {
                const data = await api.getData(Object.keys(keyStore.dataKey));
                userDataStore.setAll(await decrypt(alice, data, keyStore.dataKey));
            }, '获取数据');
        }
    }, []);
};
