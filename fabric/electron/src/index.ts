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

    app.on('ready', () => {
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
        if (app.isPackaged) {
            void mainWindow.loadFile('renderer/index.html');
        } else {
            void mainWindow.loadURL('http://localhost:8000');
            mainWindow.webContents.openDevTools();
        }
    });

    app.on('window-all-closed', () => {
        app.quit();
    });
}
