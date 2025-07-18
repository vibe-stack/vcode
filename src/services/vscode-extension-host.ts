import * as monaco from 'monaco-editor'

// Browser-compatible VSCode extension host - no file system access

// Simple EventEmitter implementation for browser compatibility
class SimpleEventEmitter {
  private listeners: Map<string, Function[]> = new Map()

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(listener)
      if (index !== -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args))
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

export interface VSCodeExtensionManifest {
  name: string
  version: string
  description?: string
  publisher?: string
  engines: {
    vscode: string
  }
  activationEvents?: string[]
  main?: string
  contributes?: {
    commands?: Array<{
      command: string
      title: string
      category?: string
    }>
    keybindings?: Array<{
      command: string
      key: string
      when?: string
    }>
    languages?: Array<{
      id: string
      extensions?: string[]
      aliases?: string[]
    }>
    grammars?: Array<{
      language: string
      scopeName: string
      path: string
    }>
    themes?: Array<{
      label: string
      uiTheme: string
      path: string
    }>
    snippets?: Array<{
      language: string
      path: string
    }>
  }
}

export interface VSCodeExtension {
  id: string
  manifest: VSCodeExtensionManifest
  extensionPath: string
  isActive: boolean
  context: ExtensionContext
  activate?: (context: ExtensionContext) => void | Promise<void>
  deactivate?: () => void | Promise<void>
}

export class ExtensionContext {
  subscriptions: Array<{ dispose(): void }> = []
  workspaceState: Map<string, any> = new Map()
  globalState: Map<string, any> = new Map()
  
  constructor(
    public extensionUri: string,
    public extensionPath: string,
    public storageUri: string,
    public globalStorageUri: string
  ) {}
}

export class VSCodeExtensionHost extends SimpleEventEmitter {
  private extensions: Map<string, VSCodeExtension> = new Map()
  private commandsMap: Map<string, Function> = new Map()
  private languagesMap: Map<string, any> = new Map()
  private activeEditor: monaco.editor.IStandaloneCodeEditor | null = null
  
  // VSCode API implementation
  readonly workspace = {
    openTextDocument: async (uri: string) => {
      return this.openDocument(uri)
    },
    
    onDidChangeTextDocument: (listener: Function) => {
      return this.addDocumentChangeListener(listener)
    },
    
    workspaceFolders: [] as any[],
    
    getConfiguration: (section?: string) => {
      return {
        get: (key: string, defaultValue?: any) => {
          return this.getConfiguration(section, key, defaultValue)
        },
        update: (key: string, value: any) => {
          return this.updateConfiguration(section, key, value)
        }
      }
    }
  }
  
  readonly window = {
    showInformationMessage: (message: string, ...items: string[]) => {
      return this.showMessage('info', message, items)
    },
    
    showWarningMessage: (message: string, ...items: string[]) => {
      return this.showMessage('warning', message, items)
    },
    
    showErrorMessage: (message: string, ...items: string[]) => {
      return this.showMessage('error', message, items)
    },
    
    createStatusBarItem: (alignment?: any, priority?: number) => {
      return this.createStatusBarItem(alignment, priority)
    },
    
    get activeTextEditor() {
      return this.getActiveTextEditor()
    },
    
    onDidChangeActiveTextEditor: (listener: Function) => {
      return this.addActiveEditorChangeListener(listener)
    }
  }
  
  readonly commands = {
    registerCommand: (command: string, callback: Function) => {
      this.commandsMap.set(command, callback)
      return { dispose: () => this.commandsMap.delete(command) }
    },
    
    executeCommand: (command: string, ...args: any[]) => {
      const handler = this.commandsMap.get(command)
      if (handler) {
        return handler(...args)
      }
      throw new Error(`Command '${command}' not found`)
    }
  }
  
  readonly languages = {
    registerDocumentFormattingEditProvider: (language: string, provider: any) => {
      return this.registerFormattingProvider(language, provider)
    },
    
    registerCompletionItemProvider: (language: string, provider: any) => {
      return this.registerCompletionProvider(language, provider)
    },
    
    registerHoverProvider: (language: string, provider: any) => {
      return this.registerHoverProvider(language, provider)
    }
  }
  
