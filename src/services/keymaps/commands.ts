import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { useTerminalStore } from '@/stores/terminal';
import { useProjectStore } from '@/stores/project';
import { bufferCloseService } from '@/services/buffer-close';
import { KeyCommand } from './types';

/**
 * Register all default commands for the editor
 */
export const registerDefaultCommands = (): Map<string, KeyCommand> => {
  const commands = new Map<string, KeyCommand>();
  
  // File operations
  commands.set('file.new', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      const bufferId = bufferStore.createBuffer('Untitled');
      bufferStore.setActiveBuffer(bufferId);
    },
    canExecute: () => true
  });
  
  commands.set('file.open', {
    execute: async () => {
      // This would typically open a file dialog
      console.log('Opening file dialog...');
      // For now, just log - you'd integrate with your file system API
    },
    canExecute: () => true
  });
  
  commands.set('file.save', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      const activeBuffer = bufferStore.activeBufferId;
      if (activeBuffer) {
        await bufferStore.saveBuffer(activeBuffer);
      }
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('file.saveAs', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      const activeBuffer = bufferStore.activeBufferId;
      if (activeBuffer) {
        // This would typically open a save dialog
        console.log('Opening save as dialog...');
      }
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('file.saveAll', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      const promises = Array.from(bufferStore.buffers.values())
        .filter(buffer => buffer.isDirty)
        .map(buffer => bufferStore.saveBuffer(buffer.id));
      await Promise.all(promises);
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return Array.from(bufferStore.buffers.values()).some(buffer => buffer.isDirty);
    }
  });
  
  commands.set('file.close', {
    execute: async () => {
      await bufferCloseService.closeActiveBuffer();
    },
    canExecute: () => {
      // Always allow execution to prevent browser default behavior
      return true;
    }
  });
  
  commands.set('file.closeAll', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      await bufferStore.closeAllBuffers();
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.tabOrder.length > 0;
    }
  });
  
  commands.set('file.closeOthers', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      const activeBuffer = bufferStore.activeBufferId;
      if (activeBuffer) {
        await bufferStore.closeOtherBuffers(activeBuffer);
      }
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.tabOrder.length > 1;
    }
  });
  
  // Navigation commands
  commands.set('nav.nextTab', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      const { tabOrder, activeBufferId } = bufferStore;
      if (tabOrder.length > 1) {
        const currentIndex = activeBufferId ? tabOrder.indexOf(activeBufferId) : -1;
        const nextIndex = (currentIndex + 1) % tabOrder.length;
        bufferStore.setActiveBuffer(tabOrder[nextIndex]);
      }
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.tabOrder.length > 1;
    }
  });
  
  commands.set('nav.prevTab', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      const { tabOrder, activeBufferId } = bufferStore;
      if (tabOrder.length > 1) {
        const currentIndex = activeBufferId ? tabOrder.indexOf(activeBufferId) : -1;
        const prevIndex = currentIndex <= 0 ? tabOrder.length - 1 : currentIndex - 1;
        bufferStore.setActiveBuffer(tabOrder[prevIndex]);
      }
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.tabOrder.length > 1;
    }
  });
  
  commands.set('nav.goToLine', {
    execute: async () => {
      // This would typically open a go-to-line dialog
      console.log('Opening go to line dialog...');
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('nav.goToFile', {
    execute: async () => {
      // This would typically open a quick open dialog
      console.log('Opening quick open dialog...');
    },
    canExecute: () => true
  });
  
  commands.set('nav.goToSymbol', {
    execute: async () => {
      // This would typically open a symbol search dialog
      console.log('Opening symbol search dialog...');
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  // Tab operations by number
  commands.set('tab.goTo', {
    execute: async (args?: any[]) => {
      const tabNumber = args?.[0] as number;
      if (tabNumber && tabNumber > 0) {
        const bufferStore = useBufferStore.getState();
        const { tabOrder } = bufferStore;
        if (tabNumber <= tabOrder.length) {
          bufferStore.setActiveBuffer(tabOrder[tabNumber - 1]);
        }
      }
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.tabOrder.length > 0;
    }
  });
  
  commands.set('tab.goToLast', {
    execute: async () => {
      const bufferStore = useBufferStore.getState();
      const { tabOrder } = bufferStore;
      if (tabOrder.length > 0) {
        bufferStore.setActiveBuffer(tabOrder[tabOrder.length - 1]);
      }
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.tabOrder.length > 0;
    }
  });
  
  // Editor splitting commands
  commands.set('editor.splitRight', {
    execute: async () => {
      const splitStore = useEditorSplitStore.getState();
      const activePane = splitStore.activePaneId;
      if (activePane) {
        splitStore.createSplit(activePane, 'horizontal');
      }
    },
    canExecute: () => {
      const splitStore = useEditorSplitStore.getState();
      return splitStore.activePaneId !== null;
    }
  });
  
  commands.set('editor.splitDown', {
    execute: async () => {
      const splitStore = useEditorSplitStore.getState();
      const activePane = splitStore.activePaneId;
      if (activePane) {
        splitStore.createSplit(activePane, 'vertical');
      }
    },
    canExecute: () => {
      const splitStore = useEditorSplitStore.getState();
      return splitStore.activePaneId !== null;
    }
  });
  
  // View commands
  commands.set('view.toggleSidebar', {
    execute: async () => {
      console.log('Toggling sidebar...');
      // You would implement this based on your layout system
    },
    canExecute: () => true
  });
  
  commands.set('view.toggleExplorer', {
    execute: async () => {
      console.log('Toggling explorer...');
      // You would implement this based on your layout system
    },
    canExecute: () => true
  });
  
  commands.set('view.toggleTerminal', {
    execute: async () => {
      console.log('Toggling terminal...');
      // You would implement this based on your layout system
    },
    canExecute: () => true
  });
  
  commands.set('view.zoomIn', {
    execute: async () => {
      console.log('Zooming in...');
      // You would implement zoom functionality
    },
    canExecute: () => true
  });
  
  commands.set('view.zoomOut', {
    execute: async () => {
      console.log('Zooming out...');
      // You would implement zoom functionality
    },
    canExecute: () => true
  });
  
  commands.set('view.resetZoom', {
    execute: async () => {
      console.log('Resetting zoom...');
      // You would implement zoom functionality
    },
    canExecute: () => true
  });
  
  // Edit commands (these would typically integrate with your editor component)
  commands.set('edit.undo', {
    execute: async () => {
      console.log('Undo...');
      // You would implement undo functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.redo', {
    execute: async () => {
      console.log('Redo...');
      // You would implement redo functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.cut', {
    execute: async () => {
      console.log('Cut...');
      // You would implement cut functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.copy', {
    execute: async () => {
      console.log('Copy...');
      // You would implement copy functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.paste', {
    execute: async () => {
      console.log('Paste...');
      // You would implement paste functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.selectAll', {
    execute: async () => {
      console.log('Select all...');
      // You would implement select all functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.find', {
    execute: async () => {
      console.log('Find...');
      // You would implement find functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.findReplace', {
    execute: async () => {
      console.log('Find and replace...');
      // You would implement find and replace functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.findNext', {
    execute: async () => {
      console.log('Find next...');
      // You would implement find next functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  commands.set('edit.findPrevious', {
    execute: async () => {
      console.log('Find previous...');
      // You would implement find previous functionality
    },
    canExecute: () => {
      const bufferStore = useBufferStore.getState();
      return bufferStore.activeBufferId !== null;
    }
  });
  
  // Quick commands
  commands.set('quick.commandPalette', {
    execute: async () => {
      console.log('Opening command palette...');
      // You would implement command palette functionality
    },
    canExecute: () => true
  });
  
  commands.set('quick.quickOpen', {
    execute: async () => {
      console.log('Opening quick open...');
      // You would implement quick open functionality
    },
    canExecute: () => true
  });

  // Terminal commands
  commands.set('terminal.toggle', {
    execute: async () => {
      const terminalStore = useTerminalStore.getState();
      const projectStore = useProjectStore.getState();
      
      if (!terminalStore.isVisible) {
        // If terminal is not visible and we're about to show it, check if we have any terminals
        if (terminalStore.tabs.length === 0) {
          // No terminals exist, create one automatically
          try {
            const terminalInfo = await window.terminalApi.create({
              title: 'Terminal 1',
              cwd: projectStore.currentProject || undefined
            });
            terminalStore.createTab(terminalInfo);
          } catch (error) {
            console.error('Failed to create default terminal:', error);
            // Still show the terminal UI even if creation fails
            terminalStore.setVisible(true);
          }
        } else {
          // Terminals exist, just show the panel
          terminalStore.setVisible(true);
        }
      } else {
        // Hide the terminal
        terminalStore.setVisible(false);
      }
    },
    canExecute: () => true
  });

  commands.set('terminal.new', {
    execute: async () => {
      const terminalStore = useTerminalStore.getState();
      const projectStore = useProjectStore.getState();
      try {
        const terminalInfo = await window.terminalApi.create({
          title: `Terminal ${terminalStore.tabs.length + 1}`,
          cwd: projectStore.currentProject || undefined
        });
        terminalStore.createTab(terminalInfo);
      } catch (error) {
        console.error('Failed to create terminal:', error);
      }
    },
    canExecute: () => !!(typeof window !== 'undefined' && window.terminalApi)
  });

  commands.set('terminal.kill', {
    execute: async () => {
      const terminalStore = useTerminalStore.getState();
      if (terminalStore.activeTabId) {
        try {
          const activeTab = terminalStore.getActiveTab();
          
          // Kill the main terminal process
          await window.terminalApi.kill(terminalStore.activeTabId);
          
          // Kill all split terminal processes
          if (activeTab) {
            const tabSplits = terminalStore.getTabSplits(activeTab.id);
            for (const split of tabSplits) {
              try {
                await window.terminalApi.kill(split.terminalId);
              } catch (error) {
                console.error('Failed to kill split terminal:', split.terminalId, error);
              }
            }
          }
          
          terminalStore.removeTab(terminalStore.activeTabId);
        } catch (error) {
          console.error('Failed to kill terminal:', error);
        }
      }
    },
    canExecute: () => {
      const terminalStore = useTerminalStore.getState();
      return !!(terminalStore.activeTabId && typeof window !== 'undefined' && window.terminalApi);
    }
  });

  commands.set('terminal.split', {
    execute: async () => {
      const terminalStore = useTerminalStore.getState();
      const projectStore = useProjectStore.getState();
      if (terminalStore.activeTabId) {
        try {
          const activeTab = terminalStore.getActiveTab();
          const currentSplits = activeTab ? terminalStore.getTabSplits(activeTab.id) : [];
          
          const terminalInfo = await window.terminalApi.create({
            title: `Split ${currentSplits.length + 1}`,
            cwd: projectStore.currentProject || undefined
          });
          terminalStore.createSplit(terminalStore.activeTabId, terminalInfo);
        } catch (error) {
          console.error('Failed to create split:', error);
        }
      }
    },
    canExecute: () => {
      const terminalStore = useTerminalStore.getState();
      return !!(terminalStore.activeTabId && typeof window !== 'undefined' && window.terminalApi);
    }
  });

  // File Explorer commands
  commands.set('explorer.newFile', {
    execute: async () => {
      // Dispatch an event that the file explorer can listen to
      window.dispatchEvent(new CustomEvent('explorer:createFile'));
    },
    canExecute: () => {
      const projectStore = useProjectStore.getState();
      return !!projectStore.currentProject;
    }
  });

  commands.set('explorer.newFolder', {
    execute: async () => {
      // Dispatch an event that the file explorer can listen to
      window.dispatchEvent(new CustomEvent('explorer:createFolder'));
    },
    canExecute: () => {
      const projectStore = useProjectStore.getState();
      return !!projectStore.currentProject;
    }
  });
  
  return commands;
};
