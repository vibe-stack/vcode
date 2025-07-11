# Project API Service

A comprehensive project management API for Electron-based code editors, providing file system operations, project management, and file watching capabilities through IPC (Inter-Process Communication).

## Features

- **Project Management**: Open folders, manage current project, recent projects
- **File Operations**: Create, read, write, delete, rename files and folders
- **Directory Tree**: Get structured directory listings
- **File Watching**: Monitor file system changes
- **Search**: Search for files by name or content within files
- **Recent Projects**: Manage recently opened projects

## Architecture

The Project API follows a modular IPC architecture:

### Main Process (src/helpers/ipc/project/)
- **project-channels.ts**: IPC channel definitions
- **project-listeners.ts**: Main process event handlers
- **project-context.ts**: Renderer process context exposure

### Renderer Process (src/services/project-api/)
- **index.ts**: Service class and TypeScript definitions

## Usage

### Basic Setup

The Project API is automatically registered when the application starts. You can use it in your React components:

```typescript
import { projectApi } from '../services/project-api';

// Open a project folder
const projectPath = await projectApi.openFolder();

// Get current project
const currentProject = await projectApi.getCurrentProject();

// Read a file
const { content } = await projectApi.openFile('/path/to/file.txt');

// Save a file
await projectApi.saveFile('/path/to/file.txt', 'Hello World');

// Watch for file changes
const unsubscribe = projectApi.onFileChanged((filePath, eventType) => {
  console.log(`File ${filePath} was ${eventType}`);
});

// Clean up listener
unsubscribe();
```

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { projectApi, DirectoryNode } from '../services/project-api';

const MyComponent: React.FC = () => {
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [directoryTree, setDirectoryTree] = useState<DirectoryNode | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      const project = await projectApi.getCurrentProject();
      if (project) {
        setCurrentProject(project);
        const tree = await projectApi.getDirectoryTree(project);
        setDirectoryTree(tree);
      }
    };

    loadProject();
  }, []);

  const handleOpenFolder = async () => {
    const path = await projectApi.openFolder();
    if (path) {
      setCurrentProject(path);
      const tree = await projectApi.getDirectoryTree(path);
      setDirectoryTree(tree);
    }
  };

  return (
    <div>
      <button onClick={handleOpenFolder}>Open Project</button>
      {currentProject && <p>Current: {currentProject}</p>}
      {/* Render directory tree */}
    </div>
  );
};
```

## API Reference

### Project Management

#### `openFolder(folderPath?: string): Promise<string | null>`
Opens a folder dialog (if no path provided) or sets the specified folder as the current project.

#### `getCurrentProject(): Promise<string | null>`
Returns the current project path.

#### `setCurrentProject(projectPath: string): Promise<string>`
Sets the current project path.

### File Operations

#### `openFile(filePath: string): Promise<{ content: string; path: string }>`
Reads and returns the content of a file.

#### `saveFile(filePath: string, content: string): Promise<boolean>`
Saves content to a file.

#### `createFile(filePath: string, content?: string): Promise<boolean>`
Creates a new file with optional initial content.

#### `createFolder(folderPath: string): Promise<boolean>`
Creates a new folder (including parent directories if needed).

#### `deleteFile(filePath: string): Promise<boolean>`
Deletes a file.

#### `deleteFolder(folderPath: string): Promise<boolean>`
Deletes a folder and its contents.

#### `renameFile(oldPath: string, newPath: string): Promise<boolean>`
Renames or moves a file.

#### `renameFolder(oldPath: string, newPath: string): Promise<boolean>`
Renames or moves a folder.

#### `getFileStats(filePath: string): Promise<FileStats>`
Gets file metadata including size, modification date, etc.

### Directory Operations

#### `getDirectoryTree(rootPath: string, options?: DirectoryTreeOptions): Promise<DirectoryNode>`
Returns a structured tree of the directory contents.

Options:
- `depth?: number` - Maximum depth to traverse (default: 3)
- `includeFiles?: boolean` - Whether to include files in the tree (default: true)

### File Watching

#### `watchFileChanges(filePath: string): Promise<boolean>`
Starts watching a file or directory for changes.

#### `unwatchFileChanges(filePath: string): Promise<boolean>`
Stops watching a file or directory.

### Search

#### `searchFiles(query: string, rootPath?: string, options?: SearchOptions): Promise<string[]>`
Searches for files by name.

Options:
- `includePatterns?: string[]` - File patterns to include
- `excludePatterns?: string[]` - File patterns to exclude (default: ['node_modules', 'dist', 'build', '.git'])

#### `searchInFiles(query: string, rootPath?: string, options?: SearchInFilesOptions): Promise<SearchResult[]>`
Searches for text content within files.

Options:
- `filePatterns?: string[]` - File extensions to search (default: ['.js', '.ts', '.jsx', '.tsx', '.css', '.html', '.json', '.md'])
- `excludePatterns?: string[]` - Directories to exclude

### Recent Projects

#### `getRecentProjects(): Promise<RecentProject[]>`
Returns the list of recently opened projects.

#### `addRecentProject(projectPath: string, projectName?: string): Promise<RecentProject[]>`
Adds a project to the recent projects list.

#### `removeRecentProject(projectPath: string): Promise<RecentProject[]>`
Removes a project from the recent projects list.

### Event Listeners

#### `onFileChanged(callback: (filePath: string, eventType: string) => void): () => void`
Listens for file change events. Returns an unsubscribe function.

#### `onFileCreated(callback: (filePath: string) => void): () => void`
Listens for file creation events. Returns an unsubscribe function.

#### `onFileDeleted(callback: (filePath: string) => void): () => void`
Listens for file deletion events. Returns an unsubscribe function.

#### `onFileRenamed(callback: (oldPath: string, newPath: string) => void): () => void`
Listens for file rename events. Returns an unsubscribe function.

## Type Definitions

### FileStats
```typescript
interface FileStats {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  lastModified: Date;
  created: Date;
}
```

### DirectoryNode
```typescript
interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  size?: number;
  lastModified?: Date;
}
```

### SearchResult
```typescript
interface SearchResult {
  filePath: string;
  line: number;
  column: number;
  content: string;
  lineContent: string;
}
```

### RecentProject
```typescript
interface RecentProject {
  path: string;
  name: string;
  lastOpened: Date;
}
```

## Data Storage

- Recent projects are stored in the Electron user data directory as `recent-projects.json`
- File watchers are managed in memory and cleaned up when the application closes
- Current project path is maintained in memory during the session

## Error Handling

All API methods throw errors when operations fail. Use try-catch blocks or handle Promise rejections appropriately:

```typescript
try {
  const content = await projectApi.openFile('/path/to/file.txt');
} catch (error) {
  console.error('Failed to open file:', error.message);
}
```

## Performance Considerations

- Directory tree traversal is limited to 3 levels deep by default to prevent performance issues
- File watching uses the native Node.js `fs.watch` API for efficiency
- Search operations skip common build directories (`node_modules`, `dist`, `build`, `.git`) by default
- Recent projects are limited to 10 entries to prevent unbounded growth

## Security

- All file operations are sandboxed to the user's file system
- No network access is required for file operations
- File paths are validated to prevent directory traversal attacks
- IPC channels are securely exposed through Electron's contextBridge
