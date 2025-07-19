import { ipcMain, dialog, BrowserWindow } from "electron";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { FSWatcher } from "fs";
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
  PROJECT_FILE_CHANGED_EVENT,
  PROJECT_FILE_CREATED_EVENT,
  PROJECT_FILE_DELETED_EVENT,
  PROJECT_FILE_RENAMED_EVENT,
} from "./project-channels";

interface FileStats {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  lastModified: Date;
  created: Date;
}

interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  size?: number;
  lastModified?: Date;
}

interface SearchResult {
  filePath: string;
  line: number;
  column: number;
  content: string;
  lineContent: string;
}

interface RecentProject {
  path: string;
  name: string;
  lastOpened: Date;
}

// Global state
let currentProjectPath: string | null = null;
let lastOpenedProjectPath: string | null = null;
let recentProjects: RecentProject[] = [];
let fileWatchers: Map<string, FSWatcher> = new Map();
let mainWindow: BrowserWindow | null = null;

// Load last opened project from storage
async function loadLastOpenedProject(): Promise<void> {
  try {
    const userDataPath = require('electron').app.getPath('userData');
    const lastOpenedPath = path.join(userDataPath, 'last-opened-project.json');
    
    if (fsSync.existsSync(lastOpenedPath)) {
      const data = await fs.readFile(lastOpenedPath, 'utf8');
      const parsed = JSON.parse(data);
      lastOpenedProjectPath = parsed.path || null;
    }
  } catch (error) {
    console.error('Error loading last opened project:', error);
    lastOpenedProjectPath = null;
  }
}

