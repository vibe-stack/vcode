import { contextBridge, ipcRenderer } from 'electron';

export const FILE_DIALOG_SAVE_AS_CHANNEL = 'file-dialog:save-as';

export interface SaveAsDialogOptions {
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

export interface SaveAsDialogResult {
  canceled: boolean;
  filePath?: string;
}

export interface FileDialogApi {
  showSaveAsDialog: (options?: SaveAsDialogOptions) => Promise<SaveAsDialogResult>;
}

export function exposeFileDialogContext() {
  contextBridge.exposeInMainWorld('fileDialogApi', {
    showSaveAsDialog: (options?: SaveAsDialogOptions): Promise<SaveAsDialogResult> =>
      ipcRenderer.invoke(FILE_DIALOG_SAVE_AS_CHANNEL, options),
  } as FileDialogApi);
}
