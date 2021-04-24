import { makeAutoObservable } from 'mobx';

import { UserData } from '../constants/types';
import { sha256 } from '../utils/sha256';

export class UserDataStore {
    id!: string;

    data: UserData;

    constructor(data: UserData = {}) {
        this.data = data;
        makeAutoObservable(this);
    }

    setAll(data: UserData) {
        this.data = data;
    }

    async set(key: string, value: string) {
        this.data[key] = { value, tag: await sha256(`${key}.${value}`) };
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