// Save last opened project to storage
async function saveLastOpenedProject(): Promise<void> {
  try {
    const userDataPath = require('electron').app.getPath('userData');
    const lastOpenedPath = path.join(userDataPath, 'last-opened-project.json');
    
    const data = { path: lastOpenedProjectPath };
    await fs.writeFile(lastOpenedPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving last opened project:', error);
  }
}

// Load recent projects from storage
async function loadRecentProjects(): Promise<void> {
  try {
    const userDataPath = require('electron').app.getPath('userData');
    const recentProjectsPath = path.join(userDataPath, 'recent-projects.json');
    
    if (fsSync.existsSync(recentProjectsPath)) {
      const data = await fs.readFile(recentProjectsPath, 'utf8');
      recentProjects = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading recent projects:', error);
    recentProjects = [];
  }
}

// Save recent projects to storage
async function saveRecentProjects(): Promise<void> {
  try {
    const userDataPath = require('electron').app.getPath('userData');
    const recentProjectsPath = path.join(userDataPath, 'recent-projects.json');
    
    await fs.writeFile(recentProjectsPath, JSON.stringify(recentProjects, null, 2));
  } catch (error) {
    console.error('Error saving recent projects:', error);
  }
}

// Utility function to get file stats
async function getFileStats(filePath: string): Promise<FileStats> {
  const stats = await fs.stat(filePath);
  return {
    name: path.basename(filePath),
    path: filePath,
    size: stats.size,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    lastModified: stats.mtime,
    created: stats.birthtime,
  };
}

// Build directory tree recursively
async function buildDirectoryTree(
  rootPath: string,
  options: { depth?: number; includeFiles?: boolean } = {}
): Promise<DirectoryNode> {
  const { depth = 3, includeFiles = true } = options;
  
  const stats = await fs.stat(rootPath);
  const node: DirectoryNode = {
    name: path.basename(rootPath),
    path: rootPath,
    type: stats.isDirectory() ? 'directory' : 'file',
    lastModified: stats.mtime,
  };

  if (stats.isFile()) {
    node.size = stats.size;
    return node;
  }

  if (stats.isDirectory() && depth > 0) {
    try {
      const entries = await fs.readdir(rootPath);
      node.children = [];

      for (const entry of entries) {
        // Skip hidden files and common ignore patterns
        if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'build') {
          continue;
        }

        const fullPath = path.join(rootPath, entry);
        const entryStats = await fs.stat(fullPath);

        if (entryStats.isDirectory()) {
          const childNode = await buildDirectoryTree(fullPath, { depth: depth - 1, includeFiles });
          node.children.push(childNode);
        } else if (includeFiles && entryStats.isFile()) {
          node.children.push({
            name: entry,
            path: fullPath,
            type: 'file',
            size: entryStats.size,
            lastModified: entryStats.mtime,
          });
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${rootPath}:`, error);
    }
  }

  return node;
}

// Search for files by name
async function searchFiles(
  query: string,
  rootPath: string,
  options: { includePatterns?: string[]; excludePatterns?: string[] } = {}
): Promise<string[]> {
  const { includePatterns = [], excludePatterns = ['node_modules', 'dist', 'build', '.git'] } = options;
  const results: string[] = [];

  async function searchInDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stats = await fs.stat(fullPath);

        // Skip excluded patterns
        if (excludePatterns.some(pattern => entry.includes(pattern))) {
          continue;
        }

        if (stats.isDirectory()) {
          await searchInDirectory(fullPath);
        } else if (stats.isFile()) {
          // Check if filename matches query
          if (entry.toLowerCase().includes(query.toLowerCase())) {
            // Check include patterns if specified
            if (includePatterns.length === 0 || includePatterns.some(pattern => entry.includes(pattern))) {
              results.push(fullPath);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error searching in directory ${dirPath}:`, error);
    }
  }

  await searchInDirectory(rootPath);
  return results;
}

// Search for text content within files
async function searchInFiles(
  query: string,
  rootPath: string,
  options: { filePatterns?: string[]; excludePatterns?: string[] } = {}
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Read gitignore patterns
  const gitignorePatterns = await getGitignorePatterns(rootPath);
  
  // Default exclude patterns if none provided
  const defaultExcludes = ['node_modules', 'dist', 'build', '.git', '.next', '.nuxt', 'out', 'coverage', '.nyc_output'];
  const excludePatterns = options.excludePatterns?.length ? options.excludePatterns : [...defaultExcludes, ...gitignorePatterns];
  
  // Default file patterns if none provided (more comprehensive)
  const defaultFilePatterns = [
    '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
    '.css', '.scss', '.sass', '.less',
    '.html', '.htm', '.xml',
    '.json', '.yaml', '.yml', '.toml',
    '.md', '.mdx', '.txt', '.rst',
    '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp',
    '.rs', '.go', '.kt', '.swift', '.cs',
    '.sql', '.graphql', '.gql',
    '.sh', '.bash', '.zsh', '.fish',
    '.Dockerfile', '.dockerfile'
  ];
  const filePatterns = options.filePatterns?.length ? options.filePatterns : defaultFilePatterns;

  // Helper function to check if a path should be excluded
  function shouldExclude(relativePath: string, name: string): boolean {
    // Check against exclude patterns
    for (const pattern of excludePatterns) {
      if (!pattern.trim()) continue;
      
      // Handle different pattern types
      if (pattern.startsWith('*')) {
        // Wildcard pattern like *.log
        const extension = pattern.substring(1);
        if (name.endsWith(extension)) return true;
      } else if (pattern.endsWith('/')) {
        // Directory pattern like node_modules/
        const dirName = pattern.slice(0, -1);
        if (name === dirName || relativePath.includes(`${dirName}/`)) return true;
      } else if (pattern.includes('*')) {
        // Complex wildcard pattern
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(name) || regex.test(relativePath)) return true;
      } else {
        // Exact match
        if (name === pattern || relativePath.includes(pattern)) return true;
      }
    }
    return false;
  }

  // Helper function to check if file matches include patterns
  function shouldInclude(fileName: string): boolean {
    if (!filePatterns.length) return true;
    
    for (const pattern of filePatterns) {
      if (pattern.startsWith('.')) {
        // Extension pattern like .js
        if (fileName.endsWith(pattern)) return true;
      } else if (pattern.includes('*')) {
        // Wildcard pattern
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(fileName)) return true;
      } else {
        // Exact match or contains
        if (fileName.includes(pattern)) return true;
      }
    }
    return false;
  }

  async function searchInDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const relativePath = path.relative(rootPath, fullPath);
        const stats = await fs.stat(fullPath);

        // Skip excluded paths
        if (shouldExclude(relativePath, entry)) {
          continue;
        }

        if (stats.isDirectory()) {
          await searchInDirectory(fullPath);
        } else if (stats.isFile() && shouldInclude(entry)) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, lineIndex) => {
              let searchIndex = 0;
              let columnIndex;
              
              // Find all occurrences in the line
              while ((columnIndex = line.toLowerCase().indexOf(query.toLowerCase(), searchIndex)) !== -1) {
                results.push({
                  filePath: fullPath,
                  line: lineIndex + 1,
                  column: columnIndex + 1,
                  content: query,
                  lineContent: line,
                });
                searchIndex = columnIndex + 1;
              }
            });
          } catch (error) {
            // Skip files that can't be read as text (binary files, etc.)
          }
        }
      }
    } catch (error) {
      console.error(`Error searching in directory ${dirPath}:`, error);
    }
  }

  await searchInDirectory(rootPath);
  return results;
}

