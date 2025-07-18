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

export class ExtensionManagerRenderer {
  private extensionHost: VSCodeExtensionHost

  constructor(extensionHost: VSCodeExtensionHost) {
    this.extensionHost = extensionHost
  }

  async initialize(): Promise<void> {
    try {
      // Load previously installed extensions from main process
      const installedExtensionIds = await window.extensionAPI.getInstalled()
      
      for (const extensionId of installedExtensionIds) {
        try {
          const manifest = await window.extensionAPI.getManifest(extensionId)
          const extensionPath = await window.extensionAPI.getExtensionPath(extensionId)
          const isActive = await window.extensionAPI.isExtensionActive(extensionId)
          
          if (manifest && extensionPath) {
            console.log(`Loading extension ${extensionId} in renderer (active: ${isActive})`)
            
            // Load the extension in the renderer for UI display
            const extension = await this.extensionHost.loadExtension(
              manifest, 
              extensionId,
              extensionPath
            )
            
            // Only activate if it was previously active
            if (isActive) {
              try {
                await this.extensionHost.activateExtension(extensionId)
                console.log(`✅ Extension ${extensionId} activated in renderer`)
                
                // Also execute the extension in the main process where Node.js modules work
                try {
                  const result = await window.extensionAPI.executeExtension(extensionId)
                  if (result.success) {
                    console.log(`✅ Extension ${extensionId} executed in main process`)
                  } else {
                    console.warn(`Failed to execute extension ${extensionId} in main process:`, result.error)
                  }
                } catch (error) {
                  console.error(`Failed to execute extension ${extensionId} in main process:`, error)
                }
                
                console.log(`✅ Reloaded and activated extension: ${extensionId}`)
              } catch (error) {
                console.warn(`Failed to activate extension ${extensionId} in renderer:`, error)
              }
            } else {
              console.log(`📦 Extension ${extensionId} loaded but not activated (disabled)`)
            }
          }
        } catch (error) {
          console.warn(`Failed to reload extension ${extensionId}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to initialize extensions:', error)
    }
  }

  private async getExtensionPathFromMain(extensionId: string): Promise<string | null> {
    try {
      // We need to add this IPC method to get the extension path
      return await window.extensionAPI.getExtensionPath(extensionId)
    } catch (error) {
      console.warn(`Failed to get extension path for ${extensionId}:`, error)
      return null
    }
  }

  async installFromVsix(vsixPath: string): Promise<ExtensionInstallResult> {
    try {
      // Use IPC to install in main process
      const result = await window.extensionAPI.installFromVsix(vsixPath)
      
      if (result.success && result.extension) {
        // Load the extension in the renderer
        const extension = await this.extensionHost.loadExtension(
          result.extension.manifest, 
          result.extension.id,
          result.extension.extensionPath
        )
        
        // Activate the extension automatically
        try {
          await this.extensionHost.activateExtension(result.extension.id)
          console.log(`✅ Extension ${result.extension.id} activated after installation`)
        } catch (error) {
          console.warn(`Failed to activate extension ${result.extension.id} after installation:`, error)
        }
        
        return { success: true, extension }
      }
      
      return result
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
      // Use IPC to install in main process
      const result = await window.extensionAPI.installFromDirectory(extensionPath)
      
      if (result.success && result.extension) {
        // Load the extension in the renderer
        const extension = await this.extensionHost.loadExtension(
          result.extension.manifest, 
          result.extension.id,
          result.extension.extensionPath
        )
        
        // Activate the extension automatically
        try {
          await this.extensionHost.activateExtension(result.extension.id)
          console.log(`✅ Extension ${result.extension.id} activated after installation`)
        } catch (error) {
          console.warn(`Failed to activate extension ${result.extension.id} after installation:`, error)
        }
        
        return { success: true, extension }
      }
      
      return result
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
      // Deactivate if active
      const extension = this.extensionHost.getExtension(extensionId)
      if (extension?.isActive) {
        await this.extensionHost.deactivateExtension(extensionId)
      }

      // Use IPC to uninstall in main process
      return await window.extensionAPI.uninstall(extensionId)
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
      return false
    }
  }

  async searchMarketplace(query: string, limit = 20): Promise<ExtensionDiscoveryResult[]> {
    try {
      return await window.extensionAPI.searchMarketplace(query, limit)
    } catch (error) {
      console.error('Failed to search marketplace:', error)
      return []
    }
  }

  async downloadAndInstall(extensionId: string): Promise<ExtensionInstallResult> {
    try {
      // This would require a real marketplace API implementation
      // For now, return an error asking user to download .vsix manually
      return {
        success: false,
        error: 'Please download the .vsix file manually from VS Code marketplace and use "Load Local"'
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
    // Return extensions from the extension host
    return this.extensionHost.getExtensions().map(ext => ext.id)
  }

  getExtensionPath(extensionId: string): string | undefined {
    const extension = this.extensionHost.getExtension(extensionId)
    return extension?.extensionPath
  }

  // No mock extensions - only real extensions from .vsix files
}