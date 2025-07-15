import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FileSnapshot {
  messageId: string; // Assistant's message ID
  filePath: string;
  prevState: string;
  nextState: string;
  status: 'pending' | 'accepted' | 'reverted' | 'failed';
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
}

export interface ChatSnapshot {
  sessionId: string;
  snapshots: FileSnapshot[];
}

export interface ChatSnapshotState {
  snapshots: ChatSnapshot[];
  
  // Actions
  addSnapshot: (sessionId: string, snapshot: Omit<FileSnapshot, 'timestamp'>) => void;
  getSnapshotsForSession: (sessionId: string) => FileSnapshot[];
  getPendingSnapshotsForMessage: (sessionId: string, messageId: string) => FileSnapshot[];
  acceptAllSnapshots: (sessionId: string, messageId: string) => void;
  acceptAllPendingSnapshots: (sessionId: string) => void;
  revertAllSnapshots: (sessionId: string, messageId: string) => Promise<void>;
  revertAllPendingSnapshots: (sessionId: string) => Promise<void>;
  updateSnapshotStatus: (sessionId: string, messageId: string, filePath: string, status: FileSnapshot['status']) => void;
  clearSessionSnapshots: (sessionId: string) => void;
  clearAllSnapshots: () => void;
  restoreToSnapshot: (sessionId: string, targetMessageId: string) => Promise<void>;
  restoreToState: (sessionId: string, targetMessageId: string, targetState: 'before' | 'after') => Promise<void>;
}

