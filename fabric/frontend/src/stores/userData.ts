import { makeAutoObservable } from 'mobx';

import { TaggedUserData, UserData } from '../constants/types';

export class UserDataStore {
    data: UserData;

    initialized: boolean;

    constructor(data: UserData = {}) {
        makeAutoObservable(this);
        this.data = data;
        this.initialized = false;
    }

    setAll(data: UserData) {
        this.data = data;
    }

    set(key: string, value: string, tag: string) {
        this.data[key] = { value, tag };
    }

    del(name: string) {
        delete this.data[name];
    }

    setInitialized(initialized = true) {
        this.initialized = initialized;
    }

    get dataArray() {
        return Object.entries(this.data).map(([key, { value, tag }]) => ({ key, value, tag }));
    }

    get dataGroupedByTag() {
        const res: TaggedUserData = {};
        Object.entries(this.data).forEach(([key, { value, tag }]) => res[tag] ? res[tag][key] = value : res[tag] = { [key]: value });
        return res;
    }

    get dataArrayGroupedByTag() {
        return Object.entries(this.dataGroupedByTag);
    }

    get tags() {
        return [...new Set(Object.values(this.data).map(({ tag }) => tag))];
    }
}
