// TypeScript LSP Client for renderer process
// Communicates with the TypeScript Language Server via IPC

export interface LSPPosition {
  line: number;
  character: number;
}

export interface LSPRange {
  start: LSPPosition;
  end: LSPPosition;
}

export interface LSPDiagnostic {
  range: LSPRange;
  severity?: number;
  code?: string | number;
  source?: string;
  message: string;
}

export interface LSPCompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: string | { kind: string; value: string };
  insertText?: string;
  filterText?: string;
  sortText?: string;
  commitCharacters?: string[];
}

export interface LSPHoverInfo {
  contents: Array<string | { language: string; value: string }>;
  range?: LSPRange;
}

export interface LSPLocation {
  uri: string;
  range: LSPRange;
}

class TypeScriptLSPClient {
  private static instance: TypeScriptLSPClient;
  private isInitialized = false;
  private documentVersions = new Map<string, number>();
  private openDocuments = new Set<string>();
  private diagnosticsCallback?: (uri: string, diagnostics: LSPDiagnostic[]) => void;

  private constructor() {
    // Listen for LSP notifications from main process
    if (window.electronAPI) {
      window.electronAPI.onTypescriptLSPNotification((notification: any) => {
        this.handleNotification(notification);
      });
    }
  }

  public static getInstance(): TypeScriptLSPClient {
    if (!TypeScriptLSPClient.instance) {
      TypeScriptLSPClient.instance = new TypeScriptLSPClient();
    }
    return TypeScriptLSPClient.instance;
  }

