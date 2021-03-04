import * as idb from 'idb-keyval';
import { makeAutoObservable } from 'mobx';

export class IdentityStore {
    id = '';

    key = {} as CryptoKeyPair;

    constructor() {
        makeAutoObservable(this);
    }

    async load() {
        this.id = await idb.get('id') || this.id;
        this.key = await idb.get('key') || this.key;
    }

    async setId(id: string) {
        this.id = id;
        await idb.set('id', id);
    }

    async setKey(key: CryptoKeyPair) {
        this.key = key;
        await idb.set('key', key);
    }
}