export const useChatSnapshotStore = create<ChatSnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],

      addSnapshot: (sessionId, snapshot) => {
        const timestamp = Date.now();
        set((state) => {
          const existingChatIndex = state.snapshots.findIndex(chat => chat.sessionId === sessionId);
          
          if (existingChatIndex === -1) {
            // Create new chat snapshot
            return {
              snapshots: [
                ...state.snapshots,
                {
                  sessionId,
                  snapshots: [{ ...snapshot, timestamp }]
                }
              ]
            };
          } else {
            // Update existing chat snapshot
            const updatedSnapshots = [...state.snapshots];
            const chatSnapshots = { ...updatedSnapshots[existingChatIndex] };
            
            // Check if we already have a snapshot for this message and file
            const existingSnapshotIndex = chatSnapshots.snapshots.findIndex(
              s => s.messageId === snapshot.messageId && s.filePath === snapshot.filePath
            );
            
            if (existingSnapshotIndex !== -1) {
              // Update existing snapshot (override within same turn)
              chatSnapshots.snapshots = [...chatSnapshots.snapshots];
              chatSnapshots.snapshots[existingSnapshotIndex] = {
                ...chatSnapshots.snapshots[existingSnapshotIndex],
                ...snapshot,
                timestamp
              };
            } else {
              // Add new snapshot
              chatSnapshots.snapshots = [...chatSnapshots.snapshots, { ...snapshot, timestamp }];
            }
            
            updatedSnapshots[existingChatIndex] = chatSnapshots;
            return { snapshots: updatedSnapshots };
          }
        });
      },

      getSnapshotsForSession: (sessionId) => {
        const chat = get().snapshots.find(chat => chat.sessionId === sessionId);
        return chat?.snapshots || [];
      },

      getPendingSnapshotsForMessage: (sessionId, messageId) => {
        const chat = get().snapshots.find(chat => chat.sessionId === sessionId);
        return chat?.snapshots.filter(
          s => s.messageId === messageId && s.status === 'pending'
        ) || [];
      },

      acceptAllSnapshots: (sessionId, messageId) => {
        set((state) => {
          const chatIndex = state.snapshots.findIndex(chat => chat.sessionId === sessionId);
          if (chatIndex === -1) return state;
          
          const updatedSnapshots = [...state.snapshots];
          const chatSnapshots = { ...updatedSnapshots[chatIndex] };
          
          let hasChanges = false;
          chatSnapshots.snapshots = chatSnapshots.snapshots.map(snapshot => {
            if (snapshot.messageId === messageId && snapshot.status === 'pending') {
              hasChanges = true;
              return { ...snapshot, status: 'accepted' as const };
            }
            return snapshot;
          });
          
          if (!hasChanges) return state;
          
          updatedSnapshots[chatIndex] = chatSnapshots;
          return { snapshots: updatedSnapshots };
        });
      },

      acceptAllPendingSnapshots: (sessionId) => {
        set((state) => {
          const chatIndex = state.snapshots.findIndex(chat => chat.sessionId === sessionId);
          if (chatIndex === -1) return state;
          
          const updatedSnapshots = [...state.snapshots];
          const chatSnapshots = { ...updatedSnapshots[chatIndex] };
          
          let hasChanges = false;
          chatSnapshots.snapshots = chatSnapshots.snapshots.map(snapshot => {
            if (snapshot.status === 'pending') {
              hasChanges = true;
              return { ...snapshot, status: 'accepted' as const };
            }
            return snapshot;
          });
          
          if (!hasChanges) return state;
          
          updatedSnapshots[chatIndex] = chatSnapshots;
          return { snapshots: updatedSnapshots };
        });
      },

      revertAllPendingSnapshots: async (sessionId) => {
        const chat = get().snapshots.find(chat => chat.sessionId === sessionId);
        if (!chat) return;

        const pendingSnapshots = chat.snapshots.filter(s => s.status === 'pending');
        if (pendingSnapshots.length === 0) return;

        // Import stores dynamically to avoid circular imports
        const { useEditorSplitStore } = await import('@/stores/editor-splits');
        const { useBufferStore } = await import('@/stores/buffers');
        
        const editorStore = useEditorSplitStore.getState();
        const bufferStore = useBufferStore.getState();

        // Group by messageId to revert in order
        const messageGroups = pendingSnapshots.reduce((groups: any, snapshot) => {
          if (!groups[snapshot.messageId]) {
            groups[snapshot.messageId] = [];
          }
          groups[snapshot.messageId].push(snapshot);
          return groups;
        }, {});

        // Revert each message group
        for (const messageId of Object.keys(messageGroups)) {
          const snapshotsInMessage = messageGroups[messageId];
          
          for (const snapshot of snapshotsInMessage) {
            try {
              if (snapshot.operation === 'create') {
                // Delete the created file
                await window.projectApi.deleteFile(snapshot.filePath);
                
                // Close buffer if it exists
                const buffer = bufferStore.getBufferByPath(snapshot.filePath);
                if (buffer) {
                  bufferStore.closeBuffer(buffer.id);
                }
              } else if (snapshot.operation === 'update') {
                // Restore previous content
                await window.projectApi.createFile(snapshot.filePath, snapshot.prevState);
                
                // Update buffer if it exists
                const buffer = bufferStore.getBufferByPath(snapshot.filePath);
                if (buffer) {
                  bufferStore.updateBufferContent(buffer.id, snapshot.prevState);
                  await bufferStore.saveBuffer(buffer.id);
                }
              } else if (snapshot.operation === 'delete') {
                // Restore deleted file
                await window.projectApi.createFile(snapshot.filePath, snapshot.prevState);
                
                // Open file in buffer if needed
                await editorStore.openFile(snapshot.filePath);
              }
            } catch (error) {
              console.error(`Failed to revert ${snapshot.filePath}:`, error);
              // Mark as failed but continue with other reverts
              get().updateSnapshotStatus(sessionId, snapshot.messageId, snapshot.filePath, 'failed');
            }
          }
        }

        // Mark all as reverted
        set((state) => {
          const chatIndex = state.snapshots.findIndex(chat => chat.sessionId === sessionId);
          if (chatIndex === -1) return state;
          
          const updatedSnapshots = [...state.snapshots];
          const chatSnapshots = { ...updatedSnapshots[chatIndex] };
          
          chatSnapshots.snapshots = chatSnapshots.snapshots.map(snapshot => 
            snapshot.status === 'pending'
              ? { ...snapshot, status: 'reverted' as const }
              : snapshot
          );
          
          updatedSnapshots[chatIndex] = chatSnapshots;
          return { snapshots: updatedSnapshots };
        });
      },

      revertAllSnapshots: async (sessionId, messageId) => {
        const chat = get().snapshots.find(chat => chat.sessionId === sessionId);
        if (!chat) return;

        const pendingSnapshots = chat.snapshots.filter(
          s => s.messageId === messageId && s.status === 'pending'
        );

        // Import stores dynamically to avoid circular imports
        const { useEditorSplitStore } = await import('@/stores/editor-splits');
        const { useBufferStore } = await import('@/stores/buffers');
        
        const editorStore = useEditorSplitStore.getState();
        const bufferStore = useBufferStore.getState();

        // Revert file changes
        for (const snapshot of pendingSnapshots) {
          try {
            if (snapshot.operation === 'create') {
              // Delete the created file
              await window.projectApi.deleteFile(snapshot.filePath);
              
              // Close buffer if it exists
              const buffer = bufferStore.getBufferByPath(snapshot.filePath);
              if (buffer) {
                bufferStore.closeBuffer(buffer.id);
              }
            } else if (snapshot.operation === 'update') {
              // Restore previous content
              await window.projectApi.createFile(snapshot.filePath, snapshot.prevState);
              
              // Update buffer if it exists
              const buffer = bufferStore.getBufferByPath(snapshot.filePath);
              if (buffer) {
                bufferStore.updateBufferContent(buffer.id, snapshot.prevState);
                await bufferStore.saveBuffer(buffer.id);
              }
            } else if (snapshot.operation === 'delete') {
              // Restore deleted file
              await window.projectApi.createFile(snapshot.filePath, snapshot.prevState);
              
              // Open file in buffer if needed
              await editorStore.openFile(snapshot.filePath);
            }
          } catch (error) {
            console.error(`Failed to revert ${snapshot.filePath}:`, error);
            // Mark as failed but continue with other reverts
            get().updateSnapshotStatus(sessionId, messageId, snapshot.filePath, 'failed');
          }
        }

        // Mark all as reverted
        set((state) => {
          const updatedSnapshots = state.snapshots.map(chat => {
            if (chat.sessionId === sessionId) {
              return {
                ...chat,
                snapshots: chat.snapshots.map(snapshot => 
                  snapshot.messageId === messageId && snapshot.status === 'pending'
                    ? { ...snapshot, status: 'reverted' as const }
                    : snapshot
                )
              };
            }
            return chat;
          });
          return { snapshots: updatedSnapshots };
        });
      },

      updateSnapshotStatus: (sessionId, messageId, filePath, status) => {
        set((state) => {
          const chatIndex = state.snapshots.findIndex(chat => chat.sessionId === sessionId);
          if (chatIndex === -1) return state;
          
          const updatedSnapshots = [...state.snapshots];
          const chatSnapshots = { ...updatedSnapshots[chatIndex] };
          
          let hasChanges = false;
          chatSnapshots.snapshots = chatSnapshots.snapshots.map(snapshot => {
            if (snapshot.messageId === messageId && snapshot.filePath === filePath) {
              hasChanges = true;
              return { ...snapshot, status };
            }
            return snapshot;
          });
          
          if (!hasChanges) return state;
          
          updatedSnapshots[chatIndex] = chatSnapshots;
          return { snapshots: updatedSnapshots };
        });
      },

      clearSessionSnapshots: (sessionId) => {
        set((state) => ({
          snapshots: state.snapshots.filter(chat => chat.sessionId !== sessionId)
        }));
      },

      clearAllSnapshots: () => {
        set({ snapshots: [] });
      },

      restoreToSnapshot: async (sessionId: string, targetMessageId: string) => {
        const chat = get().snapshots.find(chat => chat.sessionId === sessionId);
        if (!chat) return;

        // Find the target snapshot group (by messageId)
        const targetSnapshotGroup = chat.snapshots.filter(s => s.messageId === targetMessageId);
        if (targetSnapshotGroup.length === 0) return;

        // Import stores dynamically to avoid circular imports
        const { useEditorSplitStore } = await import('@/stores/editor-splits');
        const { useBufferStore } = await import('@/stores/buffers');
        
        const editorStore = useEditorSplitStore.getState();
        const bufferStore = useBufferStore.getState();

        // Get all files that have been modified in this snapshot group
        const filesToRestore = new Set<string>();
        for (const snapshot of targetSnapshotGroup) {
          filesToRestore.add(snapshot.filePath);
        }

        // Step 1: Open all files in buffers first
        for (const filePath of filesToRestore) {
          try {
            await editorStore.openFile(filePath);
          } catch (error) {
            console.error(`Failed to open ${filePath}:`, error);
          }
        }

        // Step 2: Restore each file to its state in the target snapshot
        for (const snapshot of targetSnapshotGroup) {
          try {
            let contentToRestore: string;
            let shouldFileExist = true;

            // Determine what state the file should be in
            if (snapshot.status === 'pending') {
              // File should be in its next state (the change is applied)
              contentToRestore = snapshot.nextState;
              if (snapshot.operation === 'delete') {
                shouldFileExist = false;
              }
            } else if (snapshot.status === 'accepted') {
              // File should be in its next state (the change was accepted)
              contentToRestore = snapshot.nextState;
              if (snapshot.operation === 'delete') {
                shouldFileExist = false;
              }
            } else if (snapshot.status === 'reverted') {
              // File should be in its previous state (the change was reverted)
              contentToRestore = snapshot.prevState;
              if (snapshot.operation === 'create') {
                shouldFileExist = false;
              }
            } else {
              // Default to next state for any other status
              contentToRestore = snapshot.nextState;
            }

            if (!shouldFileExist) {
              // File should be deleted
              try {
                await window.projectApi.deleteFile(snapshot.filePath);
                const buffer = bufferStore.getBufferByPath(snapshot.filePath);
                if (buffer) {
                  bufferStore.closeBuffer(buffer.id);
                }
              } catch (error) {
                // File might not exist, that's okay
              }
            } else {
              // File should exist with specific content
              await window.projectApi.createFile(snapshot.filePath, contentToRestore);
              
              // Update buffer content
              const buffer = bufferStore.getBufferByPath(snapshot.filePath);
              if (buffer) {
                bufferStore.updateBufferContent(buffer.id, contentToRestore);
                await bufferStore.saveBuffer(buffer.id);
              }
            }
          } catch (error) {
            console.error(`Failed to restore ${snapshot.filePath}:`, error);
          }
        }
      },

      restoreToState: async (sessionId: string, targetMessageId: string, targetState: 'before' | 'after') => {
        const chat = get().snapshots.find(chat => chat.sessionId === sessionId);
        if (!chat) return;

        // Find the target snapshot group (by messageId)
        const targetSnapshotGroup = chat.snapshots.filter(s => s.messageId === targetMessageId);
        if (targetSnapshotGroup.length === 0) return;

        // Import stores dynamically to avoid circular imports
        const { useEditorSplitStore } = await import('@/stores/editor-splits');
        const { useBufferStore } = await import('@/stores/buffers');
        
        const editorStore = useEditorSplitStore.getState();
        const bufferStore = useBufferStore.getState();

        // Get all files that have been modified in this snapshot group
        const filesToRestore = new Set<string>();
        for (const snapshot of targetSnapshotGroup) {
          filesToRestore.add(snapshot.filePath);
        }

        // Step 1: Open all files in buffers first
        for (const filePath of filesToRestore) {
          try {
            await editorStore.openFile(filePath);
          } catch (error) {
            console.error(`Failed to open ${filePath}:`, error);
          }
        }

        // Step 2: Restore each file to the specified state
        for (const snapshot of targetSnapshotGroup) {
          try {
            let contentToRestore: string;
            let shouldFileExist = true;

            if (targetState === 'before') {
              // Restore to the state before this change
              contentToRestore = snapshot.prevState;
              if (snapshot.operation === 'create') {
                shouldFileExist = false; // File shouldn't exist before creation
              }
            } else {
              // Restore to the state after this change
              contentToRestore = snapshot.nextState;
              if (snapshot.operation === 'delete') {
                shouldFileExist = false; // File shouldn't exist after deletion
              }
            }

            if (!shouldFileExist) {
              // File should be deleted
              try {
                await window.projectApi.deleteFile(snapshot.filePath);
                const buffer = bufferStore.getBufferByPath(snapshot.filePath);
                if (buffer) {
                  bufferStore.closeBuffer(buffer.id);
                }
              } catch (error) {
                // File might not exist, that's okay
              }
            } else {
              // File should exist with specific content
              await window.projectApi.createFile(snapshot.filePath, contentToRestore);
              
              // Update buffer content
              const buffer = bufferStore.getBufferByPath(snapshot.filePath);
              if (buffer) {
                bufferStore.updateBufferContent(buffer.id, contentToRestore);
                await bufferStore.saveBuffer(buffer.id);
              }
            }
          } catch (error) {
            console.error(`Failed to restore ${snapshot.filePath}:`, error);
          }
        }
      },
    }),
    {
      name: 'chat-snapshots-storage',
      partialize: (state) => ({ snapshots: state.snapshots }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1 if needed
          return persistedState;
        }
        return persistedState;
      },
    }
  )
);
