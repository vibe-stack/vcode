// Shell API Context - Renderer Side
import { contextBridge, ipcRenderer } from 'electron';
import {
    SHELL_SHOW_ITEM_IN_FOLDER_CHANNEL,
    SHELL_OPEN_EXTERNAL_CHANNEL
} from './shell-channels';

export const shellApiContext = {
    showItemInFolder: (filePath: string) => ipcRenderer.invoke(SHELL_SHOW_ITEM_IN_FOLDER_CHANNEL, filePath),
    openExternal: (url: string) => ipcRenderer.invoke(SHELL_OPEN_EXTERNAL_CHANNEL, url)
};

export function exposeShellContext() {
    contextBridge.exposeInMainWorld('shellApi', shellApiContext);
}
