import { Button, TextField, Typography } from '@material-ui/core';
import { RouteComponentProps } from '@reach/router';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent, FC, useState } from 'react';

import { api } from '../api';
import { Dialog } from '../components/Dialog';
import { useAlice } from '../hooks/useAlice';
import { useStores } from '../hooks/useStores';
import { encrypt } from '../utils/aliceBobWrapper';
import { apiWrapper } from '../utils/apiWrapper';
import { generateKey } from '../utils/ecdsa';

export const Register: FC<RouteComponentProps> = observer(({ navigate }) => {
    const { identityStore, componentStateStore, userDataStore, keyStore } = useStores();
    const [id, setId] = useState('');
    const alice = useAlice();
    const handleInput = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
        setId(value);
    };
    const handleSubmit = () => apiWrapper(async () => {
        const key = await generateKey();
        await api.register(id, key);
        await identityStore.setId(id);
        await identityStore.setKey(key);
        if (!navigate) {
            throw new Error('How could this happen?');
        }
        await navigate('/');
    }, '正在提交', '提交成功');
    return (
        <Dialog
            open={true}
            setOpen={() => undefined}
            title='初始化'
            content={
                <>
                    <Typography>请输入您的id（不可重复），我们将为您分配对应的公私钥</Typography>
                    <TextField
                        autoFocus
                        margin='dense'
                        label='id'
                        value={id}
                        fullWidth
                        onChange={handleInput}
                    />
                </>
            }
            actions={
                <Button color='primary' onClick={handleSubmit}>提交</Button>
            }
        />
    );
});
