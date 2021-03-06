import { Button } from '@material-ui/core';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { FC } from 'react';
import { Navigate } from 'react-router-dom';

import { api } from '../api';
import { Table } from '../components/Table';
import { TaggedEncrypted } from '../constants/types';
import { useAlice } from '../hooks/useAlice';
import { useStores } from '../hooks/useStores';
import { useUserData } from '../hooks/useUserData';
import { UserDataStore } from '../stores';
import { useStyles } from '../styles/data';
import { asyncAction } from '../utils/asyncAction';
import { hmac } from '../utils/hmac';

export const Data: FC = observer(() => {
    const classes = useStyles();
    const stores = useStores();
    const { userDataStore, keyStore } = stores;
    if (!keyStore.password) {
        return <Navigate to='/' />;
    }
    const alice = useAlice();
    useUserData();
    const tempDataStore = new UserDataStore(toJS(userDataStore.data));
    const handleEncrypt = async () => {
        const oldTags = userDataStore.tags;
        userDataStore.setAll(toJS(tempDataStore.data));
        const encrypted: TaggedEncrypted = {};
        const removedTags: string[] = [];
        for (const tag of oldTags) {
            if (!userDataStore.tags.has(tag)) {
                removedTags.push(await hmac(tag, keyStore.tagHMACKey, 'hex', 'hex'));
                keyStore.del(tag);
            }
        }
        for (const { key, tag, value } of userDataStore.dataArray) {
            if (!oldTags.has(tag)) {
                const { pk, sk } = alice.key();
                const hashedTag = await hmac(tag, keyStore.tagHMACKey, 'hex', 'hex');
                encrypted[hashedTag] = await alice.encrypt(JSON.stringify({ key, value }), pk);
                keyStore.set(tag, { pk, sk });
            }
        }
        await asyncAction(async () => {
            await Promise.all([api.setData(keyStore.tagKey, encrypted), api.delData(keyStore.tagKey, removedTags)]);
            await keyStore.save();
        }, '提交加密数据');
    };
    return (
        <div className={classes.container}>
            <Table title='个人信息' dataStore={tempDataStore} />
            <Button
                onClick={handleEncrypt}
                variant='contained'
                color='primary'
                className={classes.button}
            >
                加密并提交
            </Button>
        </div>
    );
});
