import { ipcMain, Menu, MenuItem, BrowserWindow } from 'electron';
import { CONTEXT_MENU_SHOW_CHANNEL } from './context-menu-channels';
import { ContextMenuItem, ShowContextMenuOptions } from './context-menu-context';

function createNativeMenuFromItems(items: ContextMenuItem[], clickCallback: (id: string) => void): Menu {
  const menu = new Menu();
  
  items.forEach(item => {
    if (item.type === 'separator') {
      menu.append(new MenuItem({ type: 'separator' }));
    } else if (item.type === 'submenu' && item.submenu) {
      const submenu = createNativeMenuFromItems(item.submenu, clickCallback);
      menu.append(new MenuItem({
        label: item.label,
        type: 'submenu',
        submenu: submenu,
        enabled: item.enabled !== false,
        visible: item.visible !== false,
      }));
    } else {
      menu.append(new MenuItem({
        label: item.label,
        id: item.id,
        type: 'normal',
        enabled: item.enabled !== false,
        visible: item.visible !== false,
        accelerator: item.accelerator,
        click: () => {
          clickCallback(item.id);
        }
      }));
    }
  });
  
  return menu;
}

export function addContextMenuListeners() {
  ipcMain.handle(CONTEXT_MENU_SHOW_CHANNEL, async (event, options: ShowContextMenuOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      let resolved = false;
      
      const clickCallback = (id: string) => {
        if (!resolved) {
          resolved = true;
          resolve(id);
        }
      };

      const menu = createNativeMenuFromItems(options.items, clickCallback);
      const window = BrowserWindow.fromWebContents(event.sender);
      
      if (!window) {
        resolve(null);
        return;
      }

      // Show the context menu
      menu.popup({
        window: window,
        x: options.x,
        y: options.y,
        callback: () => {
          // If menu is dismissed without selection, resolve with null after a short delay
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve(null);
            }
          }, 10);
        }
      });
    });
  });
}
