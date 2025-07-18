import * as fs from 'fs'
import * as path from 'path'
import * as yauzl from 'yauzl'
import { VSCodeExtensionHost, VSCodeExtensionManifest, VSCodeExtension } from './vscode-extension-host'

export interface ExtensionInstallResult {
  success: boolean
  extension?: VSCodeExtension
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

export class ExtensionManager {
  private extensionHost: VSCodeExtensionHost
  private extensionsPath: string
  private installedExtensions: Map<string, string> = new Map()

  constructor(extensionHost: VSCodeExtensionHost, extensionsPath?: string) {
    this.extensionHost = extensionHost
    this.extensionsPath = extensionsPath || path.join(process.cwd(), '.vscode-extensions')
    this.ensureExtensionsDirectory()
    this.loadInstalledExtensions()
  }

  private ensureExtensionsDirectory(): void {
    if (!fs.existsSync(this.extensionsPath)) {
      fs.mkdirSync(this.extensionsPath, { recursive: true })
    }
  }

  async installFromVsix(vsixPath: string): Promise<ExtensionInstallResult> {
    try {
      const manifest = await this.extractManifestFromVsix(vsixPath)
      const extensionId = `${manifest.publisher}.${manifest.name}`
      const extensionDir = path.join(this.extensionsPath, extensionId)

      // Extract the VSIX to the extensions directory
      await this.extractVsix(vsixPath, extensionDir)

      // Load the extension
      const extension = await this.loadExtensionFromDirectory(extensionDir)
      
      this.installedExtensions.set(extensionId, extensionDir)
      this.saveInstalledExtensions()

      return {
        success: true,
        extension
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

      const extension = await this.loadExtensionFromDirectory(extensionPath)
      const extensionId = extension.id
      
      this.installedExtensions.set(extensionId, extensionPath)
      this.saveInstalledExtensions()

      return {
        success: true,
        extension
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

      // Deactivate if active
      const extension = this.extensionHost.getExtension(extensionId)
      if (extension?.isActive) {
        await this.extensionHost.deactivateExtension(extensionId)
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
      // Simulate marketplace search - in a real implementation, this would call the VS Code marketplace API
      const mockResults: ExtensionDiscoveryResult[] = [
        {
          id: 'ms-python.python',
          name: 'Python',
          description: 'IntelliSense, linting, debugging, code navigation, and more for Python',
          version: '2024.0.0',
          publisher: 'ms-python',
          rating: 4.8,
          installs: 50000000
        },
        {
          id: 'ms-vscode.vscode-typescript-next',
          name: 'TypeScript Importer',
          description: 'Auto import ES6/TS/JSX/TSX modules',
          version: '4.9.0',
          publisher: 'ms-vscode',
          rating: 4.5,
          installs: 25000000
        },
        {
          id: 'esbenp.prettier-vscode',
          name: 'Prettier - Code formatter',
          description: 'Code formatter using prettier',
          version: '10.1.0',
          publisher: 'esbenp',
          rating: 4.7,
          installs: 30000000
        },
        {
          id: 'bradlc.vscode-tailwindcss',
          name: 'Tailwind CSS IntelliSense',
          description: 'Intelligent Tailwind CSS tooling for VS Code',
          version: '0.10.0',
          publisher: 'bradlc',
          rating: 4.6,
          installs: 8000000
        }
      ]

      return mockResults.filter(ext => 
        ext.name.toLowerCase().includes(query.toLowerCase()) ||
        ext.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit)
    } catch (error) {
      console.error('Failed to search marketplace:', error)
      return []
    }
  }

  async downloadAndInstall(extensionId: string): Promise<ExtensionInstallResult> {
    try {
      // In a real implementation, this would download from the VS Code marketplace
      // For now, we'll simulate the process
      const mockVsixUrl = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${extensionId.split('.')[0]}/vsextensions/${extensionId.split('.')[1]}/latest/vspackage`
      
      // Simulate download process
      console.log(`Downloading extension ${extensionId} from marketplace...`)
      
      // For demo purposes, create a mock extension
      const mockExtension = await this.createMockExtension(extensionId)
      
      return {
        success: true,
        extension: mockExtension
      }
    } catch (error) {
      console.error('Failed to download and install extension:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  getInstalledExtensions(): string[] {
    return Array.from(this.installedExtensions.keys())
  }

  getExtensionPath(extensionId: string): string | undefined {
    return this.installedExtensions.get(extensionId)
  }

  private async loadExtensionFromDirectory(extensionPath: string): Promise<VSCodeExtension> {
    const packageJsonPath = path.join(extensionPath, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    
    const manifest: VSCodeExtensionManifest = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      publisher: packageJson.publisher,
      engines: packageJson.engines,
      activationEvents: packageJson.activationEvents,
      main: packageJson.main,
      contributes: packageJson.contributes
    }

    const extension = await this.extensionHost.loadExtension(manifest, `${packageJson.publisher}.${packageJson.name}`)
    extension.extensionPath = extensionPath

    // If there's a main entry point, try to load and activate
    if (packageJson.main) {
      try {
        const mainPath = path.resolve(extensionPath, packageJson.main)
        if (fs.existsSync(mainPath)) {
          const extensionModule = require(mainPath)
          
          if (extensionModule.activate) {
            extension.activate = extensionModule.activate
          }
          
          if (extensionModule.deactivate) {
            extension.deactivate = extensionModule.deactivate
          }
        }
      } catch (error) {
        console.warn(`Failed to load extension main file: ${error}`)
      }
    }

    return extension
  }

  private async extractManifestFromVsix(vsixPath: string): Promise<VSCodeExtensionManifest> {
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
                  resolve({
                    name: packageJson.name,
                    version: packageJson.version,
                    description: packageJson.description,
                    publisher: packageJson.publisher,
                    engines: packageJson.engines,
                    activationEvents: packageJson.activationEvents,
                    main: packageJson.main,
                    contributes: packageJson.contributes
                  })
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
      } catch (error) {
        console.warn('Failed to load extension registry:', error)
      }
    }
  }

  private saveInstalledExtensions(): void {
    const registryPath = path.join(this.extensionsPath, 'extensions.json')
    const registry = Object.fromEntries(this.installedExtensions)
    
    try {
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2))
    } catch (error) {
      console.error('Failed to save extension registry:', error)
    }
  }

  private async createMockExtension(extensionId: string): Promise<VSCodeExtension> {
    const [publisher, name] = extensionId.split('.')
    
    const manifest: VSCodeExtensionManifest = {
      name,
      version: '1.0.0',
      description: `Mock extension for ${name}`,
      publisher,
      engines: { vscode: '^1.74.0' },
      activationEvents: ['*'],
      contributes: {
        commands: [{
          command: `${extensionId}.sayHello`,
          title: `Say Hello - ${name}`
        }]
      }
    }

    const extension = await this.extensionHost.loadExtension(manifest, extensionId)
    
    // Add mock activation
    extension.activate = async (context) => {
      console.log(`Mock extension ${extensionId} activated`)
      
      const disposable = this.extensionHost.commands.registerCommand(
        `${extensionId}.sayHello`,
        () => {
          this.extensionHost.window.showInformationMessage(`Hello from ${name}!`)
        }
      )
      
      context.subscriptions.push(disposable)
    }

    return extension
  }
}