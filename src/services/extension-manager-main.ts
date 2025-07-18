import * as fs from 'fs'
import * as path from 'path'
import * as yauzl from 'yauzl'
import { ipcMain } from 'electron'

export interface ExtensionInstallResult {
  success: boolean
  extension?: any
  error?: string
}

export interface ExtensionDiscoveryResult {
  id: string
  name: string
  description: string
  version: string
  publisher: string
  downloadUrl?: string
  rating?: number
  installs?: number
}

export class ExtensionManagerMain {
  private extensionsPath: string
  private installedExtensions: Map<string, string> = new Map()
  private activeExtensions: Set<string> = new Set()

  constructor(extensionsPath?: string) {
    this.extensionsPath = extensionsPath || path.join(process.cwd(), '.vscode-extensions')
    this.ensureExtensionsDirectory()
    this.loadInstalledExtensions()
    this.loadActiveExtensions()
    this.setupIpcHandlers()
    
    // Set up CSS import mocking globally
    this.mockCSSImports()
  }

  private ensureExtensionsDirectory(): void {
    if (!fs.existsSync(this.extensionsPath)) {
      fs.mkdirSync(this.extensionsPath, { recursive: true })
    }
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('extension:install-vsix', async (event, vsixPath: string) => {
      return this.installFromVsix(vsixPath)
    })

    ipcMain.handle('extension:install-directory', async (event, extensionPath: string) => {
      return this.installFromDirectory(extensionPath)
    })

    ipcMain.handle('extension:uninstall', async (event, extensionId: string) => {
      return this.uninstallExtension(extensionId)
    })

    ipcMain.handle('extension:search-marketplace', async (event, query: string, limit = 20) => {
      return this.searchMarketplace(query, limit)
    })

    ipcMain.handle('extension:get-installed', async () => {
      return Array.from(this.installedExtensions.keys())
    })

    ipcMain.handle('extension:get-manifest', async (event, extensionId: string) => {
      return this.getExtensionManifest(extensionId)
    })

    ipcMain.handle('extension:get-extension-path', async (event, extensionId: string) => {
      return this.getExtensionPath(extensionId)
    })

    ipcMain.handle('extension:load-file', async (event, filePath: string) => {
      return this.loadExtensionFile(filePath)
    })

    ipcMain.handle('extension:execute', async (event, extensionId: string) => {
      return this.executeExtension(extensionId)
    })

    ipcMain.handle('extension:set-active', async (event, extensionId: string, active: boolean) => {
      if (active) {
        this.activeExtensions.add(extensionId)
      } else {
        this.activeExtensions.delete(extensionId)
      }
      this.saveActiveExtensions()
      return true
    })

    ipcMain.handle('extension:get-active', async () => {
      return Array.from(this.activeExtensions)
    })

    ipcMain.handle('extension:is-active', async (event, extensionId: string) => {
      return this.activeExtensions.has(extensionId)
    })

    console.log('✅ Extension IPC handlers registered')
  }

