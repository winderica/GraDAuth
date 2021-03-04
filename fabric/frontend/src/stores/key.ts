import * as idb from 'idb-keyval';
import { makeAutoObservable } from 'mobx';

import { TaggedPreKeyPair } from '../constants/types';

export class KeyStore {
    dataKey: TaggedPreKeyPair = {};

    constructor() {
        makeAutoObservable(this);
    }

    async load() {
        this.dataKey = await idb.get<TaggedPreKeyPair>('dataKey') || this.dataKey;
    }

    async set(key: TaggedPreKeyPair) {
        this.dataKey = key;
        await idb.set('dataKey', key);
    }
}
