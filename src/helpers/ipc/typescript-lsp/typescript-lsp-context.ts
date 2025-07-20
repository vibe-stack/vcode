import { contextBridge, ipcRenderer } from 'electron';

export function exposeTypescriptLSPContext() {
  try {
    // Get existing electronAPI or create new one
    const existingAPI = (globalThis as any).electronAPI || {};
    
    contextBridge.exposeInMainWorld('electronAPI', {
      ...existingAPI,
      typescriptLSP: {
        initialize: (projectPath: string) => 
          ipcRenderer.invoke('typescript-lsp:initialize', projectPath),
        
        didOpen: (params: {
          uri: string;
          languageId: string;
          version: number;
          text: string;
        }) => ipcRenderer.invoke('typescript-lsp:didOpen', params),
        
        didChange: (params: {
          uri: string;
          version: number;
          changes: any[];
        }) => ipcRenderer.invoke('typescript-lsp:didChange', params),
        
        didClose: (uri: string) => 
          ipcRenderer.invoke('typescript-lsp:didClose', uri),
        
        completion: (params: {
          uri: string;
          position: { line: number; character: number };
        }) => ipcRenderer.invoke('typescript-lsp:completion', params),
        
        hover: (params: {
          uri: string;
          position: { line: number; character: number };
        }) => ipcRenderer.invoke('typescript-lsp:hover', params),
        
        definition: (params: {
          uri: string;
          position: { line: number; character: number };
        }) => ipcRenderer.invoke('typescript-lsp:definition', params),
        
        references: (params: {
          uri: string;
          position: { line: number; character: number };
        }) => ipcRenderer.invoke('typescript-lsp:references', params),
        
        signatureHelp: (params: {
          uri: string;
          position: { line: number; character: number };
        }) => ipcRenderer.invoke('typescript-lsp:signatureHelp', params),
        
        status: () => ipcRenderer.invoke('typescript-lsp:status'),
      },
      
      onTypescriptLSPNotification: (callback: (notification: any) => void) => {
        ipcRenderer.on('typescript-lsp:notification', (event, notification) => {
          callback(notification);
        });
      },
    });
  } catch (error) {
    console.error('Failed to expose TypeScript LSP context:', error);
  }
}
