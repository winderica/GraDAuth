import * as idb from 'idb-keyval';
import { makeAutoObservable } from 'mobx';

import { TaggedPreKeyPair } from '../constants/types';
import { deriveKeyFromPassword } from '../utils/pbkdf2';

export class KeyStore {
    dataKey: TaggedPreKeyPair = {};

    tagHMACKey = {} as CryptoKey;

    tagKey = '';

    tagSalt = crypto.getRandomValues(new Uint8Array(16));

    password = sessionStorage.getItem('password') || '';

    constructor() {
        makeAutoObservable(this);
    }

    async load() {
        const tagSalt = await idb.get<Uint8Array>('salt');
        if (tagSalt) {
            this.tagSalt = tagSalt;
        } else {
            await idb.set('salt', this.tagSalt);
        }
        const { hmac, raw } = await deriveKeyFromPassword(this.password, this.tagSalt);
        this.tagHMACKey = hmac;
        this.tagKey = raw;
        this.dataKey = await idb.get<TaggedPreKeyPair>('dataKey') ?? this.dataKey;
    }

    async set(key: TaggedPreKeyPair) {
        this.dataKey = key;
        await idb.set('dataKey', key);
    }

    async setPassword(password: string) {
        this.password = password;
        const { hmac, raw } = await deriveKeyFromPassword(this.password, this.tagSalt);
        this.tagHMACKey = hmac;
        this.tagKey = raw;
        sessionStorage.setItem('password', password);
    }
}
