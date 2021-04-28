import { makeAutoObservable } from 'mobx';
import { OptionsObject, SnackbarKey, SnackbarMessage, VariantType } from 'notistack';

interface Snackbar {
    message: SnackbarMessage;
    options: OptionsObject;
}

export class NotificationStore {
    snackbars: Record<SnackbarKey, Snackbar> = {};

    constructor() {
        makeAutoObservable(this);
    }

    enqueue(message: SnackbarMessage, variant: VariantType) {
        this.snackbars[performance.now()] = {
            message,
            options: {
                variant,
            },
        };
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
        delete this.snackbars[key];
    }
}
