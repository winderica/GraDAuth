/* eslint-disable @typescript-eslint/no-misused-promises */
import { ipcMain } from 'electron';

import { getContract } from './wallet';

ipcMain.on('generators', async (event) => {
    try {
        const contract = await getContract('admin1');
        const result = await contract.evaluateTransaction('getGH');
        event.reply('generators', { ok: true, payload: JSON.parse(result.toString('utf8')) });
    } catch ({ message }) {
        event.reply('generators', { ok: false, payload: message });
    }
});

ipcMain.on('reEncrypt', async (event, id, data, to) => {
    try {
        const contract = await getContract('admin1');
        await contract.evaluateTransaction('reEncrypt', id, JSON.stringify(data), to);
        event.reply('reEncrypt', { ok: true });
    } catch ({ message }) {
        event.reply('reEncrypt', { ok: false, payload: message });
    }
});

ipcMain.on('register', async (event, id, data) => {
    try {
        const contract = await getContract('admin1');
        const result = await contract.submitTransaction('getIdentity', id);
        if (result.length) {
            event.reply('register', { ok: false, payload: { message: '用户已存在' } });
        } else {
            await contract.submitTransaction('setIdentity', id, JSON.stringify(data));
            event.reply('register', { ok: true });
        }
    } catch ({ message }) {
        event.reply('register', { ok: false, payload: message });
    }
});

ipcMain.on('setData', async (event, id, data) => {
    try {
        const contract = await getContract('admin1');
        await contract.submitTransaction('setData', id, JSON.stringify(data));
        event.reply('setData', { ok: true });
    } catch ({ message }) {
        event.reply('setData', { ok: false, payload: message });
    }
});

ipcMain.on('getData', async (event, id) => {
    try {
        const contract = await getContract('admin1');
        const result = await contract.evaluateTransaction('getData', id);
        event.reply('getData', { ok: true, payload: JSON.parse(result.toString('utf8') || '{}') });
    } catch ({ message }) {
        event.reply('getData', { ok: false, payload: message });
    }
});
