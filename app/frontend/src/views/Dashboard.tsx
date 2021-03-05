import { Avatar, Button, Card, CardActions, CardContent, CardHeader, Divider, Tooltip, Typography } from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppInfo } from '../providers/appInfo';
import { useStyles } from '../styles/dashboard';

interface Data {
    name: string;
    avatar: string;
    bio: string;
    city: string;
    id: string;
}

export const Dashboard: FC = () => {
    const [data, setData] = useState<Data | null>(null);
    const navigate = useNavigate();
    const appInfo = useAppInfo();
    useEffect(() => {
        void (async () => {
            const { data } = await (await fetch(`${import.meta.env.REACT_APP_APP_BACKEND}/data`, { credentials: 'include' })).json();
            if (!data) {
                navigate('/');
            } else {
                setData(data);
            }
        })();
    }, [navigate]);
    const handleClick = () => {
        window.location.href = `${import.meta.env.REACT_APP_GRADAUTH_FRONTEND}/auth/?request=${encodeURIComponent(JSON.stringify({
            type: 'set',
            id: 'YouChat',
            pk: appInfo.pk,
            callback: appInfo.callback,
            redirect: `${import.meta.env.REACT_APP_APP_FRONTEND}/dashboard`,
            data: {
                YouChatID: data?.id,
            },
        }))}`;
    };
    const classes = useStyles();
    return data ? (
        <div className={classes.root}>
            <Card elevation={10}>
                <CardHeader title='Welcome' />
                <Divider variant='middle' />
                <CardContent className={classes.content}>
                    <Avatar className={classes.avatar} src={data.avatar} alt={data.name}>{data.name.split(' ').map((i) => i[0]).join('')}</Avatar>
                    <div className={classes.profile}>
                        <Typography variant='h4'>{data.name}</Typography>
                        <Typography variant='body1' color='textSecondary'>{data.city}</Typography>
                        <Typography variant='body2' color='textSecondary'>{data.bio}</Typography>
                    </div>
                </CardContent>
                <CardActions className={classes.buttonContainer}>
                    <Tooltip title='为您在GraDAuth中设置YouChat ID，以供其它应用获取'>
                        <Button onClick={handleClick} variant='outlined' color='primary'>连携</Button>
                    </Tooltip>
                    <Button variant='contained' color='primary'>完成</Button>
                </CardActions>
            </Card>
        </div>
    ) : null;
};
