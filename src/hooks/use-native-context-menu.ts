import { useCallback } from 'react';

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

export const useNativeContextMenu = () => {
  const showContextMenu = useCallback(async (options: ShowContextMenuOptions): Promise<string | null> => {
    if (typeof window !== 'undefined' && window.contextMenuApi) {
      return await window.contextMenuApi.show(options);
    }
    return null;
  }, []);

  return { showContextMenu };
};
