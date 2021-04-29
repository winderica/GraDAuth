import { makeAutoObservable, runInAction } from 'mobx';

import { UserData } from '../constants/types';
import { fromUint8Array } from '../utils/codec';
import { sha256 } from '../utils/sha256';

export class UserDataStore {
    data: UserData;

    constructor(data: UserData = {}) {
        this.data = data;
        makeAutoObservable(this);
    }

    setAll(data: UserData) {
        this.data = data;
    }

    async set(key: string, value: string, tag?: string) {
        if (!tag) {
            tag = await sha256(`${key}.${value}.${fromUint8Array(crypto.getRandomValues(new Uint8Array(64)), 'hex')}`);
        }
        const data = {
            value,
            tag,
        };
        runInAction(() => {
            this.data[key] = data;
        });
    }

    del(name: string) {
        delete this.data[name];
    }

    get dataArray() {
        return Object.entries(this.data).map(([key, { value, tag }]) => ({ key, value, tag }));
    }

    get tags() {
        return new Set(Object.values(this.data).map(({ tag }) => tag));
    }
}