  async installFromVsix(vsixPath: string): Promise<ExtensionInstallResult> {
    try {
      const manifest = await this.extractManifestFromVsix(vsixPath)
      const extensionId = `${manifest.publisher}.${manifest.name}`
      const extensionDir = path.join(this.extensionsPath, extensionId)

      // Extract the VSIX to the extensions directory
      await this.extractVsix(vsixPath, extensionDir)

      this.installedExtensions.set(extensionId, extensionDir)
      this.activeExtensions.add(extensionId) // Mark as active by default
      this.saveInstalledExtensions()
      this.saveActiveExtensions()

      return {
        success: true,
        extension: { id: extensionId, manifest, extensionPath: extensionDir }
      }
    } catch (error) {
      console.error('Failed to install extension:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async installFromDirectory(extensionPath: string): Promise<ExtensionInstallResult> {
    try {
      const packageJsonPath = path.join(extensionPath, 'package.json')
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('Invalid extension: package.json not found')
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      const extensionId = `${packageJson.publisher}.${packageJson.name}`
      
      this.installedExtensions.set(extensionId, extensionPath)
      this.activeExtensions.add(extensionId) // Mark as active by default
      this.saveInstalledExtensions()
      this.saveActiveExtensions()

      return {
        success: true,
        extension: { 
          id: extensionId, 
          manifest: packageJson, 
          extensionPath 
        }
      }
    } catch (error) {
      console.error('Failed to install extension:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async uninstallExtension(extensionId: string): Promise<boolean> {
    try {
      const extensionPath = this.installedExtensions.get(extensionId)
      if (!extensionPath) {
        throw new Error('Extension not found')
      }

      // Remove from file system if it's in our managed directory
      if (extensionPath.startsWith(this.extensionsPath)) {
        await fs.promises.rmdir(extensionPath, { recursive: true })
      }

      this.installedExtensions.delete(extensionId)
      this.saveInstalledExtensions()

      return true
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
      return false
    }
  }

  async searchMarketplace(query: string, limit = 20): Promise<ExtensionDiscoveryResult[]> {
    try {
      // Return empty - no mock marketplace
      // Users must download .vsix files manually
      return []
    } catch (error) {
      console.error('Failed to search marketplace:', error)
      return []
    }
  }

  getExtensionPath(extensionId: string): string | undefined {
    return this.installedExtensions.get(extensionId)
  }

  async getExtensionManifest(extensionId: string): Promise<any | null> {
    try {
      const extensionPath = this.installedExtensions.get(extensionId)
      if (!extensionPath) return null

      const packageJsonPath = path.join(extensionPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) return null

      return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    } catch (error) {
      console.error('Failed to get extension manifest:', error)
      return null
    }
  }

  async loadExtensionFile(filePath: string): Promise<string | null> {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`Extension file not found: ${filePath}`)
        return null
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error(`Failed to load extension file ${filePath}:`, error)
      return null
    }
  }

  async executeExtension(extensionId: string): Promise<any> {
    try {
      const extensionPath = this.installedExtensions.get(extensionId)
      if (!extensionPath) {
        throw new Error(`Extension ${extensionId} not found`)
      }

      const manifest = await this.getExtensionManifest(extensionId)
      if (!manifest) {
        throw new Error(`Extension ${extensionId} has no manifest`)
      }

      console.log(`🚀 Executing extension ${extensionId} in main process`)

      // For Claude Dev specifically, let's try to properly execute the extension
      if (extensionId === 'saoudrizwan.claude-dev') {
        console.log('Attempting to properly execute Claude Dev extension...')
        
        // First try to load and execute the extension normally
        try {
          const result = await this.executeExtensionNormally(extensionId, manifest, extensionPath)
          if (result.success) {
            console.log(`✅ Claude Dev extension executed successfully`)
            return result
          }
        } catch (error) {
          console.warn('Failed to execute Claude Dev normally, falling back to manual webview:', error)
        }
        
        // Fallback: Create a manual webview panel for Claude Dev
        this.sendWebviewToRenderer(
          'claude-dev.SidebarProvider',
          'Cline',
          { viewColumn: 1 },
          { 
            enableScripts: true,
            retainContextWhenHidden: true
          }
        )
        
        console.log(`✅ Manual webview created for Claude Dev extension`)
        return { success: true }
      }

      // For other extensions, try normal loading
      return await this.executeExtensionNormally(extensionId, manifest, extensionPath)
    } catch (error) {
      console.error(`Failed to execute extension ${extensionId}:`, error)
      return { success: false, error: error.message }
    }
  }

  private async executeExtensionNormally(extensionId: string, manifest: any, extensionPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!manifest.main) {
        throw new Error(`Extension ${extensionId} has no main file`)
      }

      const mainPath = path.join(extensionPath, manifest.main)
      if (!fs.existsSync(mainPath)) {
        throw new Error(`Extension main file not found: ${mainPath}`)
      }

      // Create a mock vscode API for the main process
      const mockVscode = this.createMockVsCodeAPI()
      
      // Expose vscode API globally so the extension can require it
      global.vscode = mockVscode

      // Load the extension module
      delete require.cache[require.resolve(mainPath)]
      const extensionModule = require(mainPath)

      // Create extension context
      const context = {
        subscriptions: [],
        extensionPath,
        storagePath: path.join(extensionPath, 'storage'),
        globalStoragePath: path.join(extensionPath, 'globalStorage'),
        workspaceState: new Map(),
        globalState: new Map()
      }

      // Execute the extension's activate function
      if (typeof extensionModule.activate === 'function') {
        await extensionModule.activate(context)
        console.log(`✅ Extension ${extensionId} activated in main process`)
        return { success: true }
      } else {
        console.warn(`Extension ${extensionId} has no activate function`)
        return { success: false, error: 'No activate function' }
      }
    } catch (error) {
      console.error(`Failed to execute extension ${extensionId}:`, error)
      return { success: false, error: error.message }
    }
  }

