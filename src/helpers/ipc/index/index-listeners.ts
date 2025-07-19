import { ipcMain, WebContents } from 'electron';
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
} from './index-channels';
import { SmartIndexService } from './smart-index-service';
import { BuildIndexOptions } from './index-context';

let indexService: SmartIndexService | null = null;

function getIndexService(): SmartIndexService {
  if (!indexService) {
    indexService = new SmartIndexService();
  }
  return indexService;
}

// Helper function to safely send to webContents
function safeSend(webContents: WebContents, channel: string, data: any): void {
  try {
    if (!webContents.isDestroyed()) {
      webContents.send(channel, data);
    }
  } catch (error) {
    // Silently ignore errors when sending to destroyed webContents
    console.warn(`Failed to send on channel ${channel}:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

export function addIndexEventListeners() {
  // Build index
  ipcMain.handle(INDEX_BUILD_CHANNEL, async (event, options: BuildIndexOptions) => {
    try {
      const service = getIndexService();
      
      // Check if indexing is already in progress
      if (service.isIndexingInProgress()) {
        throw new Error('Indexing is already in progress. Please wait for the current operation to complete.');
      }
      
      // Set up progress callback with safe sending
      const onProgress = (progress: number, currentFile?: string, message?: string) => {
        safeSend(event.sender, INDEX_PROGRESS_CHANNEL, { progress, currentFile, message });
      };
      
      const onError = (error: string, filePath?: string) => {
        safeSend(event.sender, INDEX_ERROR_CHANNEL, { error, filePath });
      };
      
      await service.buildIndex(options, onProgress, onError);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      safeSend(event.sender, INDEX_ERROR_CHANNEL, { error: errorMessage });
      throw error;
    }
  });

  // Cancel indexing
  ipcMain.handle(INDEX_CANCEL_CHANNEL, async () => {
    try {
      const service = getIndexService();
      service.cancelIndexing();
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  // Search index
  ipcMain.handle(INDEX_SEARCH_CHANNEL, async (event, { query, limit = 10 }) => {
    try {
      const service = getIndexService();
      return await service.search(query, limit);
    } catch (error) {
      throw error;
    }
  });

  // Get status
  ipcMain.handle(INDEX_STATUS_CHANNEL, async () => {
    try {
      const service = getIndexService();
      return service.getStatus();
    } catch (error) {
      throw error;
    }
  });

  // Get stats
  ipcMain.handle(INDEX_GET_STATS_CHANNEL, async () => {
    try {
      const service = getIndexService();
      return service.getStats();
    } catch (error) {
      throw error;
    }
  });

  // Clear index
  ipcMain.handle(INDEX_CLEAR_CHANNEL, async () => {
    try {
      const service = getIndexService();
      await service.clearIndex();
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  // Update file
  ipcMain.handle(INDEX_UPDATE_FILE_CHANNEL, async (event, { filePath }) => {
    try {
      const service = getIndexService();
      await service.updateFile(filePath);
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  // Remove file
  ipcMain.handle(INDEX_REMOVE_FILE_CHANNEL, async (event, { filePath }) => {
    try {
      const service = getIndexService();
      await service.removeFile(filePath);
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  // Check if indexing is in progress
  ipcMain.handle(INDEX_IS_INDEXING_CHANNEL, async () => {
    try {
      const service = getIndexService();
      return { isIndexing: service.isIndexingInProgress() };
    } catch (error) {
      throw error;
    }
  });
}
