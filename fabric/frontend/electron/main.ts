import { app, BrowserWindow } from 'electron';

import { addAdmin } from './wallet';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.on('ready', async () => {
    await addAdmin(1);
    await addAdmin(2);
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
        },
    });

    await mainWindow.loadURL('http://localhost:8000');

    mainWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
    app.quit();
});
