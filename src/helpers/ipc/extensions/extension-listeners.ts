import { ipcMain, dialog, BrowserWindow } from "electron";

export function addExtensionEventListeners(mainWindow: BrowserWindow) {
  console.log("🔌 Adding extension event listeners...");

  // Dialog handler for file selection
  ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, options);
      return result;
    } catch (error) {
      console.error('Failed to show open dialog:', error);
      return { canceled: true, filePaths: [] };
    }
  });

  console.log("✅ Extension event listeners added");
}