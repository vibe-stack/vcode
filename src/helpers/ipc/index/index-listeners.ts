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

export function addIndexEventListeners() {
  // Build index
  ipcMain.handle(INDEX_BUILD_CHANNEL, async (event, options: BuildIndexOptions) => {
    try {
      const service = getIndexService();
      
      // Set up progress callback
      const onProgress = (progress: number, currentFile?: string, message?: string) => {
        event.sender.send(INDEX_PROGRESS_CHANNEL, { progress, currentFile, message });
      };
      
      const onError = (error: string, filePath?: string) => {
        event.sender.send(INDEX_ERROR_CHANNEL, { error, filePath });
      };
      
      await service.buildIndex(options, onProgress, onError);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      event.sender.send(INDEX_ERROR_CHANNEL, { error: errorMessage });
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
}
