import { Button, Card, CardActions, CardContent, CardHeader, Typography } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { api } from '../api';
import { Checkbox } from '../components/Checkbox';
import { Table } from '../components/Table';
import { Checked, TaggedEncrypted, TaggedPreKeyPair } from '../constants/types';
import { useAlice } from '../hooks/useAlice';
import { useStores } from '../hooks/useStores';
import { useUrlParams } from '../hooks/useUrlParams';
import { useUserData } from '../hooks/useUserData';
import { UserDataStore } from '../stores';
import { useStyles } from '../styles/auth';
import { AES } from '../utils/aes';
import { asyncAction } from '../utils/asyncAction';

interface AuthGettingRequest {
    type: 'get';
    id: string;
    pk: string;
    callback: string;
    data: string[];
}

interface AuthSettingRequest {
    type: 'set';
    id: string;
    pk: string;
    callback: string;
    data: Record<string, string>;
}

type AuthRequest = AuthGettingRequest | AuthSettingRequest;

const AuthGetting: FC<{ request: AuthGettingRequest }> = observer(({ request }) => {
    const { keyStore, userDataStore } = useStores();
    useUserData();
    const alice = useAlice();
    const classes = useStyles();
    const [checked, setChecked] = useState<Checked>({});
    const handleAuth = async () => {
        const aes = new AES(keyStore.tagKey, keyStore.tagIV, 'AES-CTR');
        const data: Record<string, string> = {};
        for (const { key, tag } of userDataStore.dataArray) {
            if (!checked[key]) {
                continue;
            }
            data[await aes.encrypt(tag, 'hex', 'hex')] = alice.reKey(request.pk, keyStore.dataKey[tag].sk);
        }
        await asyncAction(async () => {
            await api.reEncrypt(data, request.callback);
        }, '提交重加密密钥');
    };

    const handleCheck = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setChecked((prevChecked) => ({ ...prevChecked, [name]: checked }));
    };
    return (
        <Card className={classes.container}>
            <CardHeader title='授权获取信息' />
            <CardContent>
                <Typography>为应用生成重加密密钥，将您保存在GraDAuth上的数据安全地发送给应用。</Typography>
                <Typography>应用{request.id}想要获取您的以下信息：</Typography>
                {request.data.map((key) => (
                    <Checkbox
                        checked={!!checked[key]}
                        onCheck={handleCheck}
                        name={key}
                        disabled={!userDataStore.data[key]}
                        key={key}
                    />
                ))}
            </CardContent>
            <CardActions className={classes.buttonContainer}>
                <Button onClick={handleAuth} variant='contained' color='primary'>授权</Button>
            </CardActions>
        </Card>
    );
});

const AuthSetting: FC<{ request: AuthSettingRequest }> = observer(({ request }) => {
    const navigate = useNavigate();
    const { userDataStore, keyStore } = useStores();
    useUserData();
    const alice = useAlice();
    const classes = useStyles();
    const deltaDataStore = new UserDataStore();
    useEffect(() => {
        Object.entries(request.data).map(([k, v]) => deltaDataStore.set(k, v));
    }, [request]);
    const handleAuth = async () => {
        for (const { key, value } of deltaDataStore.dataArray) {
            await userDataStore.set(key, value);
        }
        const dataKey: TaggedPreKeyPair = {};
        const encrypted: TaggedEncrypted = {};
        const aes = new AES(keyStore.tagKey, keyStore.tagIV, 'AES-CTR');
        for (const { key, tag, value } of userDataStore.dataArray) {
            const encryptedTag = await aes.encrypt(tag, 'hex', 'hex');
            dataKey[tag] = alice.key();
            encrypted[encryptedTag] = await alice.encrypt(JSON.stringify({ key, value }), dataKey[tag].pk);
        }
        await asyncAction(async () => {
            await api.setData(encrypted);
            await keyStore.set(dataKey);
            navigate('/data');
        }, '提交加密数据');
    };

    return (
        <Card className={classes.container}>
            <CardHeader title='授权更新信息' />
            <CardContent>
                <Typography gutterBottom>应用{request.id}想要更新您的以下信息：</Typography>
                <Table title='更新信息' dataStore={deltaDataStore} />
            </CardContent>
            <CardActions className={classes.buttonContainer}>
                <Button onClick={handleAuth} variant='contained' color='primary'>授权</Button>
            </CardActions>
        </Card>
    );
});

export const Auth: FC = observer(() => {
    const { keyStore, notificationStore } = useStores();
    const request = useUrlParams<AuthRequest>('request');

    useEffect(() => {
        if (!request) {
            notificationStore.enqueueWarning('授权请求格式错误');
        }
    }, []);

    if (!keyStore.password) {
        return <Navigate to='/' />;
    }

    switch (request?.type) {
        case 'get':
            return <AuthGetting request={request} />;
        case 'set':
            return <AuthSetting request={request} />;
        default:
            return <></>;
    }
});
