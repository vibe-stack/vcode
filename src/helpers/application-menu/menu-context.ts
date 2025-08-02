import { contextBridge, ipcRenderer } from 'electron';
import {
  MENU_NEW_FILE_CHANNEL,
  MENU_NEW_WINDOW_CHANNEL,
  MENU_OPEN_FOLDER_CHANNEL,
  MENU_SAVE_FILE_CHANNEL,
  MENU_SAVE_AS_FILE_CHANNEL,
  MENU_CLOSE_WINDOW_CHANNEL
} from './menu-channels';

export interface ApplicationMenuApi {
  onNewFile: (callback: () => void) => () => void;
  onNewWindow: (callback: () => void) => () => void;
  onOpenFolder: (callback: () => void) => () => void;
  onSaveFile: (callback: () => void) => () => void;
  onSaveAsFile: (callback: () => void) => () => void;
  onCloseWindow: (callback: () => void) => () => void;
}

export function exposeApplicationMenuContext() {
  contextBridge.exposeInMainWorld('applicationMenuApi', {
    onNewFile: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(MENU_NEW_FILE_CHANNEL, listener);
      return () => ipcRenderer.removeListener(MENU_NEW_FILE_CHANNEL, listener);
    },
    onNewWindow: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(MENU_NEW_WINDOW_CHANNEL, listener);
      return () => ipcRenderer.removeListener(MENU_NEW_WINDOW_CHANNEL, listener);
    },
    onOpenFolder: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(MENU_OPEN_FOLDER_CHANNEL, listener);
      return () => ipcRenderer.removeListener(MENU_OPEN_FOLDER_CHANNEL, listener);
    },
    onSaveFile: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(MENU_SAVE_FILE_CHANNEL, listener);
      return () => ipcRenderer.removeListener(MENU_SAVE_FILE_CHANNEL, listener);
    },
    onSaveAsFile: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(MENU_SAVE_AS_FILE_CHANNEL, listener);
      return () => ipcRenderer.removeListener(MENU_SAVE_AS_FILE_CHANNEL, listener);
    },
    onCloseWindow: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(MENU_CLOSE_WINDOW_CHANNEL, listener);
      return () => ipcRenderer.removeListener(MENU_CLOSE_WINDOW_CHANNEL, listener);
    }
  } as ApplicationMenuApi);
}
