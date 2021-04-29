import { useEffect } from 'react';

import { api } from '../api';
import { UserData } from '../constants/types';
import { asyncAction } from '../utils/asyncAction';

import { useAlice } from './useAlice';
import { useStores } from './useStores';

export const useUserData = () => {
    const alice = useAlice();
    const { keyStore, userDataStore } = useStores();
    useEffect(() => {
        if (userDataStore.dataArray.length) {
            return;
        }
        void asyncAction(async () => {
            const tags = Object.keys(keyStore.dataKey);
            const data = await api.getData(tags);
            const decrypted: UserData = {};
            for (const [tag, encrypted] of Object.entries(data)) {
                const { key, value } = JSON.parse(await alice.decrypt(encrypted, keyStore.dataKey[tag].sk));
                decrypted[key as string] = { tag, value };
            }
            userDataStore.setAll(decrypted);
        }, '获取数据');
    }, []);
};
