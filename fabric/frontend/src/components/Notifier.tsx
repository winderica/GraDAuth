import { autorun } from 'mobx';
import { SnackbarKey, useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { useStores } from '../hooks/useStores';

export const Notifier = () => {
    const [displayed, setDisplayed] = useState<SnackbarKey[]>([]);
    const { notificationStore } = useStores();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    useEffect(() => {
        autorun(() => {
            Object.entries(notificationStore.snackbars).forEach(([key, { options, message }]) => {
                if (displayed.includes(key)) {
                    return;
                }
                enqueueSnackbar(message, options);
                setDisplayed((prevDisplayed) => [...prevDisplayed, key]);
                notificationStore.removeSnackbar(key);
                closeSnackbar(key);
            });
        });
    }, []);
    return null;
};
