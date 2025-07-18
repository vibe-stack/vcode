import * as monaco from 'monaco-editor'

export interface ThemeDefinition {
  id: string
  name: string
  type: 'light' | 'dark' | 'hc' | 'hc-light'
  colors: Record<string, string>
  tokenColors: Array<{
    scope: string | string[]
    settings: {
      foreground?: string
      background?: string
      fontStyle?: string
    }
  }>
  source: 'vscode' | 'zed' | 'custom'
  path?: string
}

export interface ZedTheme {
  $schema: string
  name: string
  author: string
  themes: Array<{
    name: string
    appearance: 'light' | 'dark'
    style: {
      background?: string
      foreground?: string
      [key: string]: any
    }
  }>
}

export class ThemeManager {
  private themes: Map<string, ThemeDefinition> = new Map()
  private activeTheme: string | null = null

  constructor() {
    this.loadBuiltInThemes()
  }

  private loadBuiltInThemes() {
    // Load Monaco's built-in themes
    const builtInThemes = [
      { id: 'vs', name: 'Light', type: 'light' as const },
      { id: 'vs-dark', name: 'Dark', type: 'dark' as const },
      { id: 'hc-black', name: 'High Contrast Dark', type: 'hc' as const },
      { id: 'hc-light', name: 'High Contrast Light', type: 'hc-light' as const }
    ]

    builtInThemes.forEach(theme => {
      this.themes.set(theme.id, {
        id: theme.id,
        name: theme.name,
        type: theme.type,
        colors: {},
        tokenColors: [],
        source: 'custom'
      })
    })
  }

  async loadVSCodeTheme(themeData: any, themeName: string): Promise<ThemeDefinition> {
    try {
      const theme: ThemeDefinition = {
        id: themeName,
        name: themeData.name || themeName,
        type: this.inferThemeType(themeData),
        colors: themeData.colors || {},
        tokenColors: themeData.tokenColors || [],
        source: 'vscode',
        path: ''
      }

      this.themes.set(theme.id, theme)
      this.registerWithMonaco(theme)
      
      return theme
    } catch (error) {
      console.error('Failed to load VSCode theme:', error)
      throw error
    }
  }

  async loadZedTheme(zedThemeData: ZedTheme): Promise<ThemeDefinition[]> {
    try {
      const themes: ThemeDefinition[] = []
      
      for (const theme of zedThemeData.themes) {
        const converted = this.convertZedTheme(theme, zedThemeData.name)
        themes.push(converted)
        this.themes.set(converted.id, converted)
        this.registerWithMonaco(converted)
      }
      
      return themes
    } catch (error) {
      console.error('Failed to load Zed theme:', error)
      throw error
    }
  }

  private convertZedTheme(zedTheme: any, familyName: string): ThemeDefinition {
    const theme: ThemeDefinition = {
      id: `zed-${familyName.toLowerCase()}-${zedTheme.name.toLowerCase()}`,
      name: `${familyName} ${zedTheme.name}`,
      type: zedTheme.appearance === 'light' ? 'light' : 'dark',
      colors: this.convertZedColors(zedTheme.style),
      tokenColors: this.convertZedTokenColors(zedTheme.style),
      source: 'zed'
    }

    return theme
  }

  private convertZedColors(zedStyle: any): Record<string, string> {
    const colorMap: Record<string, string> = {}
    
    // Map Zed color keys to VSCode/Monaco color keys
    const mapping = {
      'background': 'editor.background',
      'foreground': 'editor.foreground',
      'cursor': 'editorCursor.foreground',
      'selection': 'editor.selectionBackground',
      'line_highlight': 'editor.lineHighlightBackground',
      'panel_background': 'panel.background',
      'panel_foreground': 'panel.foreground',
      'border': 'panel.border',
      'tab_bar_background': 'tab.inactiveBackground',
      'tab_active_background': 'tab.activeBackground',
      'tab_inactive_background': 'tab.inactiveBackground',
      'toolbar_background': 'toolbar.background',
      'status_bar_background': 'statusBar.background',
      'title_bar_background': 'titleBar.activeBackground'
    }

    Object.entries(mapping).forEach(([zedKey, monacoKey]) => {
      if (zedStyle[zedKey]) {
        colorMap[monacoKey] = zedStyle[zedKey]
      }
    })

    return colorMap
  }

