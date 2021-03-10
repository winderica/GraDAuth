import { stores } from '../stores';

export const asyncAction = async (action: () => Promise<void>, name: string) => {
    const { notificationStore, componentStateStore } = stores;
    try {
        notificationStore.enqueueInfo(`正在${name}`);
        componentStateStore.setProgress(true);
        await action();
        notificationStore.enqueueSuccess(`成功${name}`);
    } catch ({ message }) {
        notificationStore.enqueueError(message);
    } finally {
        componentStateStore.setProgress(false);
    }
};
