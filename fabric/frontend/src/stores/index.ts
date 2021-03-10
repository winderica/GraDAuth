import { ComponentStateStore } from './componentState';
import { KeyStore } from './key';
import { NotificationStore } from './notification';
import { UserDataStore } from './userData';

export const stores = {
    userDataStore: new UserDataStore(),
    keyStore: new KeyStore(),
    notificationStore: new NotificationStore(),
    componentStateStore: new ComponentStateStore(),
};

export { ComponentStateStore, UserDataStore, KeyStore, NotificationStore };
