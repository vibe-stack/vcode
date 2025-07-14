import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useBufferStore } from '@/stores/buffers';

export type SplitDirection = 'horizontal' | 'vertical';

export interface EditorPane {
  id: string;
  /** List of buffer IDs open in this pane */
  bufferIds: string[];
  /** Currently active buffer ID in this pane */
  activeBufferId: string | null;
}

export interface EditorSplit {
  id: string;
  type: 'split' | 'pane';
  direction?: SplitDirection;
  children?: EditorSplit[];
  pane?: EditorPane;
  /** Size ratio (0-1) for this split relative to its siblings */
  size?: number;
}

export interface DropZone {
  paneId: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  rect: DOMRect;
}

export interface EditorSplitState {
  /** Root split layout */
  rootSplit: EditorSplit;
  /** Currently active pane ID */
  activePaneId: string | null;
  /** Drag state */
  isDragging: boolean;
  draggedItem: {
    type: 'file' | 'tab';
    data: string; // file path or buffer ID
    sourcePaneId?: string;
  } | null;
  /** Available drop zones during drag */
  dropZones: DropZone[];
  /** Currently highlighted drop zone */
  activeDropZone: DropZone | null;

  // Actions
  /** Initialize with a single pane */
  initializeLayout: () => void;
  /** Open a file in the active pane or create a new one */
  openFile: (filePath: string, paneId?: string) => Promise<void>;
  /** Create a new split (horizontal or vertical) */
  createSplit: (paneId: string, direction: SplitDirection, newPaneId?: string) => string;
  /** Close a pane and merge its parent if needed */
  closePane: (paneId: string) => void;
  /** Set the active pane */
  setActivePane: (paneId: string) => void;
  /** Move a buffer from one pane to another */
  moveBuffer: (bufferId: string, fromPaneId: string, toPaneId: string) => void;
  /** Set active buffer for a pane */
  setActivePaneBuffer: (paneId: string, bufferId: string) => void;
  /** Close buffer in a pane */
  closeBufferInPane: (paneId: string, bufferId: string) => void;
  /** Get pane by ID */
  getPane: (paneId: string) => EditorPane | null;
  /** Get all panes */
  getAllPanes: () => EditorPane[];
  /** Find split containing a pane */
  findSplitContainingPane: (paneId: string) => EditorSplit | null;
  /** Update pane buffers */
  updatePaneBuffers: (paneId: string, bufferIds: string[]) => void;
  /** Check if a buffer is open in any pane other than the specified one */
  isBufferOpenInOtherPanes: (bufferId: string, excludePaneId?: string) => boolean;
  
  // Drag & Drop
  /** Start dragging a file or tab */
  startDrag: (type: 'file' | 'tab', data: string, sourcePaneId?: string) => void;
  /** End drag operation */
  endDrag: () => void;
  /** Update drop zones */
  updateDropZones: (zones: DropZone[]) => void;
  /** Set active drop zone */
  setActiveDropZone: (zone: DropZone | null) => void;
  /** Handle drop operation */
  handleDrop: (zone: DropZone) => Promise<void>;
}

