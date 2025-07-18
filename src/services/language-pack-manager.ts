import * as monaco from 'monaco-editor'

// Browser-compatible language pack manager - no file system access

export interface LanguagePack {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  path: string
  extensions: string[]
  aliases: string[]
  configuration?: {
    comments?: {
      lineComment?: string
      blockComment?: [string, string]
    }
    brackets?: [string, string][]
    autoClosingPairs?: Array<{
      open: string
      close: string
      notIn?: string[]
    }>
    surroundingPairs?: Array<{
      open: string
      close: string
    }>
    folding?: {
      markers?: {
        start: string
        end: string
      }
    }
  }
  grammar?: {
    scopeName: string
    path: string
    embeddedLanguages?: Record<string, string>
    tokenTypes?: Record<string, string>
  }
  snippets?: {
    path: string
  }
  source: 'vscode' | 'custom'
}

export interface LanguageSnippet {
  prefix: string
  body: string | string[]
  description?: string
  scope?: string
}

export class LanguagePackManager {
  private languagePacks: Map<string, LanguagePack> = new Map()
  private registeredLanguages: Set<string> = new Set()

  constructor() {
    this.loadBuiltInLanguages()
  }

  private loadBuiltInLanguages() {
    // Monaco's built-in languages
    const builtInLanguages = [
      'javascript', 'typescript', 'json', 'html', 'css', 'scss', 'less',
      'xml', 'yaml', 'markdown', 'python', 'java', 'csharp', 'cpp',
      'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'shell',
      'dockerfile', 'graphql', 'lua', 'perl', 'r', 'dart', 'elixir',
      'fsharp', 'haskell', 'julia', 'objective-c', 'pascal', 'scala',
      'vb', 'clojure', 'coffeescript', 'handlebars', 'ini', 'properties',
      'redis', 'solidity', 'tcl', 'twig', 'verilog', 'vhdl', 'wgsl'
    ]

    builtInLanguages.forEach(lang => {
      this.registeredLanguages.add(lang)
    })
  }

  async loadVSCodeLanguagePack(packageData: any, packName: string): Promise<LanguagePack> {
    try {
      if (!packageData.contributes?.languages?.[0]) {
        throw new Error('No language contribution found')
      }

      const langContrib = packageData.contributes.languages[0]
      const langPack: LanguagePack = {
        id: langContrib.id,
        name: langContrib.id,
        displayName: packageData.displayName || langContrib.id,
        description: packageData.description || '',
        version: packageData.version || '1.0.0',
        path: '',
        extensions: langContrib.extensions || [],
        aliases: langContrib.aliases || [],
        configuration: langContrib.configuration || undefined,
        grammar: packageData.contributes.grammars?.[0] ? {
          scopeName: packageData.contributes.grammars[0].scopeName,
          path: packageData.contributes.grammars[0].path,
          embeddedLanguages: packageData.contributes.grammars[0].embeddedLanguages,
          tokenTypes: packageData.contributes.grammars[0].tokenTypes
        } : undefined,
        snippets: packageData.contributes.snippets?.[0] ? {
          path: packageData.contributes.snippets[0].path
        } : undefined,
        source: 'vscode'
      }

      this.languagePacks.set(langPack.id, langPack)
      await this.registerLanguage(langPack)
      
      return langPack
    } catch (error) {
      console.error('Failed to load VSCode language pack:', error)
      throw error
    }
  }

  private loadLanguageConfiguration(configData: any): any {
    try {
      return configData || {}
    } catch (error) {
      console.warn('Failed to load language configuration:', error)
      return {}
    }
  }

  private async registerLanguage(langPack: LanguagePack): Promise<void> {
    try {
      // Register the language with Monaco
      monaco.languages.register({
        id: langPack.id,
        extensions: langPack.extensions,
        aliases: langPack.aliases,
        mimetypes: []
      })

      // Set language configuration
      if (langPack.configuration) {
        monaco.languages.setLanguageConfiguration(langPack.id, {
          comments: langPack.configuration.comments,
          brackets: langPack.configuration.brackets,
          autoClosingPairs: langPack.configuration.autoClosingPairs,
          surroundingPairs: langPack.configuration.surroundingPairs,
          folding: langPack.configuration.folding
        })
      }

      // Load and set grammar
      if (langPack.grammar) {
        try {
          // For browser environment, grammar would be provided directly
          // Convert TextMate grammar to Monaco Monarch if available
          const monarchGrammar = this.createBasicMonarchGrammar(langPack.id)
          monaco.languages.setMonarchTokensProvider(langPack.id, monarchGrammar)
        } catch (error) {
          console.warn(`Failed to load grammar for ${langPack.id}:`, error)
        }
      }

      // Load and register snippets
      if (langPack.snippets) {
        try {
          // For browser environment, snippets would be provided directly
          // Register basic snippets for the language
          this.registerBasicSnippets(langPack.id)
        } catch (error) {
          console.warn(`Failed to load snippets for ${langPack.id}:`, error)
        }
      }

      this.registeredLanguages.add(langPack.id)
    } catch (error) {
      console.error(`Failed to register language ${langPack.id}:`, error)
    }
  }

