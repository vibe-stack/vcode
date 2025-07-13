import {
  PROJECT_OPEN_FOLDER_CHANNEL,
  PROJECT_OPEN_FILE_CHANNEL,
  PROJECT_SAVE_FILE_CHANNEL,
  PROJECT_CREATE_FILE_CHANNEL,
  PROJECT_CREATE_FOLDER_CHANNEL,
  PROJECT_DELETE_FILE_CHANNEL,
  PROJECT_DELETE_FOLDER_CHANNEL,
  PROJECT_RENAME_FILE_CHANNEL,
  PROJECT_RENAME_FOLDER_CHANNEL,
  PROJECT_GET_DIRECTORY_TREE_CHANNEL,
  PROJECT_WATCH_FILE_CHANGES_CHANNEL,
  PROJECT_UNWATCH_FILE_CHANGES_CHANNEL,
  PROJECT_SEARCH_FILES_CHANNEL,
  PROJECT_SEARCH_IN_FILES_CHANNEL,
  PROJECT_GET_FILE_STATS_CHANNEL,
  PROJECT_GET_RECENT_PROJECTS_CHANNEL,
  PROJECT_ADD_RECENT_PROJECT_CHANNEL,
  PROJECT_REMOVE_RECENT_PROJECT_CHANNEL,
  PROJECT_GET_CURRENT_PROJECT_CHANNEL,
  PROJECT_SET_CURRENT_PROJECT_CHANNEL,
  PROJECT_SET_LAST_OPENED_PROJECT_CHANNEL,
  PROJECT_GET_LAST_OPENED_PROJECT_CHANNEL,
} from "./project-channels";

export function exposeProjectContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");
  
  contextBridge.exposeInMainWorld("projectApi", {
    // Project management
    openFolder: (folderPath?: string) => ipcRenderer.invoke(PROJECT_OPEN_FOLDER_CHANNEL, folderPath),
    getCurrentProject: () => ipcRenderer.invoke(PROJECT_GET_CURRENT_PROJECT_CHANNEL),
    setCurrentProject: (projectPath: string) => ipcRenderer.invoke(PROJECT_SET_CURRENT_PROJECT_CHANNEL, projectPath),
    
    // File operations
    openFile: (filePath: string) => ipcRenderer.invoke(PROJECT_OPEN_FILE_CHANNEL, filePath),
    saveFile: (filePath: string, content: string) => ipcRenderer.invoke(PROJECT_SAVE_FILE_CHANNEL, filePath, content),
    createFile: (filePath: string, content?: string) => ipcRenderer.invoke(PROJECT_CREATE_FILE_CHANNEL, filePath, content),
    createFolder: (folderPath: string) => ipcRenderer.invoke(PROJECT_CREATE_FOLDER_CHANNEL, folderPath),
    deleteFile: (filePath: string) => ipcRenderer.invoke(PROJECT_DELETE_FILE_CHANNEL, filePath),
    deleteFolder: (folderPath: string) => ipcRenderer.invoke(PROJECT_DELETE_FOLDER_CHANNEL, folderPath),
    renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke(PROJECT_RENAME_FILE_CHANNEL, oldPath, newPath),
    renameFolder: (oldPath: string, newPath: string) => ipcRenderer.invoke(PROJECT_RENAME_FOLDER_CHANNEL, oldPath, newPath),
    getFileStats: (filePath: string) => ipcRenderer.invoke(PROJECT_GET_FILE_STATS_CHANNEL, filePath),
    
    // Directory operations
    getDirectoryTree: (rootPath: string, options?: { depth?: number; includeFiles?: boolean }) => 
      ipcRenderer.invoke(PROJECT_GET_DIRECTORY_TREE_CHANNEL, rootPath, options),
    
    // File watching
    watchFileChanges: (filePath: string) => ipcRenderer.invoke(PROJECT_WATCH_FILE_CHANGES_CHANNEL, filePath),
    unwatchFileChanges: (filePath: string) => ipcRenderer.invoke(PROJECT_UNWATCH_FILE_CHANGES_CHANNEL, filePath),
    
    // Search
    searchFiles: (query: string, rootPath?: string, options?: { includePatterns?: string[]; excludePatterns?: string[] }) => 
      ipcRenderer.invoke(PROJECT_SEARCH_FILES_CHANNEL, query, rootPath, options),
    searchInFiles: (query: string, rootPath?: string, options?: { filePatterns?: string[]; excludePatterns?: string[] }) => 
      ipcRenderer.invoke(PROJECT_SEARCH_IN_FILES_CHANNEL, query, rootPath, options),
    
    // Recent projects
    getRecentProjects: () => ipcRenderer.invoke(PROJECT_GET_RECENT_PROJECTS_CHANNEL),
    addRecentProject: (projectPath: string, projectName?: string) => 
      ipcRenderer.invoke(PROJECT_ADD_RECENT_PROJECT_CHANNEL, projectPath, projectName),
    removeRecentProject: (projectPath: string) => ipcRenderer.invoke(PROJECT_REMOVE_RECENT_PROJECT_CHANNEL, projectPath),
    
    // Last opened project
    setLastOpenedProject: (projectPath: string) => ipcRenderer.invoke(PROJECT_SET_LAST_OPENED_PROJECT_CHANNEL, projectPath),
    getLastOpenedProject: () => ipcRenderer.invoke(PROJECT_GET_LAST_OPENED_PROJECT_CHANNEL),
    
    // Event listeners
    onFileChanged: (callback: (filePath: string, eventType: string) => void) => {
      ipcRenderer.on("project:file-changed", (_: any, filePath: string, eventType: string) => callback(filePath, eventType));
      return () => ipcRenderer.removeAllListeners("project:file-changed");
    },
    onFileCreated: (callback: (filePath: string) => void) => {
      ipcRenderer.on("project:file-created", (_: any, filePath: string) => callback(filePath));
      return () => ipcRenderer.removeAllListeners("project:file-created");
    },
    onFileDeleted: (callback: (filePath: string) => void) => {
      ipcRenderer.on("project:file-deleted", (_: any, filePath: string) => callback(filePath));
      return () => ipcRenderer.removeAllListeners("project:file-deleted");
    },
    onFileRenamed: (callback: (oldPath: string, newPath: string) => void) => {
      ipcRenderer.on("project:file-renamed", (_: any, oldPath: string, newPath: string) => callback(oldPath, newPath));
      return () => ipcRenderer.removeAllListeners("project:file-renamed");
    },
  });
}
