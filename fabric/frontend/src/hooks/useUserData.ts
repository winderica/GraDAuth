import { useEffect } from 'react';

import { api } from '../api';
import { UserData } from '../constants/types';
import { asyncAction } from '../utils/asyncAction';
import { hmac } from '../utils/hmac';

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
            const map: Record<string, string> = {};
            for (const tag of tags) {
                map[await hmac(tag, keyStore.tagHMACKey, 'hex', 'hex')] = tag;
            }
            const data = await api.getData(Object.keys(map));
            const decrypted: UserData = {};
            for (const [tag, encrypted] of Object.entries(data)) {
                const { key, value } = JSON.parse(await alice.decrypt(encrypted, keyStore.dataKey[map[tag]].sk));
                decrypted[key as string] = { tag: map[tag], value };
            }
            userDataStore.setAll(decrypted);
        }, '获取数据');
    }, []);
};
