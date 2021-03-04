import { AppBar as Bar, IconButton, Toolbar, Typography } from '@material-ui/core';
import { Menu } from '@material-ui/icons';
import React, { FC } from 'react';
import { useLocation } from 'react-router-dom';

import { useStyles } from '../styles/appBar';

interface Props {
    open: boolean;
    toggleOpen: () => void;
}

export const AppBar: FC<Props> = ({ open, toggleOpen }) => {
    const classes = useStyles({ open });
    const { pathname } = useLocation();
    return (
        <Bar position='fixed' className={classes.appBar}>
            <Toolbar disableGutters={!open} classes={{ gutters: classes.appBarGutters, regular: classes.regular }}>
                <IconButton
                    color='inherit'
                    onClick={toggleOpen}
                    className={classes.menuButton}
                >
                    <Menu />
                </IconButton>
                <Typography variant='h6' color='inherit' noWrap>{pathname}</Typography>
            </Toolbar>
        </Bar>
    );
};
