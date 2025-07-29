import { KeyBinding, KeymapProfile } from './types';
import { isMacOS } from './utils';

/**
 * Default key bindings that work across platforms
 */
export const createDefaultKeyBindings = (): KeyBinding[] => {
  const cmdKey = isMacOS() ? 'cmd' : 'ctrl';
  
  return [
    // File operations
    {
      id: 'file.new',
      description: 'Create new file',
      key: `${cmdKey}+n`,
      command: 'file.new',
      enabled: true,
      category: 'file',
      context: 'global'
    },
    {
      id: 'file.open',
      description: 'Open file',
      key: `${cmdKey}+o`,
      command: 'file.open',
      enabled: true,
      category: 'file',
      context: 'global'
    },
    {
      id: 'file.save',
      description: 'Save file',
      key: `${cmdKey}+s`,
      command: 'file.save',
      enabled: true,
      category: 'file',
      context: 'editor'
    },
    {
      id: 'file.saveAs',
      description: 'Save file as',
      key: `${cmdKey}+shift+s`,
      command: 'file.saveAs',
      enabled: true,
      category: 'file',
      context: 'editor'
    },
    {
      id: 'file.saveAll',
      description: 'Save all files',
      key: `${cmdKey}+${isMacOS() ? 'option' : 'alt'}+s`,
      command: 'file.saveAll',
      enabled: true,
      category: 'file',
      context: 'global'
    },
    {
      id: 'file.close',
      description: 'Close current tab',
      key: `${cmdKey}+w`,
      command: 'file.close',
      enabled: true,
      category: 'file',
      context: 'editor'
    },
    {
      id: 'file.closeAll',
      description: 'Close all tabs',
      key: `${cmdKey}+shift+w`,
      command: 'file.closeAll',
      enabled: true,
      category: 'file',
      context: 'global'
    },
    {
      id: 'file.closeOthers',
      description: 'Close other tabs',
      key: `${cmdKey}+${isMacOS() ? 'option' : 'alt'}+w`,
      command: 'file.closeOthers',
      enabled: true,
      category: 'file',
      context: 'editor'
    },
    
    // File Explorer operations
    {
      id: 'explorer.newFile',
      description: 'New file in explorer',
      key: `${cmdKey}+shift+n`,
      command: 'explorer.newFile',
      enabled: true,
      category: 'file',
      context: 'global'
    },
    {
      id: 'explorer.newFolder',
      description: 'New folder in explorer',
      key: `${cmdKey}+shift+${isMacOS() ? 'option' : 'alt'}+n`,
      command: 'explorer.newFolder',
      enabled: true,
      category: 'file',
      context: 'global'
    },
    
    // Edit operations
    {
      id: 'edit.undo',
      description: 'Undo',
      key: `${cmdKey}+z`,
      command: 'edit.undo',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.redo',
      description: 'Redo',
      key: `${cmdKey}+${isMacOS() ? 'shift+z' : 'y'}`,
      command: 'edit.redo',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.cut',
      description: 'Cut',
      key: `${cmdKey}+x`,
      command: 'edit.cut',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.copy',
      description: 'Copy',
      key: `${cmdKey}+c`,
      command: 'edit.copy',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.paste',
      description: 'Paste',
      key: `${cmdKey}+v`,
      command: 'edit.paste',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.selectAll',
      description: 'Select all',
      key: `${cmdKey}+a`,
      command: 'edit.selectAll',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.find',
      description: 'Find',
      key: `${cmdKey}+f`,
      command: 'edit.find',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.findReplace',
      description: 'Find and replace',
      key: `${cmdKey}+h`,
      command: 'edit.findReplace',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.findNext',
      description: 'Find next',
      key: isMacOS() ? 'cmd+g' : 'f3',
      command: 'edit.findNext',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'edit.findPrevious',
      description: 'Find previous',
      key: isMacOS() ? 'cmd+shift+g' : 'shift+f3',
      command: 'edit.findPrevious',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    
    // Navigation
    {
      id: 'nav.nextTab',
      description: 'Go to next tab',
      key: `${cmdKey}+${isMacOS() ? 'option' : 'alt'}+right`,
      altKeys: [`${cmdKey}+tab`],
      command: 'nav.nextTab',
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'nav.prevTab',
      description: 'Go to previous tab',
      key: `${cmdKey}+${isMacOS() ? 'option' : 'alt'}+left`,
      altKeys: [`${cmdKey}+shift+tab`],
      command: 'nav.prevTab',
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'nav.goToLine',
      description: 'Go to line',
      key: `${cmdKey}+g`,
      command: 'nav.goToLine',
      enabled: true,
      category: 'navigation',
      context: 'editor'
    },
    {
      id: 'nav.goToFile',
      description: 'Go to file',
      key: `${cmdKey}+p`,
      command: 'nav.goToFile',
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'nav.goToSymbol',
      description: 'Go to symbol',
      key: `${cmdKey}+shift+o`,
      command: 'nav.goToSymbol',
      enabled: true,
      category: 'navigation',
      context: 'editor'
    },
    
    // View operations
    {
      id: 'view.toggleSidebar',
      description: 'Toggle sidebar',
      key: `${cmdKey}+b`,
      command: 'view.toggleSidebar',
      enabled: true,
      category: 'view',
      context: 'global'
    },
    {
      id: 'view.toggleExplorer',
      description: 'Toggle explorer',
      key: `${cmdKey}+shift+e`,
      command: 'view.toggleExplorer',
      enabled: true,
      category: 'view',
      context: 'global'
    },
    {
      id: 'view.toggleTerminal',
      description: 'Toggle terminal',
      key: isMacOS() ? 'ctrl+`' : 'ctrl+`',
      command: 'terminal.toggle',
      enabled: true,
      category: 'view',
      context: 'global'
    },
    {
      id: 'terminal.new',
      description: 'New terminal',
      key: `${cmdKey}+shift+\``,
      command: 'terminal.new',
      enabled: true,
      category: 'terminal',
      context: 'global'
    },
    {
      id: 'terminal.kill',
      description: 'Kill terminal',
      key: `${cmdKey}+shift+k`,
      command: 'terminal.kill',
      enabled: true,
      category: 'terminal',
      context: 'terminal'
    },
    {
      id: 'terminal.split',
      description: 'Split terminal',
      key: `${cmdKey}+shift+5`,
      command: 'terminal.split',
      enabled: true,
      category: 'terminal',
      context: 'terminal'
    },
    {
      id: 'view.zoomIn',
      description: 'Zoom in',
      key: `${cmdKey}+plus`,
      altKeys: [`${cmdKey}+=`],
      command: 'view.zoomIn',
      enabled: true,
      category: 'view',
      context: 'global'
    },
    {
      id: 'view.zoomOut',
      description: 'Zoom out',
      key: `${cmdKey}+minus`,
      command: 'view.zoomOut',
      enabled: true,
      category: 'view',
      context: 'global'
    },
    {
      id: 'view.resetZoom',
      description: 'Reset zoom',
      key: `${cmdKey}+0`,
      command: 'view.resetZoom',
      enabled: true,
      category: 'view',
      context: 'global'
    },
    
    // Editor splitting
    {
      id: 'editor.splitRight',
      description: 'Split editor right',
      key: `${cmdKey}+\\`,
      command: 'editor.splitRight',
      enabled: true,
      category: 'view',
      context: 'editor'
    },
    {
      id: 'editor.splitDown',
      description: 'Split editor down',
      key: `${cmdKey}+shift+\\`,
      command: 'editor.splitDown',
      enabled: true,
      category: 'view',
      context: 'editor'
    },
    {
      id: 'editor.focusNext',
      description: 'Focus next editor',
      key: `${cmdKey}+k+${cmdKey}+right`,
      command: 'editor.focusNext',
      enabled: true,
      category: 'navigation',
      context: 'editor'
    },
    {
      id: 'editor.focusPrevious',
      description: 'Focus previous editor',
      key: `${cmdKey}+k+${cmdKey}+left`,
      command: 'editor.focusPrevious',
      enabled: true,
      category: 'navigation',
      context: 'editor'
    },
    
    // Quick actions
    {
      id: 'quick.commandPalette',
      description: 'Open command palette',
      key: `${cmdKey}+shift+p`,
      command: 'quick.commandPalette',
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'quick.quickOpen',
      description: 'Quick open',
      key: `${cmdKey}+e`,
      command: 'quick.quickOpen',
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    
    // Tab operations by number
    {
      id: 'tab.goTo1',
      description: 'Go to tab 1',
      key: `${cmdKey}+1`,
      command: 'tab.goTo',
      args: [1],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goTo2',
      description: 'Go to tab 2',
      key: `${cmdKey}+2`,
      command: 'tab.goTo',
      args: [2],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goTo3',
      description: 'Go to tab 3',
      key: `${cmdKey}+3`,
      command: 'tab.goTo',
      args: [3],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goTo4',
      description: 'Go to tab 4',
      key: `${cmdKey}+4`,
      command: 'tab.goTo',
      args: [4],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goTo5',
      description: 'Go to tab 5',
      key: `${cmdKey}+5`,
      command: 'tab.goTo',
      args: [5],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goTo6',
      description: 'Go to tab 6',
      key: `${cmdKey}+6`,
      command: 'tab.goTo',
      args: [6],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goTo7',
      description: 'Go to tab 7',
      key: `${cmdKey}+7`,
      command: 'tab.goTo',
      args: [7],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goTo8',
      description: 'Go to tab 8',
      key: `${cmdKey}+8`,
      command: 'tab.goTo',
      args: [8],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goTo9',
      description: 'Go to tab 9',
      key: `${cmdKey}+9`,
      command: 'tab.goTo',
      args: [9],
      enabled: true,
      category: 'navigation',
      context: 'global'
    },
    {
      id: 'tab.goToLast',
      description: 'Go to last tab',
      key: `${cmdKey}+0`,
      command: 'tab.goToLast',
      enabled: true,
      category: 'navigation',
      context: 'global'
    }
  ];
};

/**
 * Create the default keymap profile
 */
export const createDefaultProfile = (): KeymapProfile => {
  return {
    name: 'Default',
    description: 'Default key bindings for the editor',
    bindings: createDefaultKeyBindings(),
    isActive: true
  };
};

/**
 * Create a VSCode-like keymap profile
 */
export const createVSCodeProfile = (): KeymapProfile => {
  const defaultBindings = createDefaultKeyBindings();
  const cmdKey = isMacOS() ? 'cmd' : 'ctrl';
  
  // Add some VSCode-specific bindings
  const vscodeBindings: KeyBinding[] = [
    {
      id: 'vscode.duplicateLine',
      description: 'Duplicate line',
      key: `${cmdKey}+shift+d`,
      command: 'edit.duplicateLine',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'vscode.moveLinesUp',
      description: 'Move lines up',
      key: `${isMacOS() ? 'option' : 'alt'}+up`,
      command: 'edit.moveLinesUp',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'vscode.moveLinesDown',
      description: 'Move lines down',
      key: `${isMacOS() ? 'option' : 'alt'}+down`,
      command: 'edit.moveLinesDown',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'vscode.commentLine',
      description: 'Toggle line comment',
      key: `${cmdKey}+/`,
      command: 'edit.commentLine',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'vscode.commentBlock',
      description: 'Toggle block comment',
      key: `${cmdKey}+shift+a`,
      command: 'edit.commentBlock',
      enabled: true,
      category: 'edit',
      context: 'editor'
    },
    {
      id: 'vscode.formatDocument',
      description: 'Format document',
      key: `${cmdKey}+shift+i`,
      command: 'edit.formatDocument',
      enabled: true,
      category: 'edit',
      context: 'editor'
    }
  ];
  
  return {
    name: 'VSCode',
    description: 'VSCode-like key bindings',
    bindings: [...defaultBindings, ...vscodeBindings],
    isActive: false
  };
};

/**
 * Create a Vim-like keymap profile
 */
export const createVimProfile = (): KeymapProfile => {
  const vimBindings: KeyBinding[] = [
    {
      id: 'vim.normalMode',
      description: 'Enter normal mode',
      key: 'esc',
      command: 'vim.normalMode',
      enabled: true,
      category: 'navigation',
      context: 'editor'
    },
    {
      id: 'vim.insertMode',
      description: 'Enter insert mode',
      key: 'i',
      command: 'vim.insertMode',
      enabled: true,
      category: 'navigation',
      context: 'editor'
    },
    {
      id: 'vim.save',
      description: 'Save (vim style)',
      key: 'ctrl+s',
      command: 'file.save',
      enabled: true,
      category: 'file',
      context: 'editor'
    }
    // Add more vim bindings as needed
  ];
  
  return {
    name: 'Vim',
    description: 'Vim-like key bindings',
    bindings: vimBindings,
    isActive: false
  };
};

/**
 * Get all default profiles
 */
export const getDefaultProfiles = (): KeymapProfile[] => {
  return [
    createDefaultProfile(),
    createVSCodeProfile(),
    createVimProfile()
  ];
};
