// Browser-compatible icon theme manager

export interface IconTheme {
  id: string
  name: string
  path: string
  iconDefinitions: Record<string, {
    iconPath: string
    fontColor?: string
    fontSize?: string
    fontCharacter?: string
  }>
  fileExtensions: Record<string, string>
  fileNames: Record<string, string>
  folderNames: Record<string, string>
  languageIds: Record<string, string>
  folder: string
  folderExpanded: string
  file: string
  source: 'vscode' | 'custom'
}

export class IconThemeManager {
  private themes: Map<string, IconTheme> = new Map()
  private activeTheme: string | null = null

  constructor() {
    this.loadBuiltInThemes()
  }

  private loadBuiltInThemes() {
    // Default minimal icon theme
    const defaultTheme: IconTheme = {
      id: 'default',
      name: 'Default',
      path: '',
      iconDefinitions: {},
      fileExtensions: {},
      fileNames: {},
      folderNames: {},
      languageIds: {},
      folder: '📁',
      folderExpanded: '📂',
      file: '📄',
      source: 'custom'
    }

    this.themes.set('default', defaultTheme)
    this.activeTheme = 'default'
  }

  async loadVSCodeIconTheme(themePath: string): Promise<IconTheme> {
    try {
      const content = await fs.readFile(themePath, 'utf8')
      const themeData = JSON.parse(content)
      
      const theme: IconTheme = {
        id: path.basename(themePath, '.json'),
        name: themeData.name || path.basename(themePath, '.json'),
        path: themePath,
        iconDefinitions: themeData.iconDefinitions || {},
        fileExtensions: themeData.fileExtensions || {},
        fileNames: themeData.fileNames || {},
        folderNames: themeData.folderNames || {},
        languageIds: themeData.languageIds || {},
        folder: themeData.folder || '📁',
        folderExpanded: themeData.folderExpanded || '📂',
        file: themeData.file || '📄',
        source: 'vscode'
      }

      this.themes.set(theme.id, theme)
      return theme
    } catch (error) {
      console.error('Failed to load VSCode icon theme:', error)
      throw error
    }
  }

  async discoverIconThemes(): Promise<IconTheme[]> {
    const themes: IconTheme[] = []
    
    // Common icon theme directories
    const iconPaths = [
      path.join(process.env.HOME || '', '.vscode', 'extensions'),
      path.join(process.cwd(), 'icon-themes')
    ]

    for (const iconPath of iconPaths) {
      try {
        const entries = await fs.readdir(iconPath, { withFileTypes: true })
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const extensionPath = path.join(iconPath, entry.name)
            const packagePath = path.join(extensionPath, 'package.json')
            
            try {
              const packageContent = await fs.readFile(packagePath, 'utf8')
              const packageData = JSON.parse(packageContent)
              
              if (packageData.contributes?.iconThemes) {
                for (const iconTheme of packageData.contributes.iconThemes) {
                  const themePath = path.join(extensionPath, iconTheme.path)
                  try {
                    const theme = await this.loadVSCodeIconTheme(themePath)
                    themes.push(theme)
                  } catch (error) {
                    console.warn(`Failed to load icon theme ${iconTheme.id}:`, error)
                  }
                }
              }
            } catch (error) {
              // Skip directories without package.json
            }
          }
        }
      } catch (error) {
        // Skip directories that don't exist
      }
    }

    return themes
  }

  getIconForFile(fileName: string, isDirectory: boolean = false): string {
    const theme = this.getActiveTheme()
    if (!theme) return isDirectory ? '📁' : '📄'

    if (isDirectory) {
      return theme.folderNames[fileName] || theme.folder
    }

    // Check file name first
    if (theme.fileNames[fileName]) {
      return this.resolveIcon(theme.fileNames[fileName], theme)
    }

    // Check file extension
    const ext = path.extname(fileName).toLowerCase().replace('.', '')
    if (theme.fileExtensions[ext]) {
      return this.resolveIcon(theme.fileExtensions[ext], theme)
    }

    // Check language ID (this would need language detection)
    // For now, just return default file icon
    return theme.file
  }

  private resolveIcon(iconKey: string, theme: IconTheme): string {
    const iconDef = theme.iconDefinitions[iconKey]
    if (!iconDef) return theme.file

    // For file-based icons, we'd need to load the actual icon file
    // For now, we'll use emoji fallbacks or return the icon path
    if (iconDef.fontCharacter) {
      return iconDef.fontCharacter
    }

    // Return a mapped emoji for common file types
    return this.getEmojiForIcon(iconKey)
  }

  private getEmojiForIcon(iconKey: string): string {
    const emojiMap: Record<string, string> = {
      'javascript': '🟨',
      'typescript': '🔷',
      'python': '🐍',
      'java': '☕',
      'csharp': '🟣',
      'go': '🐹',
      'rust': '🦀',
      'php': '🟣',
      'ruby': '💎',
      'swift': '🍎',
      'kotlin': '🟣',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'xml': '📄',
      'yaml': '📋',
      'markdown': '📝',
      'image': '🖼️',
      'video': '🎬',
      'audio': '🎵',
      'archive': '📦',
      'pdf': '📕',
      'word': '📘',
      'excel': '📗',
      'powerpoint': '📙',
      'database': '🗄️',
      'font': '🔤',
      'config': '⚙️',
      'log': '📜',
      'test': '🧪',
      'lock': '🔒',
      'key': '🔑',
      'certificate': '🏆',
      'docker': '🐳',
      'git': '🌲'
    }

    return emojiMap[iconKey] || '📄'
  }

  applyIconTheme(themeId: string): void {
    const theme = this.themes.get(themeId)
    if (!theme) {
      throw new Error(`Icon theme ${themeId} not found`)
    }

    this.activeTheme = themeId
    
    // Emit event for UI to update
    window.dispatchEvent(new CustomEvent('iconThemeChanged', {
      detail: { theme }
    }))
  }

  getThemes(): IconTheme[] {
    return Array.from(this.themes.values())
  }

  getTheme(id: string): IconTheme | undefined {
    return this.themes.get(id)
  }

  getActiveTheme(): IconTheme | null {
    return this.activeTheme ? this.themes.get(this.activeTheme) || null : null
  }

  async installIconTheme(themePath: string): Promise<IconTheme> {
    return await this.loadVSCodeIconTheme(themePath)
  }
}