import { BugReport, Fingerprint, Home, List } from '@material-ui/icons';
import { observer } from 'mobx-react-lite';
import React, { FC, useEffect, useState } from 'react';

import { useStores } from '../hooks/useStores';
import { useStyles } from '../styles/frame';

import { AppBar } from './AppBar';
import { Menu } from './Menu';
import { Notifier } from './Notifier';
import { Progress } from './Progress';

const listItems = [
    { to: '/', text: 'home', icon: <Home /> },
    { to: '/data', text: 'data', icon: <List /> },
    { to: '/auth', text: 'auth', icon: <Fingerprint /> },
    { to: '/debug', text: 'debug', icon: <BugReport /> },
];

export const Frame: FC = observer(({ children }) => {
    const classes = useStyles();
    const { keyStore, componentStateStore } = useStores();
    const [open, setOpen] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const handleClick = () => {
        open && setOpen(false);
    };

    const toggleOpen = () => {
        setOpen((open) => !open);
    };

    useEffect(() => {
        void (async () => {
            await keyStore.load();
            setInitialized(true);
        })();
    }, []);
    return initialized ? (
        <div className={classes.root}>
            <AppBar open={open} toggleOpen={toggleOpen} />
            <Menu items={listItems} open={open} toggleOpen={toggleOpen} />
            <main className={classes.content} onClick={handleClick}>
                {children}
            </main>
            {componentStateStore.progressOn && <Progress />}
            <Notifier />
        </div>
    ) : null;
});