  async loadExtension(manifest: VSCodeExtensionManifest, extensionId?: string): Promise<VSCodeExtension> {
    try {
      const id = extensionId || `${manifest.publisher || 'unknown'}.${manifest.name}`
      
      const context = new ExtensionContext(
        '',  // extensionPath not available in browser
        '',  // extensionPath not available in browser
        '',  // storage path not available in browser
        ''   // global storage path not available in browser
      )
      
      const extension: VSCodeExtension = {
        id,
        manifest,
        extensionPath: '',
        isActive: false,
        context
      }
      
      // Extension modules cannot be dynamically loaded in browser environment
      // Extensions would need to be pre-bundled or loaded via other mechanisms
      
      this.extensions.set(id, extension)
      
      // Register contributions
      await this.registerContributions(extension)
      
      return extension
    } catch (error) {
      console.error(`Failed to load extension:`, error)
      throw error
    }
  }
  
  async activateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`)
    }
    
    if (extension.isActive) {
      return
    }
    
    try {
      if (extension.activate) {
        await extension.activate(extension.context)
      }
      
      extension.isActive = true
      this.emit('extensionActivated', extension)
    } catch (error) {
      console.error(`Failed to activate extension ${extensionId}:`, error)
      throw error
    }
  }
  
  async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension || !extension.isActive) {
      return
    }
    
    try {
      if (extension.deactivate) {
        await extension.deactivate()
      }
      
      // Dispose all subscriptions
      extension.context.subscriptions.forEach(disposable => {
        disposable.dispose()
      })
      
      extension.isActive = false
      this.emit('extensionDeactivated', extension)
    } catch (error) {
      console.error(`Failed to deactivate extension ${extensionId}:`, error)
    }
  }
  
  private async registerContributions(extension: VSCodeExtension): Promise<void> {
    const { contributes } = extension.manifest
    if (!contributes) return
    
    // Register commands
    if (contributes.commands) {
      contributes.commands.forEach(command => {
        // Commands are registered when the extension activates
        this.emit('commandContributed', command)
      })
    }
    
    // Register languages
    if (contributes.languages) {
      contributes.languages.forEach(language => {
        monaco.languages.register({
          id: language.id,
          extensions: language.extensions,
          aliases: language.aliases
        })
      })
    }
    
    // Register grammars
    if (contributes.grammars) {
      contributes.grammars.forEach(async grammar => {
        try {
          // In browser environment, grammar data would need to be provided directly
          // For now, create a basic monarch grammar
          const basicGrammar = this.createBasicGrammar(grammar.language)
          monaco.languages.setMonarchTokensProvider(grammar.language, basicGrammar)
        } catch (error) {
          console.error(`Failed to register grammar for ${grammar.language}:`, error)
        }
      })
    }
    
    // Register themes
    if (contributes.themes) {
      contributes.themes.forEach(async theme => {
        try {
          // In browser environment, theme data would need to be provided directly
          // For now, create a basic theme definition
          const basicTheme = this.createBasicTheme(theme.label, theme.uiTheme)
          monaco.editor.defineTheme(theme.label, basicTheme)
        } catch (error) {
          console.error(`Failed to register theme ${theme.label}:`, error)
        }
      })
    }
  }
  
  setActiveEditor(editor: monaco.editor.IStandaloneCodeEditor | null): void {
    this.activeEditor = editor
    this.emit('activeEditorChanged', editor)
  }
  
  private async openDocument(uri: string): Promise<any> {
    // Implementation depends on your file system
    return {
      uri,
      getText: () => '', // Get text from Monaco model
      save: () => Promise.resolve()
    }
  }
  
  private addDocumentChangeListener(listener: Function): { dispose(): void } {
    this.on('documentChanged', listener)
    return { dispose: () => this.off('documentChanged', listener) }
  }
  
  private getConfiguration(section?: string, key?: string, defaultValue?: any): any {
    // Implementation depends on your settings system
    return defaultValue
  }
  
  private updateConfiguration(section?: string, key?: string, value?: any): Promise<void> {
    // Implementation depends on your settings system
    return Promise.resolve()
  }
  
  private showMessage(type: 'info' | 'warning' | 'error', message: string, items: string[]): Promise<string | undefined> {
    // Implementation depends on your notification system
    console.log(`[${type}] ${message}`)
    return Promise.resolve(undefined)
  }
  
  private createStatusBarItem(alignment?: any, priority?: number): any {
    // Implementation depends on your status bar
    return {
      text: '',
      show: () => {},
      hide: () => {},
      dispose: () => {}
    }
  }
  
  private getActiveTextEditor(): any {
    if (!this.activeEditor) return undefined
    
    return {
      document: {
        uri: '',
        getText: () => this.activeEditor?.getValue() || '',
        lineCount: this.activeEditor?.getModel()?.getLineCount() || 0
      },
      selection: this.activeEditor?.getSelection(),
      edit: (callback: Function) => {
        // Implementation for text editing
      }
    }
  }
  
  private addActiveEditorChangeListener(listener: Function): { dispose(): void } {
    this.on('activeEditorChanged', listener)
    return { dispose: () => this.off('activeEditorChanged', listener) }
  }
  
  private registerFormattingProvider(language: string, provider: any): { dispose(): void } {
    const disposable = monaco.languages.registerDocumentFormattingEditProvider(language, provider)
    return disposable
  }
  
  private registerCompletionProvider(language: string, provider: any): { dispose(): void } {
    const disposable = monaco.languages.registerCompletionItemProvider(language, provider)
    return disposable
  }
  
  private registerHoverProvider(language: string, provider: any): { dispose(): void } {
    const disposable = monaco.languages.registerHoverProvider(language, provider)
    return disposable
  }
  
  getExtensions(): VSCodeExtension[] {
    return Array.from(this.extensions.values())
  }
  
  getExtension(id: string): VSCodeExtension | undefined {
    return this.extensions.get(id)
  }

  private createBasicGrammar(languageId: string): any {
    // Create a basic monarch grammar for the language
    return {
      defaultToken: 'invalid',
      tokenPostfix: `.${languageId}`,
      
      keywords: this.getLanguageKeywords(languageId),
      operators: ['=', '>', '<', '!', '~', '?', ':', '&', '|', '+', '-', '*', '/', '^', '%'],
      
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      
      tokenizer: {
        root: [
          [/[a-z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
          [/[A-Z][\w\$]*/, 'type.identifier'],
          [/[0-9]+/, 'number'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
          [/'[^\\']'/, 'string'],
          [/(^[ \t]*)?\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/[{}()\[\]]/, '@brackets'],
          [/[<>](?!@symbols)/, '@brackets'],
          [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
          [/[ \t\r\n]+/, 'white'],
        ],
        
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\/\*/, 'comment', '@push'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
        
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape.invalid'],
          [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
        ],
      },
    }
  }

  private getLanguageKeywords(languageId: string): string[] {
    const keywordMap: Record<string, string[]> = {
      javascript: ['var', 'let', 'const', 'function', 'class', 'if', 'else', 'for', 'while', 'return'],
      typescript: ['var', 'let', 'const', 'function', 'class', 'interface', 'type', 'if', 'else', 'for', 'while', 'return'],
      python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'return', 'try', 'except'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'if', 'else', 'for', 'while', 'return'],
    }
    
    return keywordMap[languageId] || ['if', 'else', 'for', 'while', 'return']
  }

  private createBasicTheme(themeName: string, uiTheme: string): any {
    const isDark = uiTheme === 'vs-dark' || uiTheme.includes('dark')
    
    return {
      base: isDark ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: isDark ? '569cd6' : '0000ff' },
        { token: 'string', foreground: isDark ? 'ce9178' : 'a31515' },
        { token: 'comment', foreground: isDark ? '6a9955' : '008000', fontStyle: 'italic' },
        { token: 'number', foreground: isDark ? 'b5cea8' : '098658' },
      ],
      colors: {
        'editor.background': isDark ? '#1e1e1e' : '#ffffff',
        'editor.foreground': isDark ? '#d4d4d4' : '#000000',
        'editorCursor.foreground': isDark ? '#ffffff' : '#000000',
        'editor.selectionBackground': isDark ? '#264f78' : '#add6ff',
      }
    }
  }
}