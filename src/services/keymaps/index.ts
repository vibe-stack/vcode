import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { KeyBinding, KeymapProfile, KeymapState, KeyCommand, KeyEventInfo } from './types';
import { getDefaultProfiles } from './profiles';
import { registerDefaultCommands } from './commands';
import { keyEventToString, matchesKeyCombination, isValidKeyCombination } from './utils';

export const useKeymapStore = create<KeymapState>()(
  immer((set, get) => ({
    profiles: getDefaultProfiles(),
    activeProfile: 'Default',
    commands: registerDefaultCommands(),
    enabled: true,

    registerCommand: (id: string, command: KeyCommand) => {
      set((state) => {
        state.commands.set(id, command);
      });
    },

    unregisterCommand: (id: string) => {
      set((state) => {
        state.commands.delete(id);
      });
    },

    addKeyBinding: (binding: KeyBinding) => {
      if (!isValidKeyCombination(binding.key)) {
        console.warn(`Invalid key combination: ${binding.key}`);
        return;
      }

      set((state) => {
        const activeProfile = state.profiles.find(p => p.name === state.activeProfile);
        if (activeProfile) {
          // Remove any existing binding with the same key combination
          activeProfile.bindings = activeProfile.bindings.filter(
            b => !matchesKeyCombination(b.key, binding.key)
          );
          activeProfile.bindings.push(binding);
        }
      });
    },

    removeKeyBinding: (id: string) => {
      set((state) => {
        const activeProfile = state.profiles.find(p => p.name === state.activeProfile);
        if (activeProfile) {
          activeProfile.bindings = activeProfile.bindings.filter(b => b.id !== id);
        }
      });
    },

    updateKeyBinding: (id: string, binding: Partial<KeyBinding>) => {
      set((state) => {
        const activeProfile = state.profiles.find(p => p.name === state.activeProfile);
        if (activeProfile) {
          const existingBinding = activeProfile.bindings.find(b => b.id === id);
          if (existingBinding) {
            Object.assign(existingBinding, binding);
          }
        }
      });
    },

    setActiveProfile: (profileName: string) => {
      set((state) => {
        // Mark all profiles as inactive
        state.profiles.forEach(p => p.isActive = false);
        
        // Mark the target profile as active
        const targetProfile = state.profiles.find(p => p.name === profileName);
        if (targetProfile) {
          targetProfile.isActive = true;
          state.activeProfile = profileName;
        }
      });
    },

    handleKeyEvent: (event: KeyboardEvent): boolean => {
      const state = get();
      
      if (!state.enabled) return false;

      const keyCombination = keyEventToString(event);
      const binding = state.getKeyBinding(keyCombination);
      
      if (!binding || !binding.enabled) return false;

      // Check context
      const context = getEventContext(event);
      if (binding.context && binding.context !== 'global' && binding.context !== context) {
        return false;
      }

      // Get the command
      const command = state.commands.get(binding.command);
      if (!command) {
        console.warn(`Command not found: ${binding.command}`);
        return false;
      }

      // Check if command can be executed
      if (command.canExecute && !command.canExecute()) {
        return false;
      }

      // Execute the command
      try {
        const result = command.execute(binding.args);
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Error executing command ${binding.command}:`, error);
          });
        }
        
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();
        return true;
      } catch (error) {
        console.error(`Error executing command ${binding.command}:`, error);
        return false;
      }
    },

    getKeyBinding: (key: string): KeyBinding | null => {
      const state = get();
      const activeProfile = state.profiles.find(p => p.name === state.activeProfile);
      if (!activeProfile) return null;

      // Find exact match first
      let binding = activeProfile.bindings.find(b => 
        b.enabled && matchesKeyCombination(b.key, key)
      );

      // If no exact match, try alternative keys
      if (!binding) {
        binding = activeProfile.bindings.find(b => 
          b.enabled && b.altKeys?.some(altKey => matchesKeyCombination(altKey, key))
        );
      }

      return binding || null;
    },

    loadProfile: (profile: KeymapProfile) => {
      set((state) => {
        const existingIndex = state.profiles.findIndex(p => p.name === profile.name);
        if (existingIndex >= 0) {
          state.profiles[existingIndex] = profile;
        } else {
          state.profiles.push(profile);
        }
      });
    },

    saveProfile: () => {
      const state = get();
      const activeProfile = state.profiles.find(p => p.name === state.activeProfile);
      if (activeProfile) {
        // Save to localStorage or your preferred storage
        localStorage.setItem(`keymap_profile_${activeProfile.name}`, JSON.stringify(activeProfile));
      }
    },

    resetToDefault: () => {
      set((state) => {
        state.profiles = getDefaultProfiles();
        state.activeProfile = 'Default';
      });
    }
  }))
);

/**
 * Get the context for a keyboard event
 */
function getEventContext(event: KeyboardEvent): string {
  const target = event.target as HTMLElement;
  
  if (target.closest('[data-context="terminal"]')) {
    return 'terminal';
  }
  
  if (target.closest('[data-context="explorer"]')) {
    return 'explorer';
  }
  
  if (target.closest('[data-context="editor"]')) {
    return 'editor';
  }
  
  return 'global';
}

/**
 * Hook to get keymap store functions
 */
export const useKeymap = () => {
  const store = useKeymapStore();
  
  return {
    ...store,
    // Helper functions
    getActiveProfile: () => store.profiles.find(p => p.name === store.activeProfile),
    getKeyBindingsByCategory: (category: KeyBinding['category']) => {
      const activeProfile = store.profiles.find(p => p.name === store.activeProfile);
      return activeProfile?.bindings.filter(b => b.category === category) || [];
    },
    getKeyBindingsByContext: (context: KeyBinding['context']) => {
      const activeProfile = store.profiles.find(p => p.name === store.activeProfile);
      return activeProfile?.bindings.filter(b => b.context === context) || [];
    },
    searchKeyBindings: (query: string) => {
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