  private createBasicMonarchGrammar(languageId: string): any {
    // Create a basic monarch grammar for the language
    return {
      defaultToken: 'invalid',
      tokenPostfix: `.${languageId}`,
      
      keywords: this.getBasicKeywords(languageId),
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

  private getBasicKeywords(languageId: string): string[] {
    const keywordMap: Record<string, string[]> = {
      javascript: ['var', 'let', 'const', 'function', 'class', 'if', 'else', 'for', 'while', 'return'],
      typescript: ['var', 'let', 'const', 'function', 'class', 'interface', 'type', 'if', 'else', 'for', 'while', 'return'],
      python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'return', 'try', 'except'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'if', 'else', 'for', 'while', 'return'],
      csharp: ['public', 'private', 'protected', 'class', 'interface', 'if', 'else', 'for', 'while', 'return', 'using'],
      go: ['func', 'type', 'struct', 'interface', 'if', 'else', 'for', 'return', 'package', 'import'],
      rust: ['fn', 'struct', 'enum', 'impl', 'trait', 'if', 'else', 'for', 'while', 'return', 'let', 'mut'],
    }
    
    return keywordMap[languageId] || ['if', 'else', 'for', 'while', 'return']
  }

  private convertTextMateToMonarch(grammar: any): any {
    // This is a simplified conversion from TextMate to Monaco Monarch
    // In a real implementation, you'd want a more sophisticated converter
    return this.createBasicMonarchGrammar(grammar.name || 'unknown')
  }

  private extractKeywords(grammar: any): string[] {
    // Extract keywords from TextMate grammar rules
    const keywords: string[] = []
    
    const processRule = (rule: any) => {
      if (rule.name && rule.name.includes('keyword')) {
        if (rule.match) {
          // Extract words from regex pattern
          const words = rule.match.match(/\b\w+\b/g)
          if (words) keywords.push(...words)
        }
      }
      
      if (rule.patterns) {
        rule.patterns.forEach(processRule)
      }
    }
    
    if (grammar.patterns) {
      grammar.patterns.forEach(processRule)
    }
    
    return [...new Set(keywords)]
  }

  private extractOperators(grammar: any): string[] {
    // Extract operators from TextMate grammar
    return ['=', '>', '<', '!', '~', '?', ':', '&', '|', '+', '-', '*', '/', '^', '%']
  }

  private registerBasicSnippets(languageId: string): void {
    // Register some basic snippets for the language
    const basicSnippets: Record<string, LanguageSnippet> = {
      'log': {
        prefix: 'log',
        body: 'console.log($1);',
        description: 'Log output to console'
      },
      'func': {
        prefix: 'func',
        body: 'function $1($2) {\n\t$3\n}',
        description: 'Function declaration'
      }
    }
    
    this.registerSnippets(languageId, basicSnippets)
  }

  private registerSnippets(languageId: string, snippets: Record<string, LanguageSnippet>): void {
    const completionItems = Object.entries(snippets).map(([key, snippet]) => ({
      label: snippet.prefix,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: snippet.description || key,
      range: null as any
    }))

    monaco.languages.registerCompletionItemProvider(languageId, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        return {
          suggestions: completionItems.map(item => ({
            ...item,
            range
          }))
        }
      }
    })
  }

  async discoverLanguagePacks(): Promise<LanguagePack[]> {
    // In browser environment, language pack discovery would be handled by the main process
    // For now, return empty array - language packs will be loaded via file upload
    return []
  }

  getLanguagePacks(): LanguagePack[] {
    return Array.from(this.languagePacks.values())
  }

  getLanguagePack(id: string): LanguagePack | undefined {
    return this.languagePacks.get(id)
  }

  getRegisteredLanguages(): string[] {
    return Array.from(this.registeredLanguages)
  }

  async installLanguagePack(packageData: any, packName: string): Promise<LanguagePack> {
    return await this.loadVSCodeLanguagePack(packageData, packName)
  }

  isLanguageRegistered(languageId: string): boolean {
    return this.registeredLanguages.has(languageId)
  }
}