import {
  SETTINGS_GET_CHANNEL,
  SETTINGS_SET_CHANNEL,
  SETTINGS_GET_ALL_CHANNEL,
  SETTINGS_RESET_CHANNEL,
  SETTINGS_EXPORT_CHANNEL,
  SETTINGS_IMPORT_CHANNEL,
  SETTINGS_GET_SECURE_CHANNEL,
  SETTINGS_SET_SECURE_CHANNEL,
  SETTINGS_DELETE_SECURE_CHANNEL,
  SETTINGS_LIST_SECURE_KEYS_CHANNEL,
} from "./settings-channels";

export function exposeSettingsContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");

  contextBridge.exposeInMainWorld("settingsApi", {
    // Regular settings
    get: (key: string) => ipcRenderer.invoke(SETTINGS_GET_CHANNEL, key),
    set: (key: string, value: any) => ipcRenderer.invoke(SETTINGS_SET_CHANNEL, key, value),
    getAll: () => ipcRenderer.invoke(SETTINGS_GET_ALL_CHANNEL),
    reset: () => ipcRenderer.invoke(SETTINGS_RESET_CHANNEL),
    export: () => ipcRenderer.invoke(SETTINGS_EXPORT_CHANNEL),
    import: (settingsJson: string) => ipcRenderer.invoke(SETTINGS_IMPORT_CHANNEL, settingsJson),

    // Secure settings (API keys, tokens, etc.)
    getSecure: (key: string) => ipcRenderer.invoke(SETTINGS_GET_SECURE_CHANNEL, key),
    setSecure: (key: string, value: string) => ipcRenderer.invoke(SETTINGS_SET_SECURE_CHANNEL, key, value),
    deleteSecure: (key: string) => ipcRenderer.invoke(SETTINGS_DELETE_SECURE_CHANNEL, key),
    listSecureKeys: () => ipcRenderer.invoke(SETTINGS_LIST_SECURE_KEYS_CHANNEL),
  });
}
