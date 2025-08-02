import { contextBridge, ipcRenderer } from 'electron';
import { CONTEXT_MENU_SHOW_CHANNEL } from './context-menu-channels';

export interface ContextMenuItem {
  id: string;
  label: string;
  type?: 'normal' | 'separator' | 'submenu';
  enabled?: boolean;
  visible?: boolean;
  accelerator?: string;
  submenu?: ContextMenuItem[];
}

export interface ShowContextMenuOptions {
  items: ContextMenuItem[];
  x?: number;
  y?: number;
}

export function exposeContextMenuContext() {
  contextBridge.exposeInMainWorld('contextMenuApi', {
    show: (options: ShowContextMenuOptions): Promise<string | null> =>
      ipcRenderer.invoke(CONTEXT_MENU_SHOW_CHANNEL, options),
  });
}
