import { contextBridge, ipcRenderer } from "electron";

export function exposeExtensionContext() {
  try {
    contextBridge.exposeInMainWorld("extensionAPI", {
      // Extension installation and management
      installFromVsix: (vsixPath: string) => 
        ipcRenderer.invoke('extension:install-vsix', vsixPath),
      
      installFromDirectory: (extensionPath: string) => 
        ipcRenderer.invoke('extension:install-directory', extensionPath),
      
      uninstall: (extensionId: string) => 
        ipcRenderer.invoke('extension:uninstall', extensionId),
      
      searchMarketplace: (query: string, limit?: number) => 
        ipcRenderer.invoke('extension:search-marketplace', query, limit),
      
      getInstalled: () => 
        ipcRenderer.invoke('extension:get-installed'),
      
      getManifest: (extensionId: string) => 
        ipcRenderer.invoke('extension:get-manifest', extensionId),
      
      getExtensionPath: (extensionId: string) => 
        ipcRenderer.invoke('extension:get-extension-path', extensionId),
      
      loadExtensionFile: (filePath: string) => 
        ipcRenderer.invoke('extension:load-file', filePath),
      
      executeExtension: (extensionId: string) => 
        ipcRenderer.invoke('extension:execute', extensionId),
      
      // Extension activation management
      setExtensionActive: (extensionId: string, active: boolean) =>
        ipcRenderer.invoke('extension:set-active', extensionId, active),
      
      getActiveExtensions: () =>
        ipcRenderer.invoke('extension:get-active'),
      
      isExtensionActive: (extensionId: string) =>
        ipcRenderer.invoke('extension:is-active', extensionId),
      
      // File dialog for extension loading
      showOpenDialog: (options: any) => 
        ipcRenderer.invoke('dialog:showOpenDialog', options),
    });

    console.log("✅ Extension context exposed to renderer");
  } catch (error) {
    console.error("❌ Failed to expose extension context:", error);
  }
}