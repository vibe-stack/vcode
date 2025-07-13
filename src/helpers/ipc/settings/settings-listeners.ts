import { ipcMain } from "electron";
import * as fs from "fs/promises";
import * as path from "path";
import { app } from "electron";
import {
  SETTINGS_GET_CHANNEL,
  SETTINGS_SET_CHANNEL,
  SETTINGS_GET_ALL_CHANNEL,
  SETTINGS_RESET_CHANNEL,
  SETTINGS_EXPORT_CHANNEL,
  SETTINGS_IMPORT_CHANNEL,
  SETTINGS_GET_SECURE_CHANNEL,
  SETTINGS_SET_SECURE_CHANNEL,
  SETTINGS_DELETE_SECURE_CHANNEL,
  SETTINGS_LIST_SECURE_KEYS_CHANNEL,
} from "./settings-channels";

interface AppSettings {
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
  general: {
    autoSave: boolean;
    confirmBeforeClose: boolean;
    startupBehavior: 'welcome' | 'lastProject' | 'empty';
  };
}

interface SecureSettings {
  apiKeys: {
    xai?: string;
    openai?: string;
    anthropic?: string;
    [key: string]: string | undefined;
  };
}

const defaultSettings: AppSettings = {
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
  general: {
    autoSave: true,
    confirmBeforeClose: true,
    startupBehavior: 'welcome',
  },
};

const defaultSecureSettings: SecureSettings = {
  apiKeys: {},
};

class SettingsManager {
  private settingsPath: string;
  private secureSettingsPath: string;
  private settings: AppSettings;
  private secureSettings: SecureSettings;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.secureSettingsPath = path.join(userDataPath, 'secure-settings.json');
    this.settings = { ...defaultSettings };
    this.secureSettings = { ...defaultSecureSettings };
  }

  async initialize() {
    await this.loadSettings();
    await this.loadSecureSettings();
  }

  private async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf8');
      this.settings = { ...defaultSettings, ...JSON.parse(data) };
    } catch (error) {
      // File doesn't exist or is corrupted, use defaults
      console.log('Settings file not found or corrupted, using defaults');
      await this.saveSettings();
    }
  }

  private async saveSettings() {
    try {
      await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  private async loadSecureSettings() {
    try {
      const data = await fs.readFile(this.secureSettingsPath, 'utf8');
      this.secureSettings = { ...defaultSecureSettings, ...JSON.parse(data) };
    } catch (error) {
      // File doesn't exist or is corrupted, use defaults
      console.log('Secure settings file not found or corrupted, using defaults');
      await this.saveSecureSettings();
    }
  }

  private async saveSecureSettings() {
    try {
      await fs.writeFile(this.secureSettingsPath, JSON.stringify(this.secureSettings, null, 2));
    } catch (error) {
      console.error('Failed to save secure settings:', error);
      throw new Error('Failed to save secure settings');
    }
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const keys = key.split('.');
    let current: any = this.settings;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  async set(key: string, value: any): Promise<void> {
    const keys = key.split('.');
    let current: any = this.settings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
    await this.saveSettings();
  }

  async getAll(): Promise<AppSettings> {
    return { ...this.settings };
  }

  async reset(): Promise<void> {
    this.settings = { ...defaultSettings };
    await this.saveSettings();
  }

  async export(): Promise<string> {
    return JSON.stringify(this.settings, null, 2);
  }

  async import(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson);
      this.settings = { ...defaultSettings, ...importedSettings };
      await this.saveSettings();
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }

  // Secure settings methods
  async getSecure(key: string): Promise<string | undefined> {
    const keys = key.split('.');
    let current: any = this.secureSettings;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  async setSecure(key: string, value: string): Promise<void> {
    const keys = key.split('.');
    let current: any = this.secureSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
    await this.saveSecureSettings();
  }

  async deleteSecure(key: string): Promise<void> {
    const keys = key.split('.');
    let current: any = this.secureSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        return; // Key doesn't exist
      }
      current = current[k];
    }
    
    delete current[keys[keys.length - 1]];
    await this.saveSecureSettings();
  }

  async listSecureKeys(): Promise<string[]> {
    const keys: string[] = [];
    
    const traverse = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          traverse(obj[key], fullKey);
        } else {
          keys.push(fullKey);
        }
      }
    };
    
    traverse(this.secureSettings);
    return keys;
  }
}

const settingsManager = new SettingsManager();

export function addSettingsEventListeners() {
  // Initialize settings manager
  settingsManager.initialize().catch(console.error);

  // Regular settings handlers
  ipcMain.handle(SETTINGS_GET_CHANNEL, async (_, key: string) => {
    return settingsManager.get(key);
  });

  ipcMain.handle(SETTINGS_SET_CHANNEL, async (_, key: string, value: any) => {
    await settingsManager.set(key, value);
    return true;
  });

  ipcMain.handle(SETTINGS_GET_ALL_CHANNEL, async () => {
    return settingsManager.getAll();
  });

  ipcMain.handle(SETTINGS_RESET_CHANNEL, async () => {
    await settingsManager.reset();
    return true;
  });

  ipcMain.handle(SETTINGS_EXPORT_CHANNEL, async () => {
    return settingsManager.export();
  });

  ipcMain.handle(SETTINGS_IMPORT_CHANNEL, async (_, settingsJson: string) => {
    await settingsManager.import(settingsJson);
    return true;
  });

  // Secure settings handlers
  ipcMain.handle(SETTINGS_GET_SECURE_CHANNEL, async (_, key: string) => {
    return settingsManager.getSecure(key);
  });

  ipcMain.handle(SETTINGS_SET_SECURE_CHANNEL, async (_, key: string, value: string) => {
    await settingsManager.setSecure(key, value);
    return true;
  });

  ipcMain.handle(SETTINGS_DELETE_SECURE_CHANNEL, async (_, key: string) => {
    await settingsManager.deleteSecure(key);
    return true;
  });

  ipcMain.handle(SETTINGS_LIST_SECURE_KEYS_CHANNEL, async () => {
    return settingsManager.listSecureKeys();
  });
}

export { settingsManager };
