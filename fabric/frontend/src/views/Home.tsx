import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Typography,
} from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React, { ChangeEventHandler, FC, useState } from 'react';

import { useStores } from '../hooks/useStores';
import logo from '../images/logo.png';
import { useStyles } from '../styles/home';

export const Home: FC = observer(() => {
    const { identityStore } = useStores();
    const classes = useStyles();
    const [password, setPassword] = useState('');
    const handleClick = () => {
        identityStore.setPassword(password);
    };
    const handleInput: ChangeEventHandler<HTMLInputElement> = (event) => {
        setPassword(event.target.value);
    };

    return (
        <div className={classes.container}>
            <Dialog open={!identityStore.password}>
                <DialogTitle>Input Password</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please input your password:
                    </DialogContentText>
                    <TextField label='Password' type='password' fullWidth onChange={handleInput} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClick} disabled={!password}>OK</Button>
                </DialogActions>
            </Dialog>
            <img className={classes.logo} src={`.${logo}`} alt='GradAuth logo' />
            <div>
                <Typography variant='h2' className={classes.header}>GradAuth</Typography>
                <Typography variant='h5'>
                    GradAuth Reinforces Anonymity in Decentralized Authorization
                </Typography>
            </div>
        </div>
    );
});
