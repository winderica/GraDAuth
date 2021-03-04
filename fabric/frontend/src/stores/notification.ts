import { makeAutoObservable } from 'mobx';
import { OptionsObject, SnackbarKey, SnackbarMessage, VariantType } from 'notistack';

interface Snackbar {
    key: SnackbarKey;
    message: SnackbarMessage;
    options: OptionsObject;
}

export class NotificationStore {
    notifications: Snackbar[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    enqueueSnackbar({ message, options }: Omit<Snackbar, 'key'>) {
        this.notifications.push({
            key: Date.now(),
            message,
            options
        });
    }

    enqueue(message: SnackbarMessage, variant: VariantType) {
        this.enqueueSnackbar({
            message,
            options: {
                variant,
            },
        });
    }

    enqueueError(message: SnackbarMessage) {
        this.enqueue(message, 'error');
    }

    enqueueWarning(message: SnackbarMessage) {
        this.enqueue(message, 'warning');
    }

    enqueueInfo(message: SnackbarMessage) {
        this.enqueue(message, 'info');
    }

    enqueueSuccess(message: SnackbarMessage) {
        this.enqueue(message, 'success');
    }

    removeSnackbar(key: SnackbarKey) {
        this.notifications = this.notifications.filter(notification => notification.key !== key);
    }
}
