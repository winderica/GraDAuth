import { ipcMain } from 'electron';

import { hashTag } from './utils/hashTag';
import { poseidonHashJS, serializePoseidon } from './utils/poseidonHashJS';
import { prove } from './utils/prove';
import { getContract } from './utils/wallet';

/* eslint-disable @typescript-eslint/no-misused-promises */
ipcMain.on('generators', async (event) => {
    try {
        const contract = await getContract('user');
        const result = await contract.evaluateTransaction('getGH');
        event.reply('generators', { ok: true, payload: JSON.parse(result.toString('utf8')) });
    } catch ({ message }) {
        event.reply('generators', { ok: false, payload: message });
    }
});

ipcMain.on('reEncrypt', async (event, data: Record<string, unknown>, password: string, to: string) => {
    try {
        const contract = await getContract('user');
        await contract.evaluateTransaction('reEncrypt', JSON.stringify(
            Object.entries(data).map(([k, v]) => {
                const intermediateHash = hashTag(k, password);
                const hash = poseidonHashJS(intermediateHash);
                return [serializePoseidon(hash), v, prove(intermediateHash, hash)];
            })
        ), to);
        event.reply('reEncrypt', { ok: true });
    } catch ({ message }) {
        event.reply('reEncrypt', { ok: false, payload: message });
    }
});

ipcMain.on('getData', async (event, tags: string[], password: string) => {
    try {
        const contract = await getContract('user');
        const map: Record<string, string> = {};
        const result = await contract.evaluateTransaction('getData', JSON.stringify(
            tags.map((tag) => {
                const hash = serializePoseidon(poseidonHashJS(hashTag(tag, password)));
                map[hash] = tag;
                return hash;
            })
        ));
        const data = Object.entries(JSON.parse(result.toString('utf8') || '{}'));
        event.reply('getData', { ok: true, payload: Object.fromEntries(data.map(([k, v]) => [map[k], v])) });
    } catch ({ message }) {
        event.reply('getData', { ok: false, payload: message });
    }
});

ipcMain.on('setData', async (event, data: Record<string, unknown>, password: string) => {
    try {
        const contract = await getContract('user');
        await contract.submitTransaction('setData', JSON.stringify(
            Object.entries(data).map(([k, v]) => {
                const intermediateHash = hashTag(k, password);
                const hash = poseidonHashJS(intermediateHash);
                return [serializePoseidon(hash), v, prove(intermediateHash, hash)];
            })
        ));
        event.reply('setData', { ok: true });
    } catch ({ message }) {
        event.reply('setData', { ok: false, payload: message });
    }
});

ipcMain.on('delData', async (event, tags: string[], password: string) => {
    try {
        const contract = await getContract('user');
        await contract.submitTransaction('delData', JSON.stringify(
            tags.map((tag) => {
                const intermediateHash = hashTag(tag, password);
                const hash = poseidonHashJS(intermediateHash);
                return [serializePoseidon(hash), prove(intermediateHash, hash)];
            })
        ));
        event.reply('delData', { ok: true });
    } catch ({ message }) {
        event.reply('delData', { ok: false, payload: message });
    }
});