  private createMockVsCodeAPI(): any {
    // Mock vscode API for main process
    return {
      workspace: {
        getConfiguration: () => ({}),
        onDidChangeConfiguration: () => ({ dispose: () => {} }),
        workspaceFolders: [],
        openTextDocument: () => Promise.resolve({}),
        saveAll: () => Promise.resolve(true)
      },
      window: {
        showInformationMessage: (message: string) => {
          console.log(`[Extension] Info: ${message}`)
          return Promise.resolve()
        },
        showWarningMessage: (message: string) => {
          console.log(`[Extension] Warning: ${message}`)
          return Promise.resolve()
        },
        showErrorMessage: (message: string) => {
          console.log(`[Extension] Error: ${message}`)
          return Promise.resolve()
        },
        createWebviewPanel: (viewType: string, title: string, showOptions: any, options?: any) => {
          console.log(`[Extension] Creating webview panel: ${viewType} - ${title}`)
          
          // Create a proper webview panel object
          const webviewPanel = {
            viewType,
            title,
            visible: true,
            active: true,
            webview: {
              html: '',
              onDidReceiveMessage: (listener: Function) => {
                console.log(`[Extension] Webview message listener registered for ${viewType}`)
                return { dispose: () => {} }
              },
              postMessage: (message: any) => {
                console.log(`[Extension] Webview posting message:`, message)
                return Promise.resolve(true)
              },
              asWebviewUri: (uri: any) => uri,
              cspSource: 'self'
            },
            onDidDispose: (listener: Function) => {
              return { dispose: () => {} }
            },
            onDidChangeViewState: (listener: Function) => {
              return { dispose: () => {} }
            },
            reveal: (column?: any) => {
              console.log(`[Extension] Revealing webview panel: ${title}`)
            },
            dispose: () => {
              console.log(`[Extension] Disposing webview panel: ${title}`)
            }
          }
          
          // Send webview creation event to renderer with the full webview object
          this.sendWebviewToRenderer(viewType, title, showOptions, { ...options, webviewPanel })
          
          return webviewPanel
        }
      },
      commands: {
        registerCommand: (command: string, callback: Function) => {
          console.log(`[Extension] Registered command: ${command}`)
          return { dispose: () => {} }
        },
        executeCommand: (command: string, ...args: any[]) => {
          console.log(`[Extension] Executing command: ${command}`)
          return Promise.resolve()
        }
      },
      Uri: {
        file: (path: string) => ({ fsPath: path }),
        parse: (uri: string) => ({ fsPath: uri })
      }
    }
  }

  private sendWebviewToRenderer(viewType: string, title: string, showOptions: any, options?: any): void {
    // Send webview creation event to all renderer processes
    const webviewPanel = {
      viewType,
      title,
      showOptions,
      options,
      visible: true,
      active: true,
      webview: {
        html: options?.webviewPanel?.webview?.html || '',
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: (message: any) => Promise.resolve(true)
      }
    }

    // Emit to all renderer processes
    if (global.mainWindow) {
      global.mainWindow.webContents.send('extension:webview-created', webviewPanel)
    }
  }

  private mockCSSImports(): void {
    // Mock CSS imports by intercepting require calls
    const Module = require('module')
    const originalRequire = Module.prototype.require
    const originalResolveFilename = Module._resolveFilename
    const originalLoad = Module.prototype.load

    Module.prototype.require = function(id: string) {
      // Return empty object for CSS imports
      if (id.endsWith('.css') || id.endsWith('.scss') || id.endsWith('.sass')) {
        return {}
      }
      
      // Return original require for everything else
      return originalRequire.apply(this, arguments)
    }

    // Also mock the filename resolution to prevent file not found errors
    Module._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
      if (request.endsWith('.css') || request.endsWith('.scss') || request.endsWith('.sass')) {
        // Return a dummy path for CSS files
        return __filename
      }
      
      return originalResolveFilename.call(this, request, parent, isMain, options)
    }

    // Mock module loading for CSS files
    Module.prototype.load = function(filename: string) {
      if (filename.endsWith('.css') || filename.endsWith('.scss') || filename.endsWith('.sass')) {
        this.loaded = true
        return
      }
      
      return originalLoad.call(this, filename)
    }

