import { ipcMain, BrowserWindow } from 'electron';
import { typescriptLSPService } from './typescript-lsp-service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function addTypescriptLSPEventListeners(mainWindow: BrowserWindow) {
  // Initialize TypeScript LSP for a project
  ipcMain.handle('typescript-lsp:initialize', async (event, projectPath: string) => {
    try {
      console.log('IPC: Initializing TypeScript LSP for project:', projectPath);
      await typescriptLSPService.initialize(projectPath);
      console.log('IPC: TypeScript LSP initialized successfully');
      return { success: true };
    } catch (error: unknown) {
      console.error('IPC: Failed to initialize TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // Document lifecycle events
  ipcMain.handle('typescript-lsp:didOpen', async (event, params: {
    uri: string;
    languageId: string;
    version: number;
    text: string;
  }) => {
    try {
      await typescriptLSPService.didOpenTextDocument(
        params.uri,
        params.languageId,
        params.version,
        params.text
      );
      return { success: true };
    } catch (error: unknown) {
      console.error('Failed to send didOpen to TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('typescript-lsp:didChange', async (event, params: {
    uri: string;
    version: number;
    changes: any[];
  }) => {
    try {
      await typescriptLSPService.didChangeTextDocument(
        params.uri,
        params.version,
        params.changes
      );
      return { success: true };
    } catch (error: unknown) {
      console.error('Failed to send didChange to TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('typescript-lsp:didClose', async (event, uri: string) => {
    try {
      await typescriptLSPService.didCloseTextDocument(uri);
      return { success: true };
    } catch (error: unknown) {
      console.error('Failed to send didClose to TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // Language features
  ipcMain.handle('typescript-lsp:completion', async (event, params: {
    uri: string;
    position: { line: number; character: number };
  }) => {
    try {
      const result = await typescriptLSPService.getCompletions(params.uri, params.position);
      return { success: true, result };
    } catch (error: unknown) {
      console.error('Failed to get completions from TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('typescript-lsp:hover', async (event, params: {
    uri: string;
    position: { line: number; character: number };
  }) => {
    try {
      const result = await typescriptLSPService.getHover(params.uri, params.position);
      return { success: true, result };
    } catch (error: unknown) {
      console.error('Failed to get hover from TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('typescript-lsp:definition', async (event, params: {
    uri: string;
    position: { line: number; character: number };
  }) => {
    try {
      const result = await typescriptLSPService.getDefinition(params.uri, params.position);
      return { success: true, result };
    } catch (error: unknown) {
      console.error('Failed to get definition from TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('typescript-lsp:references', async (event, params: {
    uri: string;
    position: { line: number; character: number };
  }) => {
    try {
      const result = await typescriptLSPService.getReferences(params.uri, params.position);
      return { success: true, result };
    } catch (error: unknown) {
      console.error('Failed to get references from TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('typescript-lsp:signatureHelp', async (event, params: {
    uri: string;
    position: { line: number; character: number };
  }) => {
    try {
      const result = await typescriptLSPService.getSignatureHelp(params.uri, params.position);
      return { success: true, result };
    } catch (error: unknown) {
      console.error('Failed to get signature help from TypeScript LSP:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ...existing code...

  // Server status
  ipcMain.handle('typescript-lsp:status', async () => {
    return {
      isRunning: typescriptLSPService.isServerRunning(),
    };
  });

  // Listen for LSP notifications and forward them to renderer
  typescriptLSPService.on('notification', (notification) => {
    mainWindow.webContents.send('typescript-lsp:notification', notification);
  });

  // Cleanup on app exit
  const cleanup = () => {
    typescriptLSPService.stopServer();
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
