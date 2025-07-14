import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';

export interface CloseBufferOptions {
  bufferId: string;
  paneId?: string;
  force?: boolean; // Skip confirmation dialog
}

export class BufferCloseService {
  private static instance: BufferCloseService;
  private confirmationHandlers: Map<string, (options: {
    bufferId: string;
    fileName: string;
    onSave: () => Promise<void>;
    onDiscard: () => void;
    onCancel: () => void;
  }) => void> = new Map();

  static getInstance(): BufferCloseService {
    if (!BufferCloseService.instance) {
      BufferCloseService.instance = new BufferCloseService();
    }
    return BufferCloseService.instance;
  }

  // Set the confirmation handler for a specific pane
  setConfirmationHandler(paneId: string, handler: (options: {
    bufferId: string;
    fileName: string;
    onSave: () => Promise<void>;
    onDiscard: () => void;
    onCancel: () => void;
  }) => void) {
    this.confirmationHandlers.set(paneId, handler);
  }

  // Remove confirmation handler for a pane
  removeConfirmationHandler(paneId: string) {
    this.confirmationHandlers.delete(paneId);
  }

  // Get confirmation handler for a pane or any available handler
  private getConfirmationHandler(paneId?: string) {
    if (paneId && this.confirmationHandlers.has(paneId)) {
      return this.confirmationHandlers.get(paneId);
    }
    
    // Return any available handler
    const handlers = Array.from(this.confirmationHandlers.values());
    return handlers.length > 0 ? handlers[0] : null;
  }

  // Close a buffer with proper split/pane awareness
  async closeBuffer(options: CloseBufferOptions): Promise<boolean> {
    const bufferStore = useBufferStore.getState();
    const editorSplitStore = useEditorSplitStore.getState();
    
    const { bufferId, paneId, force = false } = options;
    const buffer = bufferStore.getBuffer(bufferId);
    
    if (!buffer) return true; // Already closed

    // Determine the pane to close from (if not specified)
    let sourcePaneId = paneId;
    if (!sourcePaneId && editorSplitStore.activePaneId) {
      const activePane = editorSplitStore.getPane(editorSplitStore.activePaneId);
      if (activePane?.bufferIds.includes(bufferId)) {
        sourcePaneId = editorSplitStore.activePaneId;
      }
    }

    // Check if buffer is open in other panes
    const isOpenElsewhere = sourcePaneId 
      ? editorSplitStore.isBufferOpenInOtherPanes(bufferId, sourcePaneId)
      : false;

    if (isOpenElsewhere && sourcePaneId) {
      // Buffer is open in other panes, just remove from this pane
      editorSplitStore.closeBufferInPane(sourcePaneId, bufferId);
      return true;
    }

    // Buffer is only open in one pane (or no specific pane)
    if (buffer.isDirty && !force) {
      // Need confirmation for dirty buffer
      const confirmationHandler = this.getConfirmationHandler(sourcePaneId);
      if (confirmationHandler) {
        return new Promise((resolve) => {
          confirmationHandler({
            bufferId,
            fileName: buffer.name,
            onSave: async () => {
              await bufferStore.saveBuffer(bufferId);
              await bufferStore.closeBuffer(bufferId);
              if (sourcePaneId) {
                editorSplitStore.closeBufferInPane(sourcePaneId, bufferId);
              }
              resolve(true);
            },
            onDiscard: () => {
              bufferStore.closeBuffer(bufferId);
              if (sourcePaneId) {
                editorSplitStore.closeBufferInPane(sourcePaneId, bufferId);
              }
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          });
        });
      } else {
        // No confirmation handler available, just close without confirmation
        console.warn('No confirmation handler available for dirty buffer, closing without confirmation');
        await bufferStore.closeBuffer(bufferId);
        if (sourcePaneId) {
          editorSplitStore.closeBufferInPane(sourcePaneId, bufferId);
        }
        return true;
      }
    }

    // Buffer is clean or force close, close it globally
    await bufferStore.closeBuffer(bufferId);
    if (sourcePaneId) {
      editorSplitStore.closeBufferInPane(sourcePaneId, bufferId);
    }
    return true;
  }

  // Close the currently active buffer
  async closeActiveBuffer(): Promise<boolean> {
    const bufferStore = useBufferStore.getState();
    const editorSplitStore = useEditorSplitStore.getState();
    
    // Try to get the active buffer from the global buffer store first
    let activeBuffer = bufferStore.activeBufferId;
    let activePaneId = editorSplitStore.activePaneId;
    
    // If no global active buffer, try to get from the active pane
    if (!activeBuffer && activePaneId) {
      const activePane = editorSplitStore.getPane(activePaneId);
      activeBuffer = activePane?.activeBufferId || null;
    }

    if (activeBuffer) {
      return await this.closeBuffer({ 
        bufferId: activeBuffer, 
        paneId: activePaneId || undefined 
      });
    }

    return false;
  }
}

export const bufferCloseService = BufferCloseService.getInstance();
