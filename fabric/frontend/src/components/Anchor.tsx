import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import { useStyles } from '../styles/anchor';

interface Props {
    to: string;
}

export const Anchor: FC<Props> = ({ to, children }) => {
    const classes = useStyles();
    return <Link to={to} className={classes.link}>{children}</Link>;
};
