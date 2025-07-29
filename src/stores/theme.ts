import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as monaco from 'monaco-editor';
import { registerDarkMatrixTheme } from '@/themes/dark-matrix-monaco';
import { registerVibesLightTheme } from '@/themes/vibes-light-monaco';
import { registerDuneTheme } from '@/themes/dune-monaco';
import { registerDarkSummerNightTheme } from '@/themes/dark-summer-night-monaco';

// Note: We'll import the settings store dynamically to avoid circular dependencies

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  type: 'dark' | 'light';
  uiTheme: 'dark' | 'light';
  monacoTheme: string;
  cssVariables: Record<string, string>;
}

export interface ThemeState {
  currentTheme: string;
  customThemes: ThemePreset[];
  presets: ThemePreset[];
  
  // Actions
  setTheme: (themeId: string) => void;
  registerCustomTheme: (theme: ThemePreset) => void;
  removeCustomTheme: (themeId: string) => void;
  getTheme: (themeId: string) => ThemePreset | undefined;
  initializeThemes: () => void;
  applyTheme: (theme: ThemePreset) => void;
}

const defaultPresets: ThemePreset[] = [
  {
    id: 'vibes-dark',
    name: 'Vibes Dark',
    description: 'The default dark theme with subtle matrix-inspired colors',
    type: 'dark',
    uiTheme: 'dark',
    monacoTheme: 'dark-matrix',
    cssVariables: {
      '--background': 'oklch(0 0 0)',
      '--foreground': 'oklch(1 0 0)',
      '--card': 'oklch(0.1400 0 0)',
      '--card-foreground': 'oklch(1 0 0)',
      '--popover': 'oklch(0.1800 0 0)',
      '--popover-foreground': 'oklch(1 0 0)',
      '--primary': 'oklch(0.9700 0.0501 146.9587)',
      '--primary-foreground': 'oklch(0.1000 0 0)',
      '--secondary': 'oklch(0.2000 0 0)',
      '--secondary-foreground': 'oklch(0.9000 0 0)',
      '--muted': 'oklch(0.2000 0 0)',
      '--muted-foreground': 'oklch(0.6500 0 0)',
      '--accent': 'oklch(0.2400 0 0)',
      '--accent-foreground': 'oklch(0.9500 0 0)',
      '--destructive': 'oklch(0.6274 0.1900 27.3300)',
      '--destructive-foreground': 'oklch(0.9800 0 0)',
      '--border': 'oklch(0.3000 0 0)',
      '--input': 'oklch(0.3000 0 0)',
      '--ring': 'oklch(0.9700 0.0501 146.9587)',
      // Scrollbar styling
      '--scrollbar-track': 'oklch(0.1400 0 0)',
      '--scrollbar-thumb': 'oklch(0.3000 0 0)',
      '--scrollbar-thumb-hover': 'oklch(0.4000 0 0)',
    }
  },
  {
    id: 'vibes-light',
    name: 'Vibes Light',
    description: 'Clean and minimal light theme',
    type: 'light',
    uiTheme: 'light',
    monacoTheme: 'vibes-light',
    cssVariables: {
      '--background': 'oklch(1 0 0)',
      '--foreground': 'oklch(0.2000 0 0)',
      '--card': 'oklch(1 0 0)',
      '--card-foreground': 'oklch(0.2000 0 0)',
      '--popover': 'oklch(1 0 0)',
      '--popover-foreground': 'oklch(0.2000 0 0)',
      '--primary': 'oklch(0.5020 0.1274 263.0800)',
      '--primary-foreground': 'oklch(0.9800 0 0)',
      '--secondary': 'oklch(0.9600 0 0)',
      '--secondary-foreground': 'oklch(0.2000 0 0)',
      '--muted': 'oklch(0.9600 0 0)',
      '--muted-foreground': 'oklch(0.4500 0 0)',
      '--accent': 'oklch(0.9600 0 0)',
      '--accent-foreground': 'oklch(0.2000 0 0)',
      '--destructive': 'oklch(0.5537 0.2370 27.7700)',
      '--destructive-foreground': 'oklch(0.9800 0 0)',
      '--border': 'oklch(0.9000 0 0)',
      '--input': 'oklch(0.9000 0 0)',
      '--ring': 'oklch(0.5020 0.1274 263.0800)',
      // Scrollbar styling
      '--scrollbar-track': 'oklch(0.9600 0 0)',
      '--scrollbar-thumb': 'oklch(0.8000 0 0)',
      '--scrollbar-thumb-hover': 'oklch(0.7000 0 0)',
    }
  },
  {
    id: 'dune',
    name: 'Dune',
    description: 'Zen warm desert-inspired theme with sandy tranquil colors',
    type: 'light',
    uiTheme: 'light',
    monacoTheme: 'dune',
    cssVariables: {
      '--background': 'oklch(0.9200 0.0300 70.0000)',
      '--foreground': 'oklch(0.2800 0.0500 55.0000)',
      '--card': 'oklch(0.9200 0.0300 70.0000)',
      '--card-foreground': 'oklch(0.2800 0.0500 55.0000)',
      '--popover': 'oklch(0.9200 0.0300 70.0000)',
      '--popover-foreground': 'oklch(0.2800 0.0500 55.0000)',
      '--primary': 'oklch(0.5500 0.1200 65.0000)',
      '--primary-foreground': 'oklch(0.9500 0.0200 70.0000)',
      '--secondary': 'oklch(0.8800 0.0350 68.0000)',
      '--secondary-foreground': 'oklch(0.3200 0.0500 55.0000)',
      '--muted': 'oklch(0.8800 0.0350 68.0000)',
      '--muted-foreground': 'oklch(0.5500 0.0400 60.0000)',
      '--accent': 'oklch(0.8500 0.0400 66.0000)',
      '--accent-foreground': 'oklch(0.3200 0.0500 55.0000)',
      '--destructive': 'oklch(0.5000 0.1400 35.0000)',
      '--destructive-foreground': 'oklch(0.9500 0.0200 70.0000)',
      '--border': 'oklch(0.8200 0.0400 66.0000)',
      '--input': 'oklch(0.8200 0.0400 66.0000)',
      '--ring': 'oklch(0.5500 0.1200 65.0000)',
      // Scrollbar styling - warm golden tones
      '--scrollbar-track': 'oklch(0.8500 0.0400 66.0000)',
      '--scrollbar-thumb': 'oklch(0.7200 0.0450 62.0000)',
      '--scrollbar-thumb-hover': 'oklch(0.6800 0.0550 58.0000)',
    }
  },
  {
    id: 'dark-summer-night',
    name: 'Dark Summer Night',
    description: 'Incredibly zen, calming, sunset-inspired dark theme for a soothing summer night coding experience',
    type: 'dark',
    uiTheme: 'dark',
    monacoTheme: 'dark-summer-night',
    cssVariables: {
      '--background': 'oklch(0.18 0.02 270)', // deep indigo
      '--foreground': 'oklch(0.92 0.01 300)', // soft moonlight
      '--card': 'oklch(0.22 0.02 270)',
      '--card-foreground': 'oklch(0.92 0.01 300)',
      '--popover': 'oklch(0.22 0.02 270)',
      '--popover-foreground': 'oklch(0.92 0.01 300)',
      '--primary': 'oklch(0.75 0.13 50)', // sunset orange
      '--primary-foreground': 'oklch(0.18 0.02 270)',
      '--secondary': 'oklch(0.32 0.04 250)', // dusk blue
      '--secondary-foreground': 'oklch(0.92 0.01 300)',
      '--muted': 'oklch(0.22 0.02 270)',
      '--muted-foreground': 'oklch(0.75 0.03 300)',
      '--accent': 'oklch(0.60 0.10 140)', // leafy green
      '--accent-foreground': 'oklch(0.18 0.02 270)',
      '--destructive': 'oklch(0.45 0.15 30)', // soft coral
      '--destructive-foreground': 'oklch(0.92 0.01 300)',
      '--border': 'oklch(0.22 0.02 270)',
      '--input': 'oklch(0.22 0.02 270)',
      '--ring': 'oklch(0.75 0.13 50)',
      // Scrollbar styling - zen dusk
      '--scrollbar-track': 'oklch(0.22 0.02 270)',
      '--scrollbar-thumb': 'oklch(0.32 0.04 250)',
      '--scrollbar-thumb-hover': 'oklch(0.45 0.07 50)',
    }
  }
];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'vibes-dark',
      customThemes: [],
      presets: defaultPresets,

      initializeThemes: () => {
        // Register Monaco themes
        registerDarkMatrixTheme();
        registerVibesLightTheme();
        registerDuneTheme();
        registerDarkSummerNightTheme();
      },

      setTheme: async (themeId: string) => {
        const theme = get().getTheme(themeId);
        if (theme) {
          get().applyTheme(theme);
          set({ currentTheme: themeId });
          
          // Sync with settings store
          try {
            const { useSettingsStore } = await import('@/stores/settings');
            const settingsStore = useSettingsStore.getState();
            await settingsStore.setTheme(themeId);
          } catch (error) {
            console.warn('Failed to sync theme with settings store:', error);
          }
        }
      },

      registerCustomTheme: (theme: ThemePreset) => {
        const { customThemes } = get();
        const existingIndex = customThemes.findIndex(t => t.id === theme.id);
        
        if (existingIndex >= 0) {
          // Update existing theme
          const updated = [...customThemes];
          updated[existingIndex] = theme;
          set({ customThemes: updated });
        } else {
          // Add new theme
          set({ customThemes: [...customThemes, theme] });
        }
      },

      removeCustomTheme: (themeId: string) => {
        const { customThemes, currentTheme } = get();
        const updated = customThemes.filter(t => t.id !== themeId);
        set({ customThemes: updated });
        
        // If the removed theme was active, switch to default
        if (currentTheme === themeId) {
          get().setTheme('vibes-dark');
        }
      },

      getTheme: (themeId: string) => {
        const { presets, customThemes } = get();
        return [...presets, ...customThemes].find(t => t.id === themeId);
      },

      applyTheme: (theme: ThemePreset) => {
        // Apply CSS variables to the document
        const root = document.documentElement;
        
        // Clear existing theme classes
        root.classList.remove('dark', 'light');
        
        // Add new theme class
        root.classList.add(theme.uiTheme);
        
        // Apply CSS variables
        Object.entries(theme.cssVariables).forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });

        // Apply scrollbar styling
        const scrollbarStyles = `
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          ::-webkit-scrollbar-track {
            background: var(--scrollbar-track, var(--muted));
            border-radius: 6px;
          }
          ::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb, var(--border));
            border-radius: 6px;
            border: 2px solid var(--scrollbar-track, var(--muted));
          }
          ::-webkit-scrollbar-thumb:hover {
            background: var(--scrollbar-thumb-hover, var(--accent));
          }
          ::-webkit-scrollbar-corner {
            background: var(--scrollbar-track, var(--muted));
          }
          /* Firefox scrollbar styling */
          * {
            scrollbar-width: thin;
            scrollbar-color: var(--scrollbar-thumb, var(--border)) var(--scrollbar-track, var(--muted));
          }
        `;
        
        // Remove existing scrollbar styles
        const existingScrollbarStyle = document.getElementById('theme-scrollbar-styles');
        if (existingScrollbarStyle) {
          existingScrollbarStyle.remove();
        }
        
        // Add new scrollbar styles
        const styleElement = document.createElement('style');
        styleElement.id = 'theme-scrollbar-styles';
        styleElement.textContent = scrollbarStyles;
        document.head.appendChild(styleElement);
        
        // Apply Monaco theme with retry mechanism
        const applyMonacoTheme = () => {
          if (typeof monaco !== 'undefined' && monaco.editor) {
            try {
              // First ensure the theme is registered
              get().initializeThemes();
              
              // Wait a bit for themes to be fully registered
              setTimeout(() => {
                try {
                  monaco.editor.setTheme(theme.monacoTheme);
                  console.log(`Applied Monaco theme: ${theme.monacoTheme}`);
                } catch (error) {
                  console.warn(`Failed to set Monaco theme ${theme.monacoTheme}:`, error);
                  // Fallback to a base theme
                  try {
                    const fallbackTheme = theme.type === 'dark' ? 'vs-dark' : 'vs';
                    monaco.editor.setTheme(fallbackTheme);
                    console.log(`Applied fallback Monaco theme: ${fallbackTheme}`);
                  } catch (fallbackError) {
                    console.warn('Failed to apply fallback Monaco theme:', fallbackError);
                  }
                }
              }, 100);
            } catch (error) {
              console.warn('Failed to apply Monaco theme:', error);
            }
          } else {
            // Monaco not loaded yet, try again after a delay
            setTimeout(applyMonacoTheme, 500);
          }
        };

        applyMonacoTheme();
        
        // Update localStorage for theme preference
        localStorage.setItem('ui-theme', theme.uiTheme);
      },
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        customThemes: state.customThemes,
      }),
    }
  )
);