  public async initialize(projectPath: string): Promise<boolean> {
    try {
      // Check if electronAPI is available
      if (!window.electronAPI?.typescriptLSP) {
        console.warn('TypeScript LSP API not available - running in development mode?');
        return false;
      }

      // Retry mechanism for initialization
      let retries = 3;
      let lastError: string = '';
      
      while (retries > 0) {
        try {
          const result = await window.electronAPI.typescriptLSP.initialize(projectPath);
          if (result.success) {
            this.isInitialized = true;
            console.log('TypeScript LSP initialized successfully for project:', projectPath);
            return true;
          } else {
            lastError = result.error || 'Unknown error';
            console.warn(`TypeScript LSP initialization attempt failed: ${lastError}`);
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          console.warn(`TypeScript LSP initialization attempt failed: ${lastError}`);
        }
        
        retries--;
        if (retries > 0) {
          console.log(`Retrying TypeScript LSP initialization in 2 seconds... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.error('Failed to initialize TypeScript LSP after all retries:', lastError);
      this.isInitialized = false;
      return false;
    } catch (error) {
      console.error('Error initializing TypeScript LSP:', error);
      this.isInitialized = false;
      return false;
    }
  }

  public async openDocument(uri: string, languageId: string, text: string): Promise<void> {
    if (!this.isInitialized || !window.electronAPI?.typescriptLSP) {
      console.warn('TypeScript LSP not initialized or not available');
      return;
    }

    const version = this.getNextVersion(uri);
    
    try {
      const result = await window.electronAPI.typescriptLSP.didOpen({
        uri,
        languageId,
        version,
        text,
      });

      if (result.success) {
        this.openDocuments.add(uri);
        console.log(`Opened document in TypeScript LSP: ${uri}`);
      } else {
        console.error('Failed to open document in TypeScript LSP:', result.error);
      }
    } catch (error) {
      console.error('Error opening document in TypeScript LSP:', error);
    }
  }

  public async updateDocument(uri: string, changes: Array<{
    range?: LSPRange;
    text: string;
  }>): Promise<void> {
    if (!this.isInitialized || !this.openDocuments.has(uri) || !window.electronAPI?.typescriptLSP) {
      return;
    }

    const version = this.getNextVersion(uri);

    try {
      const result = await window.electronAPI.typescriptLSP.didChange({
        uri,
        version,
        changes,
      });

      if (!result.success) {
        console.error('Failed to update document in TypeScript LSP:', result.error);
      }
    } catch (error) {
      console.error('Error updating document in TypeScript LSP:', error);
    }
  }

  public async closeDocument(uri: string): Promise<void> {
    if (!this.isInitialized || !this.openDocuments.has(uri)) {
      return;
    }

    try {
      const result = await window.electronAPI.typescriptLSP.didClose(uri);
      
      if (result.success) {
        this.openDocuments.delete(uri);
        this.documentVersions.delete(uri);
        console.log(`Closed document in TypeScript LSP: ${uri}`);
      } else {
        console.error('Failed to close document in TypeScript LSP:', result.error);
      }
    } catch (error) {
      console.error('Error closing document in TypeScript LSP:', error);
    }
  }

  public async getCompletions(uri: string, position: LSPPosition): Promise<LSPCompletionItem[]> {
    if (!this.isInitialized || !window.electronAPI?.typescriptLSP) {
      return [];
    }

    try {
      const result = await window.electronAPI.typescriptLSP.completion({
        uri,
        position,
      });

      if (result.success && result.result) {
        const items = Array.isArray(result.result.items) 
          ? result.result.items 
          : Array.isArray(result.result) 
            ? result.result 
            : [];
        
        return items.map((item: any) => ({
          label: item.label || '',
          kind: item.kind,
          detail: item.detail,
          documentation: item.documentation,
          insertText: item.insertText || item.label,
          filterText: item.filterText,
          sortText: item.sortText,
          commitCharacters: item.commitCharacters,
        }));
      }
    } catch (error) {
      console.error('Error getting completions from TypeScript LSP:', error);
    }

    return [];
  }

  public async getHover(uri: string, position: LSPPosition): Promise<LSPHoverInfo | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const result = await window.electronAPI.typescriptLSP.hover({
        uri,
        position,
      });

      if (result.success && result.result) {
        return {
          contents: Array.isArray(result.result.contents) 
            ? result.result.contents 
            : [result.result.contents],
          range: result.result.range,
        };
      }
    } catch (error) {
      console.error('Error getting hover from TypeScript LSP:', error);
    }

    return null;
  }

  public async getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const result = await window.electronAPI.typescriptLSP.definition({
        uri,
        position,
      });

      if (result.success && result.result) {
        const locations = Array.isArray(result.result) ? result.result : [result.result];
        return locations.filter(Boolean).map((loc: any) => ({
          uri: loc.uri,
          range: loc.range,
        }));
      }
    } catch (error) {
      console.error('Error getting definition from TypeScript LSP:', error);
    }

    return [];
  }

  public async getReferences(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const result = await window.electronAPI.typescriptLSP.references({
        uri,
        position,
      });

      if (result.success && result.result) {
        return Array.isArray(result.result) 
          ? result.result.map((ref: any) => ({
              uri: ref.uri,
              range: ref.range,
            }))
          : [];
      }
    } catch (error) {
      console.error('Error getting references from TypeScript LSP:', error);
    }

    return [];
  }

  public async getSignatureHelp(uri: string, position: LSPPosition): Promise<any> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const result = await window.electronAPI.typescriptLSP.signatureHelp({
        uri,
        position,
      });

      if (result.success && result.result) {
        return result.result;
      }
    } catch (error) {
      console.error('Error getting signature help from TypeScript LSP:', error);
    }

    return null;
  }

  public setDiagnosticsCallback(callback: (uri: string, diagnostics: LSPDiagnostic[]) => void): void {
    this.diagnosticsCallback = callback;
  }

  private handleNotification(notification: any): void {
    switch (notification.method) {
      case 'textDocument/publishDiagnostics':
        if (this.diagnosticsCallback && notification.params) {
          this.diagnosticsCallback(notification.params.uri, notification.params.diagnostics || []);
        }
        break;
      
      default:
        console.log('Received LSP notification:', notification.method, notification.params);
        break;
    }
  }

  private getNextVersion(uri: string): number {
    const current = this.documentVersions.get(uri) || 0;
    const next = current + 1;
    this.documentVersions.set(uri, next);
    return next;
  }

  public isDocumentOpen(uri: string): boolean {
    return this.openDocuments.has(uri);
  }

  public async getStatus(): Promise<{ isRunning: boolean }> {
    try {
      return await window.electronAPI.typescriptLSP.status();
    } catch (error) {
      console.error('Error getting TypeScript LSP status:', error);
      return { isRunning: false };
    }
  }
}

export const typescriptLSPClient = TypeScriptLSPClient.getInstance();
