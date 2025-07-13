// Project API Service - Renderer Side
// This file provides easy access to project management functionality from the renderer process

export interface FileStats {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  lastModified: Date;
  created: Date;
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  size?: number;
  lastModified?: Date;
}

export interface SearchResult {
  filePath: string;
  line: number;
  column: number;
  content: string;
  lineContent: string;
}

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: Date;
}

export interface SearchOptions {
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface SearchInFilesOptions {
  filePatterns?: string[];
  excludePatterns?: string[];
}

export interface DirectoryTreeOptions {
  depth?: number;
  includeFiles?: boolean;
}

declare global {
  interface Window {
    projectApi: {
      // Project management
      openFolder: (folderPath?: string) => Promise<string | null>;
      getCurrentProject: () => Promise<string | null>;
      setCurrentProject: (projectPath: string) => Promise<string>;
      
      // File operations
      openFile: (filePath: string) => Promise<{ content: string; path: string }>;
      saveFile: (filePath: string, content: string) => Promise<boolean>;
      createFile: (filePath: string, content?: string) => Promise<boolean>;
      createFolder: (folderPath: string) => Promise<boolean>;
      deleteFile: (filePath: string) => Promise<boolean>;
      deleteFolder: (folderPath: string) => Promise<boolean>;
      renameFile: (oldPath: string, newPath: string) => Promise<boolean>;
      renameFolder: (oldPath: string, newPath: string) => Promise<boolean>;
      getFileStats: (filePath: string) => Promise<FileStats>;
      
      // Directory operations
      getDirectoryTree: (rootPath: string, options?: DirectoryTreeOptions) => Promise<DirectoryNode>;
      
      // File watching
      watchFileChanges: (filePath: string) => Promise<boolean>;
      unwatchFileChanges: (filePath: string) => Promise<boolean>;
      
      // Search
      searchFiles: (query: string, rootPath?: string, options?: SearchOptions) => Promise<string[]>;
      searchInFiles: (query: string, rootPath?: string, options?: SearchInFilesOptions) => Promise<SearchResult[]>;
      
      // Recent projects
      getRecentProjects: () => Promise<RecentProject[]>;
      addRecentProject: (projectPath: string, projectName?: string) => Promise<RecentProject[]>;
      removeRecentProject: (projectPath: string) => Promise<RecentProject[]>;
      setLastOpenedProject: (projectPath: string) => Promise<void>;
      getLastOpenedProject: () => Promise<string | null>;
      
      // Event listeners
      onFileChanged: (callback: (filePath: string, eventType: string) => void) => () => void;
      onFileCreated: (callback: (filePath: string) => void) => () => void;
      onFileDeleted: (callback: (filePath: string) => void) => () => void;
      onFileRenamed: (callback: (oldPath: string, newPath: string) => void) => () => void;
    };
  }
}

/**
 * Project API Service - provides methods to interact with project files and folders
 */
export class ProjectApiService {
  private static instance: ProjectApiService;
  
  private constructor() {}
  
  static getInstance(): ProjectApiService {
    if (!ProjectApiService.instance) {
      ProjectApiService.instance = new ProjectApiService();
    }
    return ProjectApiService.instance;
  }
  
  /**
   * Check if project API is available
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.projectApi;
  }
  
  /**
   * Open a folder dialog and set as current project
   */
  async openFolder(folderPath?: string): Promise<string | null> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.openFolder(folderPath);
  }
  
  /**
   * Get the current project path
   */
  async getCurrentProject(): Promise<string | null> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.getCurrentProject();
  }
  
  /**
   * Set the current project path
   */
  async setCurrentProject(projectPath: string): Promise<string> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.setCurrentProject(projectPath);
  }
  
  /**
   * Open and read a file
   */
  async openFile(filePath: string): Promise<{ content: string; path: string }> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.openFile(filePath);
  }
  
  /**
   * Save content to a file
   */
  async saveFile(filePath: string, content: string): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.saveFile(filePath, content);
  }
  
  /**
   * Create a new file
   */
  async createFile(filePath: string, content: string = ''): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.createFile(filePath, content);
  }
  
  /**
   * Create a new folder
   */
  async createFolder(folderPath: string): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.createFolder(folderPath);
  }
  
  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.deleteFile(filePath);
  }
  
  /**
   * Delete a folder
   */
  async deleteFolder(folderPath: string): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.deleteFolder(folderPath);
  }
  
  /**
   * Rename a file
   */
  async renameFile(oldPath: string, newPath: string): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.renameFile(oldPath, newPath);
  }
  
  /**
   * Rename a folder
   */
  async renameFolder(oldPath: string, newPath: string): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.renameFolder(oldPath, newPath);
  }
  
  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<FileStats> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.getFileStats(filePath);
  }
  
  /**
   * Get directory tree structure
   */
  async getDirectoryTree(rootPath: string, options?: DirectoryTreeOptions): Promise<DirectoryNode> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.getDirectoryTree(rootPath, options);
  }
  
  /**
   * Watch for file changes
   */
  async watchFileChanges(filePath: string): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.watchFileChanges(filePath);
  }
  
  /**
   * Stop watching file changes
   */
  async unwatchFileChanges(filePath: string): Promise<boolean> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.unwatchFileChanges(filePath);
  }
  
  /**
   * Search for files by name
   */
  async searchFiles(query: string, rootPath?: string, options?: SearchOptions): Promise<string[]> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.searchFiles(query, rootPath, options);
  }
  
  /**
   * Search for text content within files
   */
  async searchInFiles(query: string, rootPath?: string, options?: SearchInFilesOptions): Promise<SearchResult[]> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.searchInFiles(query, rootPath, options);
  }
  
  /**
   * Get recent projects
   */
  async getRecentProjects(): Promise<RecentProject[]> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.getRecentProjects();
  }
  
  /**
   * Add a project to recent projects
   */
  async addRecentProject(projectPath: string, projectName?: string): Promise<RecentProject[]> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.addRecentProject(projectPath, projectName);
  }
  
  /**
   * Remove a project from recent projects
   */
  async removeRecentProject(projectPath: string): Promise<RecentProject[]> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.removeRecentProject(projectPath);
  }

  /**
   * Set the last opened project for auto-open on startup
   */
  async setLastOpenedProject(projectPath: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.setLastOpenedProject(projectPath);
  }

  /**
   * Get the last opened project
   */
  async getLastOpenedProject(): Promise<string | null> {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return await window.projectApi.getLastOpenedProject();
  }

  /**
   * Listen for file change events
   */
  onFileChanged(callback: (filePath: string, eventType: string) => void): () => void {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return window.projectApi.onFileChanged(callback);
  }
  
  /**
   * Listen for file creation events
   */
  onFileCreated(callback: (filePath: string) => void): () => void {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return window.projectApi.onFileCreated(callback);
  }
  
  /**
   * Listen for file deletion events
   */
  onFileDeleted(callback: (filePath: string) => void): () => void {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return window.projectApi.onFileDeleted(callback);
  }
  
  /**
   * Listen for file rename events
   */
  onFileRenamed(callback: (oldPath: string, newPath: string) => void): () => void {
    if (!this.isAvailable()) throw new Error('Project API not available');
    return window.projectApi.onFileRenamed(callback);
  }
}

// Export singleton instance
export const projectApi = ProjectApiService.getInstance();