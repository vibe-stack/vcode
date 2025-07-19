import {
  INDEX_BUILD_CHANNEL,
  INDEX_SEARCH_CHANNEL,
  INDEX_STATUS_CHANNEL,
  INDEX_PROGRESS_CHANNEL,
  INDEX_ERROR_CHANNEL,
  INDEX_GET_STATS_CHANNEL,
  INDEX_CLEAR_CHANNEL,
  INDEX_UPDATE_FILE_CHANNEL,
  INDEX_REMOVE_FILE_CHANNEL,
  INDEX_CANCEL_CHANNEL,
  INDEX_IS_INDEXING_CHANNEL,
} from "./index-channels";

export interface SearchResult {
  filePath: string;
  content: string;
  score: number;
  lineNumber?: number;
  snippet?: string;
}

export interface IndexStats {
  totalFiles: number;
  totalChunks: number;
  indexSize: number;
  lastUpdated: Date;
}

export interface BuildIndexOptions {
  projectPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  chunkSize?: number;
  chunkOverlap?: number;
}

export function exposeIndexContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");

  contextBridge.exposeInMainWorld("indexApi", {
    // Build index for the entire project
    buildIndex: (options: BuildIndexOptions) => 
      ipcRenderer.invoke(INDEX_BUILD_CHANNEL, options),
    
    // Search the index with semantic similarity
    search: (query: string, limit?: number) => 
      ipcRenderer.invoke(INDEX_SEARCH_CHANNEL, { query, limit }),
    
    // Get current index status
    getStatus: () => 
      ipcRenderer.invoke(INDEX_STATUS_CHANNEL),
    
    // Get index statistics
    getStats: () => 
      ipcRenderer.invoke(INDEX_GET_STATS_CHANNEL),
    
    // Clear the current index
    clearIndex: () => 
      ipcRenderer.invoke(INDEX_CLEAR_CHANNEL),
    
    // Update a specific file in the index
    updateFile: (filePath: string) => 
      ipcRenderer.invoke(INDEX_UPDATE_FILE_CHANNEL, { filePath }),
    
    // Remove a file from the index
    removeFile: (filePath: string) => 
      ipcRenderer.invoke(INDEX_REMOVE_FILE_CHANNEL, { filePath }),
    
    // Check if indexing is in progress
    isIndexing: () => 
      ipcRenderer.invoke(INDEX_IS_INDEXING_CHANNEL),
    
    // Cancel ongoing indexing
    cancelIndexing: () => 
      ipcRenderer.invoke(INDEX_CANCEL_CHANNEL),
    
    // Listen for progress updates during indexing
    onProgress: (callback: (data: { progress: number; currentFile?: string; message?: string }) => void) => {
      ipcRenderer.on(INDEX_PROGRESS_CHANNEL, (_event: any, data: any) => callback(data));
    },
    
    // Listen for indexing errors
    onError: (callback: (data: { error: string; filePath?: string }) => void) => {
      ipcRenderer.on(INDEX_ERROR_CHANNEL, (_event: any, data: any) => callback(data));
    },
    
    // Remove all listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners(INDEX_PROGRESS_CHANNEL);
      ipcRenderer.removeAllListeners(INDEX_ERROR_CHANNEL);
    }
  });
}
