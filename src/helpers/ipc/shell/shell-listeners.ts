// Shell operation listeners
import { ipcMain, shell } from 'electron';
import {
    SHELL_SHOW_ITEM_IN_FOLDER_CHANNEL,
    SHELL_OPEN_EXTERNAL_CHANNEL
} from './shell-channels';

export default function registerShellListeners() {
    ipcMain.handle(SHELL_SHOW_ITEM_IN_FOLDER_CHANNEL, async (event, filePath: string) => {
        try {
            return shell.showItemInFolder(filePath);
        } catch (error) {
            console.error('Failed to show item in folder:', error);
            throw error;
        }
    });

    ipcMain.handle(SHELL_OPEN_EXTERNAL_CHANNEL, async (event, url: string) => {
        try {
            return await shell.openExternal(url);
        } catch (error) {
            console.error('Failed to open external URL:', error);
            throw error;
        }
    });
}
