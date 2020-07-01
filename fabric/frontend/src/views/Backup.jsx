import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Card, CardActions, CardContent, CardHeader, Checkbox, FormControlLabel, TextField, Typography } from '@material-ui/core';
import { Redirect } from '@reach/router';

import { useStores } from '../hooks/useStores';
import { useUserData } from '../hooks/useUserData';

export const Backup = observer(() => {
    const { identityStore, userDataStore } = useStores();
    if (!identityStore.id) {
        return <Redirect to='/' noThrow />;
    }
    useUserData();
    const [checked, setChecked] = useState({});

    const handleCheck = (event) => {
        const { name, checked } = event.target;
        setChecked((prevChecked) => ({ ...prevChecked, [name]: checked }));
    };
    return (
        <Card>
            <CardHeader title='备份数据' />
            <CardContent>
                <Typography>您可以输入恢复手段（邮箱或手机号），并指定允许PreDAuth获取的数据，为PreDAuth生成重加密密钥，以便于私钥丢失后仍能找回相应数据。</Typography>
                <Typography>对于敏感数据，您可以选择不信任PreDAuth，而是选择自己记忆，并承担私钥丢失的后果。</Typography>
                <TextField
                    autoFocus
                    margin='dense'
                    label='恢复手段'
                    fullWidth
                />
                {Object.keys(userDataStore.dataGroupedByTag).map((tag) => <FormControlLabel
                    control={<Checkbox checked={!!checked[tag]} onChange={handleCheck} name={tag} />}
                    label={tag}
                    key={tag}
                />)}
            </CardContent>
            <CardActions>
                <Button variant='contained' color='primary'>备份</Button>
            </CardActions>
        </Card>
    );
});
