import { VSCodeExtensionHost } from './vscode-extension-host'
import { ExtensionManagerRenderer } from './extension-manager-renderer'

export class ExtensionInstaller {
  private extensionHost: VSCodeExtensionHost
  private extensionManager: ExtensionManagerRenderer

  constructor(extensionHost: VSCodeExtensionHost, extensionManager: ExtensionManagerRenderer) {
    this.extensionHost = extensionHost
    this.extensionManager = extensionManager
  }

  // No more mock installations - only real extensions via .vsix files
  async installPopularExtensions(): Promise<void> {
    console.log('Extension installer ready. Please load real .vsix files using "Load Local" button.')
  }

  async createSampleExtension(): Promise<void> {
    console.log('No sample extensions created. Please load real .vsix files.')
  }
}