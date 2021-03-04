import { Button, Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { ChevronLeft } from '@material-ui/icons';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import { useStyles } from '../styles/menu';

interface Props {
    open: boolean;
    toggleOpen: () => void;
    items: {
        to: string;
        text: string;
        icon: JSX.Element;
    }[];
}

export const Menu: FC<Props> = ({ open, toggleOpen, items }) => {
    const classes = useStyles({ open });

    return (
        <Drawer
            variant='permanent'
            classes={{ paper: classes.drawerPaper }}
            open={open}
        >
            <div className={classes.toolbar}>
                <IconButton onClick={toggleOpen}>
                    <ChevronLeft />
                </IconButton>
            </div>
            <Divider />
            <List>
                {items.map(({ to, text, icon }, index) => (
                    <Button component={Link} to={to} key={index}>
                        <ListItem button onClick={open ? toggleOpen : undefined}>
                            <ListItemIcon className={classes.icon}>
                                {icon}
                            </ListItemIcon>
                            <ListItemText primary={text} />
                        </ListItem>
                    </Button>
                ))}
            </List>
        </Drawer>
    );
};