const generateId = () => `pane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useEditorSplitStore = create<EditorSplitState>()(
  immer((set, get) => ({
    // Initial state
    rootSplit: {
      id: 'root',
      type: 'pane',
      pane: {
        id: 'main',
        bufferIds: [],
        activeBufferId: null,
      },
    },
    activePaneId: 'main',
    isDragging: false,
    draggedItem: null,
    dropZones: [],
    activeDropZone: null,

    // Initialize with a single pane
    initializeLayout: () => {
      const mainPaneId = generateId();
      set({
        rootSplit: {
          id: 'root',
          type: 'pane',
          pane: {
            id: mainPaneId,
            bufferIds: [],
            activeBufferId: null,
          },
        },
        activePaneId: mainPaneId,
      });
    },

    // Open a file in the specified pane or active pane
    openFile: async (filePath: string, paneId?: string) => {
      const { openFile } = useBufferStore.getState();
      const bufferId = await openFile(filePath);
      
      const state = get();
      const targetPaneId = paneId || state.activePaneId;
      
      if (!targetPaneId) {
        // No active pane, create one
        state.initializeLayout();
        const newState = get();
        newState.setActivePaneBuffer(newState.activePaneId!, bufferId);
        return;
      }

      const pane = state.getPane(targetPaneId);
      if (!pane) return;

      // Add buffer to pane if not already there
      if (!pane.bufferIds.includes(bufferId)) {
        state.updatePaneBuffers(targetPaneId, [...pane.bufferIds, bufferId]);
      }

      // Set as active buffer
      state.setActivePaneBuffer(targetPaneId, bufferId);
    },

    // Create a new split
    createSplit: (paneId: string, direction: SplitDirection, newPaneId?: string) => {
      const state = get();
      const newPaneIdActual = newPaneId || generateId();
      
      const findAndReplaceSplit = (split: EditorSplit): EditorSplit => {
        if (split.type === 'pane' && split.pane?.id === paneId) {
          // Replace this pane with a split containing the original pane and new pane
          return {
            id: generateId(),
            type: 'split',
            direction,
            children: [
              split, // Keep the original pane
              {
                id: generateId(),
                type: 'pane',
                pane: {
                  id: newPaneIdActual,
                  bufferIds: [],
                  activeBufferId: null,
                },
              },
            ],
          };
        }
        
        if (split.type === 'split' && split.children) {
          return {
            ...split,
            children: split.children.map(findAndReplaceSplit),
          };
        }
        
        return split;
      };

      const newRootSplit = findAndReplaceSplit(state.rootSplit);
      set({
        rootSplit: newRootSplit,
        activePaneId: newPaneIdActual,
      });
      
      return newPaneIdActual;
    },

    // Close a pane
    closePane: (paneId: string) => {
      const state = get();
      
      // Don't close the last pane
      const allPanes = state.getAllPanes();
      if (allPanes.length <= 1) return;

      const removePaneFromSplit = (split: EditorSplit): EditorSplit | null => {
        if (split.type === 'pane' && split.pane?.id === paneId) {
          return null; // Mark for removal
        }
        
        if (split.type === 'split' && split.children) {
          const newChildren = split.children
            .map(removePaneFromSplit)
            .filter(Boolean) as EditorSplit[];
          
          // If only one child left, promote it up
          if (newChildren.length === 1) {
            return newChildren[0];
          }
          
          // If no children left, mark for removal
          if (newChildren.length === 0) {
            return null;
          }
          
          return {
            ...split,
            children: newChildren,
          };
        }
        
        return split;
      };

      const newRootSplit = removePaneFromSplit(state.rootSplit);
      if (newRootSplit) {
        set({
          rootSplit: newRootSplit,
          activePaneId: state.activePaneId === paneId ? 
            state.getAllPanes().find(p => p.id !== paneId)?.id || null : 
            state.activePaneId,
        });
      }
    },

    // Set active pane
    setActivePane: (paneId: string) => {
      set({ activePaneId: paneId });
    },

    // Move buffer between panes
    moveBuffer: (bufferId: string, fromPaneId: string, toPaneId: string) => {
      const state = get();
      const fromPane = state.getPane(fromPaneId);
      const toPane = state.getPane(toPaneId);
      
      if (!fromPane || !toPane) return;

      // Remove from source pane
      const newFromBuffers = fromPane.bufferIds.filter(id => id !== bufferId);
      state.updatePaneBuffers(fromPaneId, newFromBuffers);

      // Add to target pane
      if (!toPane.bufferIds.includes(bufferId)) {
        state.updatePaneBuffers(toPaneId, [...toPane.bufferIds, bufferId]);
      }

      // Set as active in target pane
      state.setActivePaneBuffer(toPaneId, bufferId);
    },

    // Set active buffer for a pane
    setActivePaneBuffer: (paneId: string, bufferId: string) => {
      set((state) => {
        const updatePaneInSplit = (split: EditorSplit): EditorSplit => {
          if (split.type === 'pane' && split.pane?.id === paneId) {
            return {
              ...split,
              pane: {
                ...split.pane,
                activeBufferId: bufferId,
              },
            };
          }
          
          if (split.type === 'split' && split.children) {
            return {
              ...split,
              children: split.children.map(updatePaneInSplit),
            };
          }
          
          return split;
        };

        return {
          rootSplit: updatePaneInSplit(state.rootSplit),
          activePaneId: paneId,
        };
      });
    },

    // Close buffer in a pane
    closeBufferInPane: (paneId: string, bufferId: string) => {
      const state = get();
      const pane = state.getPane(paneId);
      if (!pane) return;

      const newBuffers = pane.bufferIds.filter(id => id !== bufferId);
      state.updatePaneBuffers(paneId, newBuffers);

      // If this was the active buffer, switch to another or null
      if (pane.activeBufferId === bufferId) {
        const newActiveId = newBuffers.length > 0 ? newBuffers[newBuffers.length - 1] : null;
        if (newActiveId) {
          state.setActivePaneBuffer(paneId, newActiveId);
        } else {
          // Clear the active buffer for this pane
          set((state) => {
            const updatePaneInSplit = (split: EditorSplit): EditorSplit => {
              if (split.type === 'pane' && split.pane?.id === paneId) {
                return {
                  ...split,
                  pane: {
                    ...split.pane,
                    activeBufferId: null,
                  },
                };
              }
              
              if (split.type === 'split' && split.children) {
                return {
                  ...split,
                  children: split.children.map(updatePaneInSplit),
                };
              }
              
              return split;
            };

            return {
              rootSplit: updatePaneInSplit(state.rootSplit),
            };
          });
        }
      }

      // Auto-close pane if it has no buffers left and there are other panes
      if (newBuffers.length === 0) {
        const allPanes = state.getAllPanes();
        if (allPanes.length > 1) {
          // Close the pane since it's empty and not the only pane
          state.closePane(paneId);
        }
      }
    },

    // Get pane by ID
    getPane: (paneId: string) => {
      const findPane = (split: EditorSplit): EditorPane | null => {
        if (split.type === 'pane' && split.pane?.id === paneId) {
          return split.pane;
        }
        
        if (split.type === 'split' && split.children) {
          for (const child of split.children) {
            const found = findPane(child);
            if (found) return found;
          }
        }
        
        return null;
      };

      return findPane(get().rootSplit);
    },

    // Get all panes
    getAllPanes: () => {
      const collectPanes = (split: EditorSplit): EditorPane[] => {
        if (split.type === 'pane' && split.pane) {
          return [split.pane];
        }
        
        if (split.type === 'split' && split.children) {
          return split.children.flatMap(collectPanes);
        }
        
        return [];
      };

      return collectPanes(get().rootSplit);
    },

    // Find split containing a pane
    findSplitContainingPane: (paneId: string) => {
      const findSplit = (split: EditorSplit): EditorSplit | null => {
        if (split.type === 'pane' && split.pane?.id === paneId) {
          return split;
        }
        
        if (split.type === 'split' && split.children) {
          for (const child of split.children) {
            const found = findSplit(child);
            if (found) return split; // Return the parent split
          }
        }
        
        return null;
      };

      return findSplit(get().rootSplit);
    },

    // Start drag operation
    startDrag: (type: 'file' | 'tab', data: string, sourcePaneId?: string) => {
      set({
        isDragging: true,
        draggedItem: { type, data, sourcePaneId },
      });
    },

    // End drag operation
    endDrag: () => {
      set({
        isDragging: false,
        draggedItem: null,
        dropZones: [],
        activeDropZone: null,
      });
    },

    // Update drop zones (only if different)
    updateDropZones: (zones: DropZone[]) => {
      const currentZones = get().dropZones;
      // Simple check to avoid unnecessary updates
      if (currentZones.length !== zones.length) {
        set({ dropZones: zones });
      }
    },

    // Set active drop zone (only if different)
    setActiveDropZone: (zone: DropZone | null) => {
      const currentZone = get().activeDropZone;
      // Compare zone IDs to avoid unnecessary updates
      const currentZoneId = currentZone ? `${currentZone.paneId}-${currentZone.position}` : null;
      const newZoneId = zone ? `${zone.paneId}-${zone.position}` : null;
      
      if (currentZoneId !== newZoneId) {
        set({ activeDropZone: zone });
      }
    },

    // Handle drop operation
    handleDrop: async (zone: DropZone) => {
      const state = get();
      const { draggedItem } = state;
      
      if (!draggedItem) return;

      try {
        if (draggedItem.type === 'file') {
          // Handle file drop
          if (zone.paneId === 'editor-root') {
            // Dropping into empty editor - initialize layout first
            state.initializeLayout();
            const newState = get();
            await newState.openFile(draggedItem.data, newState.activePaneId!);
          } else if (zone.position === 'center') {
            // Drop in existing pane
            await state.openFile(draggedItem.data, zone.paneId);
          } else {
            // Create new split
            const direction = zone.position === 'top' || zone.position === 'bottom' ? 'vertical' : 'horizontal';
            const newPaneId = state.createSplit(zone.paneId, direction);
            await state.openFile(draggedItem.data, newPaneId);
          }
        } else if (draggedItem.type === 'tab' && draggedItem.sourcePaneId) {
          // Handle tab drop
          if (zone.paneId === 'editor-root') {
            // This shouldn't happen for tabs, but handle it gracefully
            state.initializeLayout();
            const newState = get();
            newState.moveBuffer(draggedItem.data, draggedItem.sourcePaneId, newState.activePaneId!);
          } else if (zone.position === 'center') {
            // Move to existing pane
            state.moveBuffer(draggedItem.data, draggedItem.sourcePaneId, zone.paneId);
          } else {
            // Create new split and move buffer
            const direction = zone.position === 'top' || zone.position === 'bottom' ? 'vertical' : 'horizontal';
            const newPaneId = state.createSplit(zone.paneId, direction);
            state.moveBuffer(draggedItem.data, draggedItem.sourcePaneId, newPaneId);
          }
        }
      } finally {
        state.endDrag();
      }
    },

    // Helper method to update pane buffers
    updatePaneBuffers: (paneId: string, bufferIds: string[]) => {
      set((state) => {
        const updatePaneInSplit = (split: EditorSplit): EditorSplit => {
          if (split.type === 'pane' && split.pane?.id === paneId) {
            return {
              ...split,
              pane: {
                ...split.pane,
                bufferIds,
              },
            };
          }
          
          if (split.type === 'split' && split.children) {
            return {
              ...split,
              children: split.children.map(updatePaneInSplit),
            };
          }
          
          return split;
        };

        return {
          rootSplit: updatePaneInSplit(state.rootSplit),
        };
      });
    },

    // Check if a buffer is open in any pane other than the specified one
    isBufferOpenInOtherPanes: (bufferId: string, excludePaneId?: string) => {
      const state = get();
      const allPanes = state.getAllPanes();
      
      for (const pane of allPanes) {
        if (excludePaneId && pane.id === excludePaneId) {
          continue; // Skip the excluded pane
        }
        
        if (pane.bufferIds.includes(bufferId)) {
          return true;
        }
      }
      
      return false;
    },
  }))
);
