import { Button, Card, CardContent, Paper, TextField, Typography } from '@material-ui/core';
import React, { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import YouChat from '../assets/YouChat.png';
import { useAppInfo } from '../providers/appInfo';
import { useStyles } from '../styles/signup';

export const Signup: FC = () => {
    const navigate = useNavigate();
    const classes = useStyles();
    const appInfo = useAppInfo();
    useEffect(() => {
        void (async () => {
            const { loggedIn } = await (await fetch(`${import.meta.env.SNOWPACK_PUBLIC_APP_BACKEND}/status`, {
                credentials: 'include',
            })).json();
            if (loggedIn) {
                navigate('/dashboard');
            }
        })();
    }, [navigate]);
    return (
        <div className={classes.root}>
            <Paper className={classes.container} elevation={10}>
                <div className={classes.header}>
                    <img src={YouChat} alt='' className={classes.logo} />
                    <Typography variant='h2'>YouChat</Typography>
                    <Typography variant='h5'>不只是一种生活方式</Typography>
                </div>
                <Card className={classes.card} elevation={5}>
                    <CardContent className={classes.content}>
                        <TextField variant='outlined' label='邮箱' fullWidth />
                        <TextField variant='outlined' label='用户名' fullWidth />
                        <TextField variant='outlined' label='密码' type='password' fullWidth />
                        <Button fullWidth variant='contained' color='primary' size='large'>注册</Button>
                        <Button fullWidth variant='outlined' color='primary' size='large' href={
                            `gradauth:${encodeURIComponent(JSON.stringify({
                                type: 'get',
                                id: 'YouChat',
                                pk: appInfo.pk,
                                callback: appInfo.callback,
                                redirect: `${import.meta.env.SNOWPACK_PUBLIC_APP_FRONTEND}/dashboard`,
                                data: appInfo.data,
                            }))}`
                        }>
                            使用GraDAuth登录
                        </Button>
                        <Typography variant='caption' color='textSecondary'>* 注册即代表您同意我们的服务条款与隐私政策</Typography>
                    </CardContent>
                </Card>
            </Paper>
        </div>
    );
};
