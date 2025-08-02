import { useEffect } from 'react';
import { useBufferStore } from '@/stores/buffers';
import { useProjectStore } from '@/stores/project';

declare global {
  interface Window {
    applicationMenuApi: {
      onNewFile: (callback: () => void) => () => void;
      onNewWindow: (callback: () => void) => () => void;
      onOpenFolder: (callback: () => void) => () => void;
      onSaveFile: (callback: () => void) => () => void;
      onSaveAsFile: (callback: () => void) => () => void;
      onCloseWindow: (callback: () => void) => () => void;
    };
    fileDialogApi: {
      showSaveAsDialog: (options?: {
        defaultPath?: string;
        filters?: Array<{
          name: string;
          extensions: string[];
        }>;
      }) => Promise<{
        canceled: boolean;
        filePath?: string;
      }>;
    };
  }
}

export function useApplicationMenuHandlers() {
  const { createBuffer, saveBuffer, saveBufferAs, activeBufferId, getBuffer } = useBufferStore();
  const { openProject } = useProjectStore();

  useEffect(() => {
    if (!window.applicationMenuApi) return;

    // New File handler
    const unsubscribeNewFile = window.applicationMenuApi.onNewFile(() => {
      createBuffer('Untitled', '');
    });

    // New Window handler - handled by main process, no action needed here
    const unsubscribeNewWindow = window.applicationMenuApi.onNewWindow(() => {
      // This is handled by the main process
    });

    // Open Folder handler - handled by main process, no action needed here
    const unsubscribeOpenFolder = window.applicationMenuApi.onOpenFolder(() => {
      // This is handled by the main process via dialog
    });

    // Save File handler
    const unsubscribeSaveFile = window.applicationMenuApi.onSaveFile(async () => {
      if (activeBufferId) {
        const buffer = getBuffer(activeBufferId);
        if (buffer) {
          if (buffer.isNewFile) {
            // If it's a new file, trigger Save As dialog
            await handleSaveAs();
          } else {
            // If it's an existing file, just save
            await saveBuffer(activeBufferId);
          }
        }
      }
    });

    // Save As File handler
    const unsubscribeSaveAsFile = window.applicationMenuApi.onSaveAsFile(async () => {
      if (activeBufferId) {
        await handleSaveAs();
      }
    });

    // Close Window handler - handled by main process
    const unsubscribeCloseWindow = window.applicationMenuApi.onCloseWindow(() => {
      // This is handled by the main process
    });

    // Helper function to handle Save As
    const handleSaveAs = async () => {
      if (!activeBufferId || !window.fileDialogApi) return;

      const buffer = getBuffer(activeBufferId);
      if (!buffer) return;

      try {
        const result = await window.fileDialogApi.showSaveAsDialog({
          defaultPath: buffer.name,
          filters: [
            { name: 'All Files', extensions: ['*'] },
            { name: 'Text Files', extensions: ['txt', 'md'] },
            { name: 'JavaScript', extensions: ['js', 'jsx'] },
            { name: 'TypeScript', extensions: ['ts', 'tsx'] },
            { name: 'JSON', extensions: ['json'] },
            { name: 'HTML', extensions: ['html', 'htm'] },
            { name: 'CSS', extensions: ['css', 'scss', 'sass'] },
            { name: 'Python', extensions: ['py'] },
            { name: 'Java', extensions: ['java'] },
            { name: 'C/C++', extensions: ['c', 'cpp', 'h', 'hpp'] }
          ]
        });

        if (!result.canceled && result.filePath) {
          await saveBufferAs(activeBufferId, result.filePath);
        }
      } catch (error) {
        console.error('Failed to show save dialog:', error);
      }
    };

    // Cleanup function
    return () => {
      unsubscribeNewFile();
      unsubscribeNewWindow();
      unsubscribeOpenFolder();
      unsubscribeSaveFile();
      unsubscribeSaveAsFile();
      unsubscribeCloseWindow();
    };
  }, [activeBufferId, createBuffer, saveBuffer, saveBufferAs, getBuffer]);
}