    // Also add support for ES6 import syntax
    const originalExtensions = Module._extensions
    Module._extensions['.css'] = function(module: any, filename: string) {
      module.exports = {}
    }
    Module._extensions['.scss'] = function(module: any, filename: string) {
      module.exports = {}
    }
    Module._extensions['.sass'] = function(module: any, filename: string) {
      module.exports = {}
    }

    console.log('✅ CSS imports mocked for Node.js environment')
  }

  private async extractManifestFromVsix(vsixPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      yauzl.open(vsixPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err)
          return
        }

        zipfile!.readEntry()
        
        zipfile!.on('entry', (entry) => {
          if (entry.fileName === 'extension/package.json') {
            zipfile!.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err)
                return
              }

              let data = ''
              readStream!.on('data', chunk => data += chunk)
              readStream!.on('end', () => {
                try {
                  const packageJson = JSON.parse(data)
                  resolve(packageJson)
                } catch (parseError) {
                  reject(parseError)
                }
              })
            })
          } else {
            zipfile!.readEntry()
          }
        })

        zipfile!.on('end', () => {
          reject(new Error('package.json not found in VSIX'))
        })
      })
    })
  }

  private async extractVsix(vsixPath: string, targetDir: string): Promise<void> {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    return new Promise((resolve, reject) => {
      yauzl.open(vsixPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err)
          return
        }

        zipfile!.readEntry()
        
        zipfile!.on('entry', (entry) => {
          // Skip extension/ prefix in paths
          const relativePath = entry.fileName.startsWith('extension/') 
            ? entry.fileName.substring('extension/'.length)
            : entry.fileName

          if (relativePath.endsWith('/')) {
            // Directory entry
            const dirPath = path.join(targetDir, relativePath)
            fs.mkdirSync(dirPath, { recursive: true })
            zipfile!.readEntry()
          } else {
            // File entry
            const filePath = path.join(targetDir, relativePath)
            const fileDir = path.dirname(filePath)
            
            fs.mkdirSync(fileDir, { recursive: true })
            
            zipfile!.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err)
                return
              }

              const writeStream = fs.createWriteStream(filePath)
              readStream!.pipe(writeStream)
              
              writeStream.on('close', () => {
                zipfile!.readEntry()
              })
              
              writeStream.on('error', reject)
            })
          }
        })

        zipfile!.on('end', resolve)
        zipfile!.on('error', reject)
      })
    })
  }

  private loadInstalledExtensions(): void {
    const registryPath = path.join(this.extensionsPath, 'extensions.json')
    
    if (fs.existsSync(registryPath)) {
      try {
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
        this.installedExtensions = new Map(Object.entries(registry))
        console.log(`✅ Extension registry loaded from ${registryPath}`)
        console.log(`📦 Found ${this.installedExtensions.size} extensions:`, Array.from(this.installedExtensions.keys()))
      } catch (error) {
        console.warn('Failed to load extension registry:', error)
      }
    } else {
      console.log(`📦 No extension registry found at ${registryPath}`)
    }
  }

  private saveInstalledExtensions(): void {
    const registryPath = path.join(this.extensionsPath, 'extensions.json')
    const registry = Object.fromEntries(this.installedExtensions)
    
    try {
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2))
      console.log(`✅ Extension registry saved to ${registryPath}`)
      console.log(`📦 Extensions in registry:`, Object.keys(registry))
    } catch (error) {
      console.error('Failed to save extension registry:', error)
    }
  }

  private loadActiveExtensions(): void {
    const activePath = path.join(this.extensionsPath, 'active-extensions.json')
    
    if (fs.existsSync(activePath)) {
      try {
        const activeList = JSON.parse(fs.readFileSync(activePath, 'utf-8'))
        this.activeExtensions = new Set(activeList)
        console.log(`✅ Active extensions loaded from ${activePath}`)
        console.log(`🔥 Found ${this.activeExtensions.size} active extensions:`, Array.from(this.activeExtensions))
      } catch (error) {
        console.warn('Failed to load active extensions:', error)
      }
    } else {
      console.log(`🔥 No active extensions file found at ${activePath}`)
    }
  }

  private saveActiveExtensions(): void {
    const activePath = path.join(this.extensionsPath, 'active-extensions.json')
    const activeList = Array.from(this.activeExtensions)
    
    try {
      fs.writeFileSync(activePath, JSON.stringify(activeList, null, 2))
      console.log(`✅ Active extensions saved to ${activePath}`)
      console.log(`🔥 Active extensions:`, activeList)
    } catch (error) {
      console.error('Failed to save active extensions:', error)
    }
  }
}