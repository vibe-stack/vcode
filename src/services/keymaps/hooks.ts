import { useEffect, useRef, useCallback } from 'react';
import { useKeymapStore } from './index';

/**
 * Hook to handle keyboard events in a component
 */
export const useKeyboardHandler = (
  targetRef?: React.RefObject<HTMLElement | null>,
  context?: 'editor' | 'global' | 'explorer' | 'terminal'
) => {
  const { handleKeyEvent, enabled } = useKeymapStore();
  const handlerRef = useRef<(event: Event) => void>(null!);

  // Create a stable handler function
  const handleKeyDown = useCallback((event: Event) => {
    if (!enabled) return;

    const keyboardEvent = event as KeyboardEvent;

    // Set context on the target element if provided
    if (context && targetRef?.current) {
      targetRef.current.setAttribute('data-context', context);
    }

    // For global context, handle all events
    // For specific contexts, only handle events from target or children
    if (context !== 'global' && targetRef?.current && !targetRef.current.contains(keyboardEvent.target as Node)) {
      return;
    }

    // Always handle Cmd+W / Ctrl+W to prevent browser closure
    const key = keyboardEvent.key.toLowerCase();
    const isCloseShortcut = (keyboardEvent.metaKey || keyboardEvent.ctrlKey) && key === 'w';
    
    if (isCloseShortcut) {
      // Always prevent default for Cmd+W / Ctrl+W
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
    }

    handleKeyEvent(keyboardEvent);
  }, [handleKeyEvent, enabled, context, targetRef]);

  // Store the handler reference for cleanup
  handlerRef.current = handleKeyDown;

  useEffect(() => {
    const element = targetRef?.current || document;
    const handler = handlerRef.current;

    if (handler) {
      element.addEventListener('keydown', handler);
      return () => element.removeEventListener('keydown', handler);
    }
  }, [targetRef, handleKeyDown]);

  return { handleKeyDown };
};

/**
 * Hook to get formatted key bindings for display
 */
export const useFormattedKeyBindings = () => {
  const store = useKeymapStore();
  
  return {
    getAllBindings: () => {
      const activeProfile = store.profiles.find(p => p.name === store.activeProfile);
      return activeProfile?.bindings || [];
    },
    
    getBindingsByCategory: (category: string) => {
      const activeProfile = store.profiles.find(p => p.name === store.activeProfile);
      return activeProfile?.bindings.filter(b => b.category === category) || [];
    },
    
    searchBindings: (query: string) => {
      const activeProfile = store.profiles.find(p => p.name === store.activeProfile);
      if (!activeProfile) return [];
      
      const lowerQuery = query.toLowerCase();
      return activeProfile.bindings.filter(b => 
        b.description.toLowerCase().includes(lowerQuery) ||
        b.command.toLowerCase().includes(lowerQuery) ||
        b.key.toLowerCase().includes(lowerQuery)
      );
    }
  };
};

/**
 * Hook to manage keymap profiles
 */
export const useKeymapProfiles = () => {
  const store = useKeymapStore();
  
  return {
    profiles: store.profiles,
    activeProfile: store.activeProfile,
    setActiveProfile: store.setActiveProfile,
    loadProfile: store.loadProfile,
    saveProfile: store.saveProfile,
    resetToDefault: store.resetToDefault
  };
};

/**
 * Hook to manage individual key bindings
 */
export const useKeyBindingManager = () => {
  const store = useKeymapStore();
  
  return {
    addKeyBinding: store.addKeyBinding,
    removeKeyBinding: store.removeKeyBinding,
    updateKeyBinding: store.updateKeyBinding,
    getKeyBinding: store.getKeyBinding
  };
};

/**
 * Hook to manage commands
 */
export const useCommandManager = () => {
  const store = useKeymapStore();
  
  return {
    registerCommand: store.registerCommand,
    unregisterCommand: store.unregisterCommand,
    commands: store.commands,
    executeCommand: (commandId: string, args?: any[]) => {
      const command = store.commands.get(commandId);
      if (command && (!command.canExecute || command.canExecute())) {
        return command.execute(args);
      }
      return Promise.resolve();
    }
  };
};
