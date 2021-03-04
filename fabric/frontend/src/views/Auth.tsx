import { Button, Card, CardActions, CardContent, CardHeader, Typography } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { api } from '../api';
import { Checkbox } from '../components/Checkbox';
import { Table } from '../components/Table';
import { Timer } from '../components/Timer';
import { Checked } from '../constants/types';
import { useAlice } from '../hooks/useAlice';
import { useStores } from '../hooks/useStores';
import { useUrlParams } from '../hooks/useUrlParams';
import { useUserData } from '../hooks/useUserData';
import { UserDataStore } from '../stores';
import { useStyles } from '../styles/auth';
import { encrypt } from '../utils/aliceWrapper';
import { apiWrapper } from '../utils/apiWrapper';

interface AuthGettingRequest {
    type: 'get';
    id: string;
    pk: string;
    callback: string;
    redirect: string;
    data: string[];
}

interface AuthSettingRequest {
    type: 'set';
    id: string;
    pk: string;
    callback: string;
    redirect: string;
    data: Record<string, string>;
}

type AuthRequest = AuthGettingRequest | AuthSettingRequest;

const AuthGetting: FC<{ request: AuthGettingRequest }> = observer(({ request }) => {
    const { identityStore, keyStore, userDataStore, notificationStore } = useStores();
    useUserData();
    const alice = useAlice();
    const classes = useStyles();
    const [checked, setChecked] = useState<Checked>({});
    const handleAuth = async () => {
        const data = Object.fromEntries(
            Object.entries(userDataStore.dataGroupedByTag)
                .filter(([, data]) => Object.keys(data).filter((key) => checked[key]).length)
                .map(([tag]) => [tag, alice.reKey(request.pk, keyStore.dataKey[tag].sk)])
        );
        await apiWrapper(
            async () => {
                await api.reEncrypt(data, identityStore.password, request.callback);
                notificationStore.enqueueInfo(<>
                    页面将在<Timer time={5} key={Date.now()} onTimeout={() => location.href = request.redirect} />秒后跳转
                </>);
            }, '正在提交重加密密钥', '成功提交重加密密钥'
        );
    };

    const handleCheck = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setChecked((prevChecked) => ({ ...prevChecked, [name]: checked }));
    };
    return (
        <Card className={classes.container}>
            <CardHeader title='授权获取信息' />
            <CardContent>
                <Typography>为应用生成重加密密钥，将您保存在PreDAuth上的数据安全地发送给应用。</Typography>
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
                <Typography>数据对应的标签将自动勾选</Typography>
                {Object.entries(userDataStore.dataGroupedByTag).map(([tag, data]) => (
                    <Checkbox checked={!!Object.keys(data).filter((key) => checked[key]).length} name={tag} key={tag} />
                ))}
            </CardContent>
            <CardActions className={classes.buttonContainer}>
                <Button onClick={handleAuth} variant='contained' color='primary'>授权</Button>
            </CardActions>
        </Card>
    );
});

const AuthSetting: FC<{ request: AuthSettingRequest }> = observer(({ request }) => {
    const { userDataStore, identityStore, keyStore, notificationStore } = useStores();
    useUserData();
    const alice = useAlice();
    const classes = useStyles();
    const deltaDataStore = new UserDataStore(
        Object.fromEntries(Object.entries(request.data).map(([k, v]) => [k, { value: v, tag: '' }]))
    );
    const handleAuth = async () => {
        deltaDataStore.dataArray.forEach(({ key, value, tag }) => userDataStore.set(key, value, tag));
        const { dataKey, encrypted } = await encrypt(alice, userDataStore.dataArrayGroupedByTag);
        await apiWrapper(async () => {
            await api.setData(encrypted, identityStore.password);
            await keyStore.set(dataKey);
            notificationStore.enqueueInfo(<>
                页面将在<Timer time={5} key={Date.now()} onTimeout={() => location.href = request.redirect} />秒后跳转
            </>);
        }, '正在提交加密数据', '成功加密并提交');
    };

    return (
        <Card className={classes.container}>
            <CardHeader title='授权更新信息' />
            <CardContent>
                <Typography gutterBottom>应用{request.id}想要更新您的以下信息，请为各项数据分配对应的标签：</Typography>
                <Table title='更新信息' dataStore={deltaDataStore} />
            </CardContent>
            <CardActions className={classes.buttonContainer}>
                <Button onClick={handleAuth} variant='contained' color='primary'>授权</Button>
            </CardActions>
        </Card>
    );
});

export const Auth: FC = observer(() => {
    const { identityStore, notificationStore } = useStores();
    const request = useUrlParams<AuthRequest>('request');

    useEffect(() => {
        if (!request) {
            notificationStore.enqueueWarning('授权请求格式错误');
        }
    }, []);

    if (!identityStore.password) {
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