  private convertZedTokenColors(zedStyle: any): any[] {
    const tokenColors: any[] = []
    
    // Convert Zed syntax highlighting to Monaco token colors
    const syntaxMapping = {
      'string': { scope: 'string', settings: { foreground: zedStyle.string } },
      'comment': { scope: 'comment', settings: { foreground: zedStyle.comment } },
      'keyword': { scope: 'keyword', settings: { foreground: zedStyle.keyword } },
      'function': { scope: 'entity.name.function', settings: { foreground: zedStyle.function } },
      'variable': { scope: 'variable', settings: { foreground: zedStyle.variable } },
      'type': { scope: 'entity.name.type', settings: { foreground: zedStyle.type } },
      'number': { scope: 'constant.numeric', settings: { foreground: zedStyle.number } },
      'boolean': { scope: 'constant.language.boolean', settings: { foreground: zedStyle.boolean } },
      'operator': { scope: 'keyword.operator', settings: { foreground: zedStyle.operator } }
    }

    Object.entries(syntaxMapping).forEach(([key, value]) => {
      if (value.settings.foreground) {
        tokenColors.push(value)
      }
    })

    return tokenColors
  }

  private registerWithMonaco(theme: ThemeDefinition) {
    try {
      monaco.editor.defineTheme(theme.id, {
        base: theme.type === 'light' ? 'vs' : 'vs-dark',
        inherit: true,
        rules: theme.tokenColors.map(token => ({
          token: Array.isArray(token.scope) ? token.scope[0] : token.scope,
          foreground: token.settings.foreground?.replace('#', ''),
          background: token.settings.background?.replace('#', ''),
          fontStyle: token.settings.fontStyle || ''
        })),
        colors: theme.colors
      })
    } catch (error) {
      console.error(`Failed to register theme ${theme.id}:`, error)
    }
  }

  private inferThemeType(themeData: any): 'light' | 'dark' | 'hc' | 'hc-light' {
    if (themeData.type) return themeData.type
    
    const bg = themeData.colors?.['editor.background'] || '#ffffff'
    const isLight = this.isLightColor(bg)
    
    return isLight ? 'light' : 'dark'
  }

  private isLightColor(color: string): boolean {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 127
  }

  async discoverThemes(): Promise<ThemeDefinition[]> {
    // In browser environment, theme discovery would be handled by the main process
    // For now, return empty array - themes will be loaded via file upload
    return []
  }

  applyTheme(themeId: string): void {
    const theme = this.themes.get(themeId)
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`)
    }

    monaco.editor.setTheme(themeId)
    this.activeTheme = themeId
    
    // Apply theme to the rest of the application
    this.applyApplicationTheme(theme)
  }

  private applyApplicationTheme(theme: ThemeDefinition): void {
    const root = document.documentElement
    
    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/\./g, '-')}`
      root.style.setProperty(cssVar, value)
    })

    // Apply theme class
    root.className = root.className.replace(/theme-\w+/g, '')
    root.classList.add(`theme-${theme.type}`)
  }

  getThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values())
  }

  getTheme(id: string): ThemeDefinition | undefined {
    return this.themes.get(id)
  }

  getActiveTheme(): ThemeDefinition | null {
    return this.activeTheme ? this.themes.get(this.activeTheme) || null : null
  }

  async installTheme(themeData: any, fileName: string): Promise<ThemeDefinition[]> {
    try {
      if (themeData.themes && Array.isArray(themeData.themes)) {
        // Zed theme
        return await this.loadZedTheme(themeData)
      } else if (themeData.colors || themeData.tokenColors) {
        // VSCode theme
        const themeName = fileName.replace('.json', '')
        const theme = await this.loadVSCodeTheme(themeData, themeName)
        return [theme]
      }
      
      throw new Error('Invalid theme format')
    } catch (error) {
      console.error('Failed to install theme:', error)
      throw error
    }
  }
}