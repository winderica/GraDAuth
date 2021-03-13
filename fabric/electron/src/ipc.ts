import { readFileSync } from 'fs';

import { ipcMain, dialog } from 'electron';
import Store from 'electron-store';
import { Contract, Identity } from 'fabric-network';

import { parseTag } from './utils/parseTag';
import { poseidonHashJS, serializePoseidon } from './utils/poseidonHashJS';
import { prove } from './utils/prove';
import { getContract } from './utils/wallet';

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
        } catch (e) {
            store.delete('identity');
            store.delete('connection');
            console.log(e);
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

ipcMain.on('reEncrypt', async (event, data: Record<string, unknown>, to: string) => {
    try {
        await contract.evaluateTransaction('reEncrypt', JSON.stringify(
            Object.entries(data).map(([k, v]) => {
                const parsedTag = parseTag(k);
                const hash = poseidonHashJS(parsedTag);
                return [serializePoseidon(hash), v, prove(parsedTag, hash)];
            })
        ), to);
        event.reply('reEncrypt', { ok: true });
    } catch ({ message }) {
        event.reply('reEncrypt', { ok: false, payload: message });
    }
});

ipcMain.on('getData', async (event, tags: string[]) => {
    try {
        const map: Record<string, string> = {};
        const result = await contract.evaluateTransaction('getData', JSON.stringify(
            tags.map((tag) => {
                const hash = serializePoseidon(poseidonHashJS(parseTag(tag)));
                map[hash] = tag;
                return hash;
            })
        ));
        const data = Object.entries(JSON.parse(result.toString() || '{}'));
        event.reply('getData', { ok: true, payload: Object.fromEntries(data.map(([k, v]) => [map[k], v])) });
    } catch ({ message }) {
        event.reply('getData', { ok: false, payload: message });
    }
});

ipcMain.on('setData', async (event, data: Record<string, unknown>) => {
    try {
        await contract.submitTransaction('setData', JSON.stringify(
            Object.entries(data).map(([k, v]) => {
                const parsedTag = parseTag(k);
                const hash = poseidonHashJS(parsedTag);
                return [serializePoseidon(hash), v, prove(parsedTag, hash)];
            })
        ));
        event.reply('setData', { ok: true });
    } catch ({ message }) {
        event.reply('setData', { ok: false, payload: message });
    }
});

ipcMain.on('delData', async (event, tags: string[]) => {
    try {
        await contract.submitTransaction('delData', JSON.stringify(
            tags.map((tag) => {
                const parsedTag = parseTag(tag);
                const hash = poseidonHashJS(parsedTag);
                return [serializePoseidon(hash), prove(parsedTag, hash)];
            })
        ));
        event.reply('delData', { ok: true });
    } catch ({ message }) {
        event.reply('delData', { ok: false, payload: message });
    }
});
