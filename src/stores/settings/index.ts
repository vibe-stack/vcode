import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Regular settings
  settings: {
    ai: {
      providers: {
        xai: {
          enabled: boolean;
          model: string;
        };
      };
    };
    editor: {
      fontSize: number;
      fontFamily: string;
      theme: string;
      tabSize: number;
      wordWrap: boolean;
    };
    theme: {
      currentTheme: string;
      autoSwitch: boolean;
      followSystem: boolean;
    };
    shortcuts: {
      enabled: boolean;
      profile: string;
    };
    general: {
      autoSave: boolean;
      confirmBeforeClose: boolean;
      startupBehavior: 'welcome' | 'lastProject' | 'empty';
    };
  };

  // Secure settings (API keys) - these are not stored in the frontend store
  secureSettings: {
    apiKeys: {
      xai?: string;
      openai?: string;
      anthropic?: string;
      [key: string]: string | undefined;
    };
  };

  // Actions
  initialize: () => Promise<void>;
  getSetting: <T = any>(key: string) => Promise<T | undefined>;
  setSetting: (key: string, value: any) => Promise<void>;
  getAllSettings: () => Promise<any>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (settingsJson: string) => Promise<void>;

  // Secure settings actions
  getSecureSetting: (key: string) => Promise<string | undefined>;
  setSecureSetting: (key: string, value: string) => Promise<void>;
  deleteSecureSetting: (key: string) => Promise<void>;
  listSecureKeys: () => Promise<string[]>;
  
  // Local state for secure settings (for UI display only)
  setSecureSettingLocal: (key: string, value: string) => void;
  removeSecureSettingLocal: (key: string) => void;

  // Theme helper methods
  setTheme: (theme: string) => Promise<void>;
  getTheme: () => string;
  setAutoSwitch: (enabled: boolean) => Promise<void>;
  setFollowSystem: (enabled: boolean) => Promise<void>;

  // Shortcuts helper methods
  setShortcutsEnabled: (enabled: boolean) => Promise<void>;
  setShortcutsProfile: (profile: string) => Promise<void>;
  getShortcutsProfile: () => string;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {
        ai: {
          providers: {
            xai: {
              enabled: true,
              model: "grok-4-0709",
            },
          },
        },
        editor: {
          fontSize: 14,
          fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
          theme: "dark",
          tabSize: 2,
          wordWrap: false,
        },
        theme: {
          currentTheme: 'vibes-dark',
          autoSwitch: false,
          followSystem: false
        },
        shortcuts: {
          enabled: true,
          profile: 'default'
        },
        general: {
          autoSave: true,
          confirmBeforeClose: true,
          startupBehavior: 'welcome',
        },
      },
      secureSettings: {
        apiKeys: {},
      },

      initialize: async () => {
        try {
          const settings = await window.settingsApi.getAll();
          set({ settings });
          
          // Load secure settings keys (values are not stored in frontend)
          const secureKeys = await window.settingsApi.listSecureKeys();
          const secureSettings = { apiKeys: {} as Record<string, string> };
          for (const key of secureKeys) {
            if (key.startsWith('apiKeys.')) {
              const provider = key.replace('apiKeys.', '');
              secureSettings.apiKeys[provider] = '***'; // Placeholder
            }
          }
          set({ secureSettings });
        } catch (error) {
          console.error('Failed to initialize settings:', error);
        }
      },

      getSetting: async <T = any>(key: string): Promise<T | undefined> => {
        try {
          const value = await window.settingsApi.get(key);
          return value;
        } catch (error) {
          console.error(`Failed to get setting ${key}:`, error);
          return undefined;
        }
      },

      setSetting: async (key: string, value: any) => {
        try {
          await window.settingsApi.set(key, value);
          
          // Update local state
          const { settings } = get();
          const keys = key.split('.');
          let current: any = settings;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current)) {
              current[k] = {};
            }
            current = current[k];
          }
          
          current[keys[keys.length - 1]] = value;
          set({ settings: { ...settings } });
        } catch (error) {
          console.error(`Failed to set setting ${key}:`, error);
          throw error;
        }
      },

      getAllSettings: async () => {
        try {
          const settings = await window.settingsApi.getAll();
          set({ settings });
          return settings;
        } catch (error) {
          console.error('Failed to get all settings:', error);
          throw error;
        }
      },

      resetSettings: async () => {
        try {
          await window.settingsApi.reset();
          const settings = await window.settingsApi.getAll();
          set({ settings });
        } catch (error) {
          console.error('Failed to reset settings:', error);
          throw error;
        }
      },

      exportSettings: async () => {
        try {
          return await window.settingsApi.export();
        } catch (error) {
          console.error('Failed to export settings:', error);
          throw error;
        }
      },

      importSettings: async (settingsJson: string) => {
        try {
          await window.settingsApi.import(settingsJson);
          const settings = await window.settingsApi.getAll();
          set({ settings });
        } catch (error) {
          console.error('Failed to import settings:', error);
          throw error;
        }
      },

      getSecureSetting: async (key: string) => {
        try {
          return await window.settingsApi.getSecure(key);
        } catch (error) {
          console.error(`Failed to get secure setting ${key}:`, error);
          return undefined;
        }
      },

      setSecureSetting: async (key: string, value: string) => {
        try {
          await window.settingsApi.setSecure(key, value);
          
          // Update local state for UI display
          const { secureSettings } = get();
          const keys = key.split('.');
          let current: any = secureSettings;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current)) {
              current[k] = {};
            }
            current = current[k];
          }
          
          current[keys[keys.length - 1]] = '***'; // Placeholder
          set({ secureSettings: { ...secureSettings } });
        } catch (error) {
          console.error(`Failed to set secure setting ${key}:`, error);
          throw error;
        }
      },

      deleteSecureSetting: async (key: string) => {
        try {
          await window.settingsApi.deleteSecure(key);
          
          // Update local state
          const { secureSettings } = get();
          const keys = key.split('.');
          let current: any = secureSettings;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current)) {
              return; // Key doesn't exist
            }
            current = current[k];
          }
          
          delete current[keys[keys.length - 1]];
          set({ secureSettings: { ...secureSettings } });
        } catch (error) {
          console.error(`Failed to delete secure setting ${key}:`, error);
          throw error;
        }
      },

      listSecureKeys: async () => {
        try {
          return await window.settingsApi.listSecureKeys();
        } catch (error) {
          console.error('Failed to list secure keys:', error);
          return [];
        }
      },

      setSecureSettingLocal: (key: string, value: string) => {
        const { secureSettings } = get();
        const keys = key.split('.');
        let current: any = secureSettings;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          if (!(k in current)) {
            current[k] = {};
          }
          current = current[k];
        }
        
        current[keys[keys.length - 1]] = value;
        set({ secureSettings: { ...secureSettings } });
      },

      removeSecureSettingLocal: (key: string) => {
        const { secureSettings } = get();
        const keys = key.split('.');
        let current: any = secureSettings;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          if (!(k in current)) {
            return; // Key doesn't exist
          }
          current = current[k];
        }
        
        delete current[keys[keys.length - 1]];
        set({ secureSettings: { ...secureSettings } });
      },

      // Theme helper methods
      setTheme: async (theme: string) => {
        await get().setSetting('theme.currentTheme', theme);
      },

      getTheme: () => {
        return get().settings.theme.currentTheme;
      },

      setAutoSwitch: async (enabled: boolean) => {
        await get().setSetting('theme.autoSwitch', enabled);
      },

      setFollowSystem: async (enabled: boolean) => {
        await get().setSetting('theme.followSystem', enabled);
      },

      // Shortcuts helper methods
      setShortcutsEnabled: async (enabled: boolean) => {
        await get().setSetting('shortcuts.enabled', enabled);
      },

      setShortcutsProfile: async (profile: string) => {
        await get().setSetting('shortcuts.profile', profile);
      },

      getShortcutsProfile: () => {
        return get().settings.shortcuts.profile;
      },
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({
        settings: state.settings,
        // Don't persist secure settings
      }),
    }
  )
);
