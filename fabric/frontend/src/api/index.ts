const { ipcRenderer } = window.require('electron');

import { Generators, TaggedEncrypted, TaggedReKey } from '../constants/types';

ipcRenderer.on<[string]>('auth', (_, data) => {
    const { pathname } = new URL(data);
    location.hash = `#/auth/?request=${pathname}`;
    location.reload();
});

class API {
    init() {
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.once('init', (_, { ok, payload }) => {
                ok ? resolve() : reject(new Error(payload));
            });
            ipcRenderer.send('init');
        });
    }

    getGenerators() {
        return new Promise<Generators>((resolve, reject) => {
            ipcRenderer.once('generators', (_, { ok, payload }) => {
                ok ? resolve(payload) : reject(new Error(payload));
            });
            ipcRenderer.send('generators');
        });
    }

    getData(tags: string[], password: string) {
        return new Promise<TaggedEncrypted>((resolve, reject) => {
            ipcRenderer.once('getData', (_, { ok, payload }) => {
                ok ? resolve(payload) : reject(new Error(payload));
            });
            ipcRenderer.send('getData', tags, password);
        });
    }

    setData(data: TaggedEncrypted, password: string) {
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.once('setData', (_, { ok, payload }) => {
                ok ? resolve() : reject(new Error(payload));
            });
            ipcRenderer.send('setData', data, password);
        });
    }

    delData(tags: string[], password: string) {
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.once('delData', (_, { ok, payload }) => {
                ok ? resolve() : reject(new Error(payload));
            });
            ipcRenderer.send('delData', tags, password);
        });
    }

    reEncrypt(data: TaggedReKey, password: string, to: string) {
        return new Promise<void>((resolve, reject) => {
            ipcRenderer.once('reEncrypt', (_, { ok, payload }) => {
                ok ? resolve() : reject(new Error(payload));
            });
            ipcRenderer.send('reEncrypt', data, password, to);
        });
    }
}

export const api = new API();
