import { Typography } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React, { FC } from 'react';

import { useStores } from '../hooks/useStores';
import logo from '../images/logo.png';
import { useStyles } from '../styles/home';

export const Home: FC = observer(() => {
    const { identityStore } = useStores();
    const classes = useStyles();

    if (!identityStore.password) {
        identityStore.setPassword('P@ssw0rd');
        return null; // TODO
    }

    return (
        <div className={classes.container}>
            <img className={classes.logo} src={logo} alt='PreDAuth logo' />
            <div>
                <Typography variant='h2' className={classes.header}>PreDAuth</Typography>
                <Typography variant='h5'>
                    PreDAuth is a decentralized authorization system based on Hyperledger Fabric and Proxy ReEncryption
                </Typography>
            </div>
        </div>
    );
});
