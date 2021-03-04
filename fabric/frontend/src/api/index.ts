import 'electron';
const { ipcRenderer } = window.require('electron');

import { Generators, TaggedEncrypted, TaggedReKey } from '../constants/types';
import { exportPublicKey, sign } from '../utils/ecdsa';
import { random } from '../utils/random';

class API {
    getGenerators() {
        return new Promise<Generators>((resolve, reject) => {
            ipcRenderer.once('generators', (_, { ok, payload }) => {
                ok ? resolve(payload) : reject(new Error(payload));
            });
            ipcRenderer.send('generators');
        });
    }

    getData(id: string) {
        return new Promise<TaggedEncrypted>((resolve, reject) => {
            ipcRenderer.once('getData', (_, { ok, payload }) => {
                ok ? resolve(payload) : reject(new Error(payload));
            });
            ipcRenderer.send('getData', id);
        });
    }

    async setData(id: string, key: CryptoKeyPair, payload: TaggedEncrypted) {
        const nonce = random(32);
        const signature = await sign(nonce, key);
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.once('setData', (_, { ok, payload }) => {
                ok ? resolve() : reject(new Error(payload));
            });
            ipcRenderer.send('setData', id, {
                nonce,
                signature,
                payload
            });
        });
    }

    async reEncrypt(id: string, key: CryptoKeyPair, callback: string, payload: TaggedReKey) {
        const nonce = random(32);
        const signature = await sign(nonce, key);
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.once('reEncrypt', (_, { ok, payload }) => {
                ok ? resolve() : reject(new Error(payload));
            });
            ipcRenderer.send('reEncrypt', id, {
                nonce,
                signature,
                payload
            }, callback);
        });
    }

    async register(id: string, key: CryptoKeyPair) {
        const nonce = random(32);
        const signature = await sign(nonce, key);
        const publicKey = await exportPublicKey(key);
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.once('register', (_, { ok, payload }) => {
                ok ? resolve() : reject(new Error(payload));
            });
            ipcRenderer.send('register', id, {
                nonce,
                signature,
                payload: {
                    publicKey
                }
            });
        });
    }
}

export const api = new API();
