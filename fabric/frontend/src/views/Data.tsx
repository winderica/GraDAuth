import { Button } from '@material-ui/core';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { FC } from 'react';
import { Navigate } from 'react-router-dom';

import { api } from '../api';
import { Table } from '../components/Table';
import { useAlice } from '../hooks/useAlice';
import { useStores } from '../hooks/useStores';
import { useUserData } from '../hooks/useUserData';
import { UserDataStore } from '../stores';
import { useStyles } from '../styles/data';
import { encrypt } from '../utils/aliceWrapper';
import { apiWrapper } from '../utils/apiWrapper';

export const Data: FC = observer(() => {
    const classes = useStyles();
    const stores = useStores();
    const { userDataStore, identityStore, keyStore } = stores;
    if (!identityStore.password) {
        return <Navigate to='/' />;
    }
    const alice = useAlice();
    useUserData();
    const tempDataStore = new UserDataStore(toJS(userDataStore.data));
    const handleEncrypt = async () => {
        const oldTags = userDataStore.tags;
        const newTags = tempDataStore.tags;
        userDataStore.setAll(toJS(tempDataStore.data));
        const removedTags = new Set([...oldTags].filter((tag) => !newTags.has(tag)));
        const { dataKey, encrypted } = await encrypt(
            alice,
            userDataStore.dataArrayGroupedByTag.filter(([tag]) => !removedTags.has(tag))
        );
        await apiWrapper(async () => {
            await api.setData(encrypted, identityStore.password);
            await api.delData([...removedTags], identityStore.password);
            await keyStore.set(dataKey);
        }, '正在提交加密数据', '成功加密并提交');
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
