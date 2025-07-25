import { contextBridge, ipcRenderer } from 'electron';

export function exposeAutoUpdaterContext() {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Auto-updater methods
    installUpdate: () => ipcRenderer.invoke('install-update'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    dismissUpdateNotification: () => ipcRenderer.invoke('dismiss-update-notification'),

    // Auto-updater event listeners
    onUpdateAvailable: (callback: (info: any) => void) => 
      ipcRenderer.on('update-available', (_, info) => callback(info)),
    
    onUpdateDownloadProgress: (callback: (progress: any) => void) =>
      ipcRenderer.on('update-download-progress', (_, progress) => callback(progress)),
    
    onUpdateDownloaded: (callback: (info: any) => void) =>
      ipcRenderer.on('update-downloaded', (_, info) => callback(info)),

    // Cleanup listeners
    removeAllUpdateListeners: () => {
      ipcRenderer.removeAllListeners('update-available');
      ipcRenderer.removeAllListeners('update-download-progress');
      ipcRenderer.removeAllListeners('update-downloaded');
    }
  });
}
