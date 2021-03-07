/* eslint-disable @typescript-eslint/no-misused-promises */
import { app, shell, BrowserWindow } from 'electron';

import './ipc';

app.setAsDefaultProtocolClient('gradauth');

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    let mainWindow: BrowserWindow;
    app.on('second-instance', (_, argv) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
            for (const i of argv) {
                if (i.startsWith('gradauth:')) {
                    mainWindow.webContents.send('auth', i);
                    break;
                }
            }
        }
    });

    app.on('ready', async () => {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 720,
            webPreferences: {
                nodeIntegration: true,
                nodeIntegrationInWorker: true,
                contextIsolation: false,
            },
        });
        mainWindow.webContents.on('new-window', (event, url) => {
            event.preventDefault();
            void shell.openExternal(url);
        });
        // mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        //     if (url.startsWith('http://') || url.startsWith('https://')) {
        //         void shell.openExternal(url);
        //     }
        //     return { action: 'deny' };
        // });
        try {
            await mainWindow.loadFile('./index.html');
        } catch {
            await mainWindow.loadURL('http://localhost:8000');
        }
        mainWindow.webContents.openDevTools();
    });

    app.on('window-all-closed', () => {
        app.quit();
    });
}
