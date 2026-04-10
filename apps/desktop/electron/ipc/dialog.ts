import { ipcMain, dialog, BrowserWindow } from 'electron';

export const setupDialogIPC = () => {
    ipcMain.handle('dialog:openDirectory', async (event, title?: string) => {
        const webContents = event.sender;
        const window = BrowserWindow.fromWebContents(webContents);
        
        if (!window) return null;

        const result = await dialog.showOpenDialog(window, {
            title: title || 'Select Folder',
            properties: ['openDirectory', 'createDirectory'],
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });
};
