// Project File Management

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';
import type { ProjectFileInfo } from './types';

export class FileManager {
  /**
   * Load project files to provide better intellisense
   */
  static async loadProjectFiles(
    projectPath: string,
    projectFiles: Map<string, ProjectFileInfo>,
    fileVersions: Map<string, number>
  ): Promise<void> {
    try {
      // Get all TypeScript/JavaScript files in the project
      const files = await projectApi.searchFiles('**/*.{ts,tsx,js,jsx,d.ts}', projectPath, {
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**', '**/*.min.js', '.git/**']
      });

      console.log(`Found ${files.length} TypeScript/JavaScript files`);

      // Load more files for better import resolution - prioritize source files
      const sourceFiles = files.filter(f => 
        f.includes('/src/') || 
        f.includes('/components/') || 
        f.includes('/pages/') || 
        f.includes('/lib/') ||
        f.includes('/utils/') ||
        !f.includes('/')  // Root level files
      );
      
      const otherFiles = files.filter(f => !sourceFiles.includes(f));
      
      // Load source files first (up to 100), then other files (up to 50)
      const filesToLoad = [
        ...sourceFiles.slice(0, 100),
        ...otherFiles.slice(0, 50)
      ];
      
      const loadPromises = filesToLoad.map(async (filePath) => {
        try {
          await FileManager.loadFileIntoMonaco(filePath, projectPath, projectFiles, fileVersions);
        } catch (error) {
          console.warn(`Failed to load file ${filePath}:`, error);
        }
      });

      // Load files in parallel but with a reasonable limit
      await Promise.allSettled(loadPromises);

      console.log(`Loaded ${projectFiles.size} files into Monaco TypeScript service`);
    } catch (error) {
      console.error('Error loading project files:', error);
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
      const { content } = await projectApi.openFile(filePath);
      
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
        console.log(`Created Monaco model for ${relativePath} with language ${language}`);
      } else {
        // Update existing model
        existingModel.setValue(content);
      }

      // Also add as extra lib if it's a .d.ts file for global types
      if (filePath.endsWith('.d.ts')) {
        const virtualPath = `file:///${relativePath}`;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
        console.log(`Added .d.ts file to extra libs: ${relativePath}`);
      }

    } catch (error) {
      console.error(`Error loading file ${filePath} into Monaco:`, error);
    }
  }

  /**
   * Update a file in Monaco when it changes
   */
  static async updateFile(
    filePath: string,
    content: string,
    projectFiles: Map<string, ProjectFileInfo>,
    fileVersions: Map<string, number>
  ): Promise<void> {
    const uri = monaco.Uri.file(filePath);
    const model = monaco.editor.getModel(uri);
    
    if (model) {
      // Update existing model
      model.setValue(content);
    } else {
      // Create new model with proper language detection
      // Monaco Editor uses 'typescript' for both .ts and .tsx files
      const language = (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) ? 'typescript' : 'javascript';
      monaco.editor.createModel(content, language, uri);
    }

    // Update our cache
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

      console.log(`Found ${projectTypeFiles.length} project type definition files`);

      // Load each project .d.ts file
      const loadPromises = projectTypeFiles.map(async (filePath) => {
        try {
          const { content } = await projectApi.openFile(filePath);
          
          // Create relative path from project root
          const relativePath = filePath.replace(projectPath, '').replace(/^\//, '');
          const virtualPath = `file:///${relativePath}`;
          
          monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
          console.log(`Loaded project type definitions from ${relativePath}`);
          
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
