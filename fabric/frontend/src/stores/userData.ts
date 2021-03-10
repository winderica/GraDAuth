import * as idb from 'idb-keyval';
import { makeAutoObservable } from 'mobx';

import { UserData } from '../constants/types';
import { randomId } from '../utils/randomId';
import { sha256 } from '../utils/sha256';

export class UserDataStore {
    id!: string;

    data: UserData;

    password = sessionStorage.getItem('password') || '';

    constructor(data: UserData = {}) {
        this.data = data;
        makeAutoObservable(this);
    }

    async load() {
        const id = await idb.get<string>('id');
        if (id) {
            this.id = id;
        } else {
            this.id = randomId(256);
            await idb.set('id', this.id);
        }
    }

    setAll(data: UserData) {
        this.data = data;
    }

    async set(key: string, value: string) {
        this.data[key] = {
            value,
            tag: await sha256(`${this.id}.${this.password}.${JSON.stringify({ key, value })}`),
        };
    }

    del(name: string) {
        delete this.data[name];
    }

    setPassword(password: string) {
        this.password = password;
        sessionStorage.setItem('password', password);
    }

    get dataArray() {
        return Object.entries(this.data).map(([key, { value, tag }]) => ({ key, value, tag }));
    }

    get tags() {
        return new Set(Object.values(this.data).map(({ tag }) => tag));
    }
}