// Helper function to read and parse gitignore patterns
async function getGitignorePatterns(rootPath: string): Promise<string[]> {
  const gitignorePath = path.join(rootPath, '.gitignore');
  
  try {
    if (fsSync.existsSync(gitignorePath)) {
      const content = await fs.readFile(gitignorePath, 'utf8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .filter(Boolean);
    }
  } catch (error) {
    console.error('Error reading .gitignore:', error);
  }
  
  return [];
}

export function addProjectEventListeners(window: BrowserWindow): void {
  mainWindow = window;
  
  // Load recent projects on startup
  loadRecentProjects();
  
  // Load last opened project on startup
  loadLastOpenedProject();
  loadLastOpenedProject();

  // Project management
  ipcMain.handle(PROJECT_OPEN_FOLDER_CHANNEL, async (_, folderPath?: string) => {
    let selectedPath = folderPath;
    
    if (!selectedPath) {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory'],
        title: 'Select Project Folder',
      });
      
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      
      selectedPath = result.filePaths[0];
    }
    
    currentProjectPath = selectedPath;
    
    // Add to recent projects
    const projectName = path.basename(selectedPath);
    await addRecentProject(selectedPath, projectName);
    
    return selectedPath;
  });

  ipcMain.handle(PROJECT_GET_CURRENT_PROJECT_CHANNEL, () => {
    return currentProjectPath;
  });

  ipcMain.handle(PROJECT_SET_CURRENT_PROJECT_CHANNEL, (_, projectPath: string) => {
    currentProjectPath = projectPath;
    return projectPath;
  });

  // File operations
  ipcMain.handle(PROJECT_OPEN_FILE_CHANNEL, async (_, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { content, path: filePath };
    } catch (error) {
      // throw new Error(`Failed to open file: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_SAVE_FILE_CHANNEL, async (_, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      return true;
    } catch (error) {
      throw new Error(`Failed to save file: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_CREATE_FILE_CHANNEL, async (_, filePath: string, content = '') => {
    try {
      // Create directory if it doesn't exist
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf8');
      
      // Emit file created event
      mainWindow?.webContents.send(PROJECT_FILE_CREATED_EVENT, filePath);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to create file: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_CREATE_FOLDER_CHANNEL, async (_, folderPath: string) => {
    try {
      await fs.mkdir(folderPath, { recursive: true });
      
      // Emit file created event for folder
      mainWindow?.webContents.send(PROJECT_FILE_CREATED_EVENT, folderPath);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to create folder: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_DELETE_FILE_CHANNEL, async (_, filePath: string) => {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_DELETE_FOLDER_CHANNEL, async (_, folderPath: string) => {
    try {
      await fs.rmdir(folderPath, { recursive: true });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete folder: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_RENAME_FILE_CHANNEL, async (_, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to rename file: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_RENAME_FOLDER_CHANNEL, async (_, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to rename folder: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_GET_FILE_STATS_CHANNEL, async (_, filePath: string) => {
    try {
      return await getFileStats(filePath);
    } catch (error) {
      throw new Error(`Failed to get file stats: ${(error as Error).message}`);
    }
  });

  // Directory operations
  ipcMain.handle(PROJECT_GET_DIRECTORY_TREE_CHANNEL, async (_, rootPath: string, options?: { depth?: number; includeFiles?: boolean }) => {
    try {
      return await buildDirectoryTree(rootPath, options);
    } catch (error) {
      throw new Error(`Failed to get directory tree: ${(error as Error).message}`);
    }
  });

  // File watching
  ipcMain.handle(PROJECT_WATCH_FILE_CHANGES_CHANNEL, async (_, filePath: string) => {
    try {
      if (fileWatchers.has(filePath)) {
        return true; // Already watching
      }

      const watcher = fsSync.watch(filePath, { recursive: true }, (eventType: string, filename: string | null) => {
        if (filename) {
          const fullPath = path.join(filePath, filename);
          switch (eventType) {
            case 'change':
              mainWindow?.webContents.send(PROJECT_FILE_CHANGED_EVENT, fullPath, 'change');
              break;
            case 'rename':
              // For rename events, we need to check if the file exists to determine if it was created or deleted
              if (fsSync.existsSync(fullPath)) {
                mainWindow?.webContents.send(PROJECT_FILE_CREATED_EVENT, fullPath);
              } else {
                mainWindow?.webContents.send(PROJECT_FILE_DELETED_EVENT, fullPath);
              }
              break;
          }
        }
      });

      fileWatchers.set(filePath, watcher);
      return true;
    } catch (error) {
      throw new Error(`Failed to watch file: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_UNWATCH_FILE_CHANGES_CHANNEL, async (_, filePath: string) => {
    try {
      const watcher = fileWatchers.get(filePath);
      if (watcher) {
        watcher.close();
        fileWatchers.delete(filePath);
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to unwatch file: ${(error as Error).message}`);
    }
  });

  // Search operations
  ipcMain.handle(PROJECT_SEARCH_FILES_CHANNEL, async (_, query: string, rootPath?: string, options?: { includePatterns?: string[]; excludePatterns?: string[] }) => {
    try {
      const searchRoot = rootPath || currentProjectPath;
      if (!searchRoot) {
        throw new Error('No project open');
      }
      return await searchFiles(query, searchRoot, options);
    } catch (error) {
      throw new Error(`Failed to search files: ${(error as Error).message}`);
    }
  });

  ipcMain.handle(PROJECT_SEARCH_IN_FILES_CHANNEL, async (_, query: string, rootPath?: string, options?: { filePatterns?: string[]; excludePatterns?: string[] }) => {
    try {
      const searchRoot = rootPath || currentProjectPath;
      if (!searchRoot) {
        throw new Error('No project open');
      }
      return await searchInFiles(query, searchRoot, options);
    } catch (error) {
      throw new Error(`Failed to search in files: ${(error as Error).message}`);
    }
  });

  // Recent projects
  ipcMain.handle(PROJECT_GET_RECENT_PROJECTS_CHANNEL, () => {
    return recentProjects;
  });

  ipcMain.handle(PROJECT_ADD_RECENT_PROJECT_CHANNEL, async (_, projectPath: string, projectName?: string) => {
    await addRecentProject(projectPath, projectName);
    return recentProjects;
  });

  ipcMain.handle(PROJECT_REMOVE_RECENT_PROJECT_CHANNEL, async (_, projectPath: string) => {
    recentProjects = recentProjects.filter(project => project.path !== projectPath);
    await saveRecentProjects();
    return recentProjects;
  });

  // Last opened project
  ipcMain.handle(PROJECT_SET_LAST_OPENED_PROJECT_CHANNEL, async (_, projectPath: string) => {
    lastOpenedProjectPath = projectPath;
    await saveLastOpenedProject();
  });

  ipcMain.handle(PROJECT_GET_LAST_OPENED_PROJECT_CHANNEL, () => {
    return lastOpenedProjectPath;
  });
}

// Helper function to add recent project
async function addRecentProject(projectPath: string, projectName?: string): Promise<void> {
  const name = projectName || path.basename(projectPath);
  
  // Remove existing entry if it exists
  recentProjects = recentProjects.filter(project => project.path !== projectPath);
  
  // Add to the beginning of the list
  recentProjects.unshift({
    path: projectPath,
    name,
    lastOpened: new Date(),
  });
  
  // Keep only the last 10 recent projects
  recentProjects = recentProjects.slice(0, 10);
  
  await saveRecentProjects();
}
