import { ipcMain, dialog, BrowserWindow } from 'electron';
import { FILE_DIALOG_SAVE_AS_CHANNEL, SaveAsDialogOptions, SaveAsDialogResult } from './file-dialog-context';

export function addFileDialogListeners() {
  ipcMain.handle(FILE_DIALOG_SAVE_AS_CHANNEL, async (event, options?: SaveAsDialogOptions): Promise<SaveAsDialogResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { canceled: true };
    }

    const result = await dialog.showSaveDialog(window, {
      defaultPath: options?.defaultPath,
      filters: options?.filters || [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h'] }
      ],
      properties: ['createDirectory']
    });

    return {
      canceled: result.canceled,
      filePath: result.canceled ? undefined : result.filePath
    };
  });
}
