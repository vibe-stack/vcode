// Path Resolution and Module Resolution

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';
import type { TSConfig } from './types';

export class PathResolver {
  /**
   * Setup path mapping for module resolution based on tsconfig paths
   */
  static async setupPathMapping(projectPath: string, tsConfig: TSConfig | null): Promise<void> {
    const compilerOptions = tsConfig?.compilerOptions;
    if (!compilerOptions?.paths || !compilerOptions?.baseUrl || !tsConfig) {
      return;
    }

    console.log('Setting up path mapping for:', compilerOptions.paths);
    
    // Create virtual modules for path mappings
    for (const [pattern, mappings] of Object.entries(compilerOptions.paths)) {
      try {
        await PathResolver.createVirtualModulesForPathMapping(projectPath, tsConfig, pattern, mappings);
      } catch (error) {
        console.warn(`Error setting up path mapping for ${pattern}:`, error);
      }
    }
  }

  /**
   * Create virtual modules for path mappings like @/* -> ./src/*
   */
  private static async createVirtualModulesForPathMapping(
    projectPath: string,
    tsConfig: TSConfig,
    pattern: string,
    mappings: string[]
  ): Promise<void> {
    if (!mappings.length) return;

    const baseUrl = tsConfig.compilerOptions?.baseUrl || '.';
    const basePath = `${projectPath}/${baseUrl}`.replace(/\/\.$/, '');

    for (const mapping of mappings) {
      try {
        // Remove the * from pattern and mapping to get the base paths
        const patternBase = pattern.replace('/*', '');
        const mappingBase = mapping.replace('/*', '');
        
        // Resolve the actual directory path
        const actualPath = `${basePath}/${mappingBase}`;
        
        // Find all TypeScript/JavaScript files in this path
        const files = await projectApi.searchFiles('**/*.{ts,tsx,js,jsx}', actualPath, {
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
        });

        // Create virtual modules for each file
        for (const filePath of files) {
          const relativePath = filePath.replace(actualPath, '').replace(/^\//, '');
          const filePathWithoutExt = relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');
          
          // Create virtual module path
          const virtualModuleName = `${patternBase}/${filePathWithoutExt}`;
          
          try {
            const { content } = await projectApi.openFile(filePath);
            
            // Create a virtual module that re-exports the actual file
            const virtualContent = `export * from "${filePath}";`;
            
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              virtualContent,
              `file:///${virtualModuleName}.ts`
            );
            
          } catch (error) {
            // Ignore individual file errors
          }
        }
        
        console.log(`Created virtual modules for path mapping: ${pattern} -> ${mapping}`);
        
      } catch (error) {
        console.warn(`Error creating virtual modules for ${pattern} -> ${mapping}:`, error);
      }
    }
  }

  /**
   * Load a file on-demand when it's imported but not yet loaded
   */
  static async loadFileOnDemand(
    projectPath: string,
    tsConfig: TSConfig | null,
    importPath: string,
    fromFile: string
  ): Promise<void> {
    try {
      // Resolve the import path to an actual file path
      const resolvedPath = await PathResolver.resolveImportPath(projectPath, tsConfig, importPath, fromFile);
      
      if (resolvedPath) {
        console.log(`Loading file on-demand: ${resolvedPath}`);
        // This would typically load the file into Monaco, but we'll delegate that to FileManager
        // FileManager.loadFileIntoMonaco(resolvedPath, projectPath, projectFiles, fileVersions);
      }
    } catch (error) {
      console.warn(`Failed to load file on-demand for import "${importPath}":`, error);
    }
  }

  /**
   * Resolve an import path to an actual file path
   */
  static async resolveImportPath(
    projectPath: string,
    tsConfig: TSConfig | null,
    importPath: string,
    fromFile: string
  ): Promise<string | null> {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
      const basePath = PathResolver.resolveRelativePath(fromDir, importPath);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
      
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        try {
          await projectApi.getFileStats(fullPath);
          return fullPath;
        } catch {
          // File doesn't exist, try next extension
        }
      }
    }

    // Handle absolute imports with path mapping
    if (tsConfig?.compilerOptions?.paths) {
      const resolved = await PathResolver.resolvePathMappedImport(projectPath, tsConfig, importPath);
      if (resolved) return resolved;
    }

    // Handle imports from src directory
    const srcPath = `${projectPath}/src/${importPath}`;
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    
    for (const ext of extensions) {
      const fullPath = srcPath + ext;
      try {
        await projectApi.getFileStats(fullPath);
        return fullPath;
      } catch {
        // File doesn't exist, try next extension
      }
    }

    return null;
  }

  /**
   * Resolve a relative path
   */
  private static resolveRelativePath(fromDir: string, relativePath: string): string {
    const parts = fromDir.split('/');
    const relativeParts = relativePath.split('/');

    for (const part of relativeParts) {
      if (part === '.') {
        continue;
      } else if (part === '..') {
        parts.pop();
      } else {
        parts.push(part);
      }
    }

    return parts.join('/');
  }

  /**
   * Resolve imports using tsconfig path mapping
   */
  private static async resolvePathMappedImport(
    projectPath: string,
    tsConfig: TSConfig,
    importPath: string
  ): Promise<string | null> {
    const paths = tsConfig.compilerOptions?.paths;
    const baseUrl = tsConfig.compilerOptions?.baseUrl || '.';
    
    if (!paths) return null;

    for (const [pattern, mappings] of Object.entries(paths)) {
      const patternRegex = new RegExp('^' + pattern.replace('*', '(.*)') + '$');
      const match = importPath.match(patternRegex);
      
      if (match) {
        for (const mapping of mappings) {
          const resolvedPath = mapping.replace('*', match[1] || '');
          const fullPath = `${projectPath}/${baseUrl}/${resolvedPath}`.replace(/\/\.$/, '');
          
          const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
          
          for (const ext of extensions) {
            const pathWithExt = fullPath + ext;
            try {
              await projectApi.getFileStats(pathWithExt);
              return pathWithExt;
            } catch {
              // File doesn't exist, try next extension
            }
          }
        }
      }
    }

    return null;
  }
}
