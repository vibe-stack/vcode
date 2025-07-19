// Project File Management

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';
import type { ProjectFileInfo, TSConfig } from './types';

export class FileManager {
  /**
   * Load project files to provide better intellisense with enhanced import resolution
   */
  static async loadProjectFiles(
    projectPath: string,
    projectFiles: Map<string, ProjectFileInfo>,
    fileVersions: Map<string, number>,
    tsConfig: TSConfig | null
  ): Promise<void> {
    try {
      // Determine file patterns from tsconfig or use defaults
      const includePatterns = tsConfig?.include || ['**/*'];
      const excludePatterns = tsConfig?.exclude || ['node_modules/**', 'dist/**', 'build/**', '**/*.min.js', '.git/**'];

      // Get all TypeScript/JavaScript files in the project based on tsconfig
      const files = await projectApi.searchFiles('**/*.{ts,tsx,js,jsx,d.ts}', projectPath, {
        includePatterns: includePatterns,
        excludePatterns: excludePatterns,
      });

      // Create a comprehensive file map for better import resolution
      const fileMap = new Map<string, string>();
      files.forEach(filePath => {
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        const fileNameWithoutExt = fileName.replace(/\.(ts|tsx|js|jsx|d\.ts)$/, '');
        const relativePath = filePath.replace(projectPath, '').replace(/^\//, '');
        
        // Map various forms of the file for import resolution
        fileMap.set(relativePath, filePath);
        fileMap.set(fileName, filePath);
        fileMap.set(fileNameWithoutExt, filePath);
        
        // For index files, also map the directory name
        if (fileName.startsWith('index.')) {
          const dirName = filePath.substring(0, filePath.lastIndexOf('/'));
          const dirBaseName = dirName.substring(dirName.lastIndexOf('/') + 1);
          fileMap.set(dirBaseName, filePath);
        }
      });

      // Store file map in a global location for import resolution
      if (typeof window !== 'undefined') {
        (window as any).projectFileMap = fileMap;
      }

      // Prioritize loading files from common source directories
      const sourceFiles = files.filter(f =>
        f.includes('/src/') ||
        f.includes('/components/') ||
        f.includes('/pages/') ||
        f.includes('/lib/') ||
        f.includes('/utils/') ||
        f.includes('/app/') ||       // Next.js app directory
        f.includes('/layouts/') ||
        f.includes('/hooks/') ||
        !f.includes('/')  // Root level files
      );

      const otherFiles = files.filter(f => !sourceFiles.includes(f));

      // Load source files first (up to 200), then other files (up to 100)
      const filesToLoad = [
        ...sourceFiles.slice(0, 200),
        ...otherFiles.slice(0, 100)
      ];

      const loadPromises = filesToLoad.map(async (filePath) => {
        try {
          await FileManager.loadFileIntoMonaco(filePath, projectPath, projectFiles, fileVersions);
        } catch (error) {
          console.warn(`[FileManager] Failed to load file ${filePath}:`, error);
        }
      });

      await Promise.allSettled(loadPromises);

    } catch (error) {
      console.error('[FileManager] Error loading project files:', error);
    }
  }

  /**
   * Load project files to provide better intellisense
   */
  static async loadProjectFilesOriginal(
    projectPath: string,
    projectFiles: Map<string, ProjectFileInfo>,
    fileVersions: Map<string, number>,
    tsConfig: TSConfig | null
  ): Promise<void> {
    try {
      // Determine file patterns from tsconfig or use defaults
      const includePatterns = tsConfig?.include || ['**/*'];
      const excludePatterns = tsConfig?.exclude || ['node_modules/**', 'dist/**', 'build/**', '**/*.min.js', '.git/**'];

      // Get all TypeScript/JavaScript files in the project based on tsconfig
      const files = await projectApi.searchFiles('**/*.{ts,tsx,js,jsx,d.ts}', projectPath, {
        includePatterns: includePatterns,
        excludePatterns: excludePatterns,
      });

      // Prioritize loading files from common source directories
      const sourceFiles = files.filter(f =>
        f.includes('/src/') ||
        f.includes('/components/') ||
        f.includes('/pages/') ||
        f.includes('/lib/') ||
        f.includes('/utils/') ||
        !f.includes('/')  // Root level files
      );

      const otherFiles = files.filter(f => !sourceFiles.includes(f));

      // Load source files first (up to 150), then other files (up to 100)
      const filesToLoad = [
        ...sourceFiles.slice(0, 150),
        ...otherFiles.slice(0, 100)
      ];

      const loadPromises = filesToLoad.map(async (filePath) => {
        try {
          await FileManager.loadFileIntoMonaco(filePath, projectPath, projectFiles, fileVersions);
        } catch (error) {
          console.warn(`[FileManager] Failed to load file ${filePath}:`, error);
        }
      });

      await Promise.allSettled(loadPromises);

    } catch (error) {
      console.error('[FileManager] Error loading project files:', error);
    }
  }

  /**
   * Load a single file into Monaco's TypeScript service
   */
  static async loadFileIntoMonaco(
    filePath: string,
    projectPath: string,
    projectFiles: Map<string, ProjectFileInfo>,
    fileVersions: Map<string, number>
  ): Promise<void> {
    try {
      const result = await projectApi.openFile(filePath);
      if (!result || !result.content) {
        console.warn(`Failed to load file into Monaco: ${filePath}`);
        return;
      }
      const { content } = result;

      // Create a relative path from project root
      const relativePath = filePath.replace(projectPath, '').replace(/^\//, '');

      // Generate Monaco URI - use the actual file path for proper module resolution
      const uri = monaco.Uri.file(filePath);

      // Update file version
      const currentVersion = fileVersions.get(filePath) || 0;
      const newVersion = currentVersion + 1;
      fileVersions.set(filePath, newVersion);

      // Store file info
      projectFiles.set(filePath, {
        path: filePath,
        content,
        version: newVersion
      });

      // Always create a model for TypeScript/JavaScript files so they can be imported
      const existingModel = monaco.editor.getModel(uri);
      if (!existingModel) {
        // Monaco Editor uses 'typescript' for both .ts and .tsx files
        // and 'javascript' for both .js and .jsx files
        const language = (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) ? 'typescript' : 'javascript';
        monaco.editor.createModel(content, language, uri);
      } else {
        // Update existing model
        existingModel.setValue(content);
      }

      // Also add as extra lib if it's a .d.ts file for global types
      if (filePath.endsWith('.d.ts')) {
        const virtualPath = `file:///${relativePath}`;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
      }

    } catch (error) {
      console.error(`Error loading file ${filePath} into Monaco:`, error);
    }
  }
  static async updateFile(
    filePath: string,
    content: string,
    projectFiles: Map<string, ProjectFileInfo>,
    fileVersions: Map<string, number>
  ): Promise<void> {
    // This method should only be used for files that are NOT currently open in Monaco
    // For files open in Monaco, use updateFileCache instead to avoid circular updates
    const uri = monaco.Uri.file(filePath);
    const model = monaco.editor.getModel(uri);

    if (!model) {
      // Only create new model if it doesn't exist
      // Monaco Editor uses 'typescript' for both .ts and .tsx files
      const language = (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) ? 'typescript' : 'javascript';
      monaco.editor.createModel(content, language, uri);
    }
    // If model exists, don't update it - assume the editor is managing it

    // Always update our cache
    const currentVersion = fileVersions.get(filePath) || 0;
    fileVersions.set(filePath, currentVersion + 1);
    projectFiles.set(filePath, {
      path: filePath,
      content,
      version: currentVersion + 1
    });
  }

  /**
   * Update internal file cache without modifying Monaco models
   * Use this when the change originates from Monaco to avoid circular updates
   */
  static updateFileCache(
    filePath: string,
    content: string,
    projectFiles: Map<string, ProjectFileInfo>,
    fileVersions: Map<string, number>
  ): void {
    // Update our cache only
    const currentVersion = fileVersions.get(filePath) || 0;
    fileVersions.set(filePath, currentVersion + 1);
    projectFiles.set(filePath, {
      path: filePath,
      content,
      version: currentVersion + 1
    });
  }

  /**
   * Remove a file from Monaco when it's deleted
   */
  static removeFile(
    filePath: string,
    projectFiles: Map<string, ProjectFileInfo>,
    fileVersions: Map<string, number>
  ): void {
    const uri = monaco.Uri.file(filePath);
    const model = monaco.editor.getModel(uri);

    if (model) {
      model.dispose();
    }

    projectFiles.delete(filePath);
    fileVersions.delete(filePath);
  }

  /**
   * Load type definitions from the project's own .d.ts files
   */
  static async loadProjectTypeDefinitions(projectPath: string): Promise<void> {
    try {
      // Search for .d.ts files in the project (excluding node_modules)
      const projectTypeFiles = await projectApi.searchFiles('**/*.d.ts', projectPath, {
        excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '.git/**']
      });

      // Load each project .d.ts file
      const loadPromises = projectTypeFiles.map(async (filePath) => {
        try {
          const result = await projectApi.openFile(filePath);
          if (!result || !result.content) return;
          const { content } = result;

          // Create relative path from project root
          const relativePath = filePath.replace(projectPath, '').replace(/^\//, '');
          const virtualPath = `file:///${relativePath}`;

          monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);

        } catch (error) {
          console.warn(`Failed to load project type file ${filePath}:`, error);
        }
      });

      await Promise.allSettled(loadPromises);

    } catch (error) {
      console.error('Error loading project type definitions:', error);
    }
  }
}
