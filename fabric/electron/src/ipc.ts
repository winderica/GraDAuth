import { readFileSync } from 'fs';

import { ipcMain, dialog } from 'electron';
import Store from 'electron-store';
import { Contract, Identity } from 'fabric-network';

import { parseKey, parseSalt } from './utils/deserializers';
import { Poseidon } from './utils/poseidon';
import { getContract } from './utils/wallet';

const poseidon = new Poseidon();
const store = new Store<{
    connection: Record<string, unknown>;
    identity: Identity;
}>();
let contract: Contract;

/* eslint-disable @typescript-eslint/no-misused-promises */
ipcMain.on('init', async (event) => {
    while (!contract) {
        while (!store.get('identity')) {
            try {
                const { filePaths } = await dialog.showOpenDialog({
                    title: 'Select the identity file',
                    filters: [{ name: 'Identity file', extensions: ['id'] }],
                    properties: ['openFile'],
                });
                if (filePaths.length === 1) {
                    store.set('identity', JSON.parse(readFileSync(filePaths[0]).toString()));
                }
            } catch {
            }
        }
        while (!store.get('connection')) {
            try {
                const { filePaths } = await dialog.showOpenDialog({
                    title: 'Select the connection config file',
                    filters: [{ name: 'Connection config file', extensions: ['json'] }],
                    properties: ['openFile'],
                });
                if (filePaths.length === 1) {
                    store.set('connection', JSON.parse(readFileSync(filePaths[0]).toString()));
                }
            } catch {
            }
        }
        try {
            contract = await getContract(store.get('connection'), store.get('identity'));
        } catch {
            store.clear();
        }
    }
    event.reply('init', { ok: true });
});

ipcMain.on('reset', () => {
    store.clear();
});

ipcMain.on('generators', async (event) => {
    try {
        const result = await contract.evaluateTransaction('getGH');
        event.reply('generators', { ok: true, payload: JSON.parse(result.toString()) });
    } catch ({ message }) {
        event.reply('generators', { ok: false, payload: message });
    }
});

ipcMain.on('reEncrypt', async (event, key: string, payload: Record<string, string>, to: string) => {
    try {
        const parsedKey = parseKey(key);
        await contract.evaluateTransaction('reEncrypt', JSON.stringify(
            Object.entries(payload).map(([tag, rk]) => {
                const now = Date.now();
                const salt = parseSalt(tag, now);
                const hash = poseidon.hash(parsedKey, salt);
                return [tag, rk, now, Poseidon.serialize(hash), poseidon.prove(parsedKey, salt, hash)];
            })
        ), to);
        event.reply('reEncrypt', { ok: true });
    } catch ({ message }) {
        event.reply('reEncrypt', { ok: false, payload: message });
    }
});

ipcMain.on('getData', async (event, tags: string[]) => {
    try {
        const result = await contract.evaluateTransaction('getData', JSON.stringify(tags));
        event.reply('getData', { ok: true, payload: JSON.parse(result.toString() || '{}') });
    } catch ({ message }) {
        event.reply('getData', { ok: false, payload: message });
    }
});

ipcMain.on('setData', async (event, key: string, payload: Record<string, unknown>) => {
    try {
        const parsedKey = parseKey(key);
        await contract.submitTransaction('setData', JSON.stringify(
            Object.entries(payload).map(([tag, data]) => {
                const now = Date.now();
                const salt = parseSalt(tag, now);
                const hash = poseidon.hash(parsedKey, salt);
                return [tag, data, now, Poseidon.serialize(hash), poseidon.prove(parsedKey, salt, hash)];
            })
        ));
        event.reply('setData', { ok: true });
    } catch ({ message }) {
        event.reply('setData', { ok: false, payload: message });
    }
});

ipcMain.on('delData', async (event, key: string, tags: string[]) => {
    try {
        const parsedKey = parseKey(key);
        await contract.submitTransaction('delData', JSON.stringify(
            tags.map((tag) => {
                const now = Date.now();
                const salt = parseSalt(tag, now);
                const hash = poseidon.hash(parsedKey, salt);
                return [tag, now, Poseidon.serialize(hash), poseidon.prove(parsedKey, salt, hash)];
            })
        ));
        event.reply('delData', { ok: true });
    } catch ({ message }) {
        event.reply('delData', { ok: false, payload: message });
    }
});
