// Path Resolution for TypeScript Imports

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';
import type { TSConfig } from './types';

export class PathResolver {
  /**
   * Resolve import paths and load files on demand
   */
  static async loadFileOnDemand(
    projectPath: string,
    tsConfig: TSConfig | null,
    importPath: string,
    fromFile: string
  ): Promise<void> {
    try {
      const resolvedPath = await PathResolver.resolveImportPath(
        projectPath,
        tsConfig,
        importPath,
        fromFile
      );

      if (resolvedPath) {
        await PathResolver.loadResolvedFile(resolvedPath, projectPath);
      }
    } catch (error) {
      console.warn(`Failed to load file on demand for import "${importPath}":`, error);
    }
  }

  /**
   * Resolve an import path to an actual file path
   */
  private static async resolveImportPath(
    projectPath: string,
    tsConfig: TSConfig | null,
    importPath: string,
    fromFile: string
  ): Promise<string | null> {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return await PathResolver.resolveRelativeImport(projectPath, importPath, fromFile);
    }

    // Handle path mapping from tsconfig
    if (tsConfig?.compilerOptions?.paths) {
      const resolvedFromPaths = await PathResolver.resolveFromPathMapping(
        projectPath,
        tsConfig.compilerOptions.paths,
        tsConfig.compilerOptions.baseUrl,
        importPath
      );
      if (resolvedFromPaths) return resolvedFromPaths;
    }

    // Handle node_modules imports
    if (!importPath.startsWith('.')) {
      return await PathResolver.resolveNodeModulesImport(projectPath, importPath);
    }

    return null;
  }

  /**
   * Resolve relative imports like ./components/todo-list
   */
  private static async resolveRelativeImport(
    projectPath: string,
    importPath: string,
    fromFile: string
  ): Promise<string | null> {
    const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    const potentialPaths = [];

    // Build potential file paths
    if (importPath.startsWith('./')) {
      const relativePath = importPath.substring(2);
      potentialPaths.push(
        `${fromDir}/${relativePath}`,
        `${fromDir}/${relativePath}.ts`,
        `${fromDir}/${relativePath}.tsx`,
        `${fromDir}/${relativePath}.js`,
        `${fromDir}/${relativePath}.jsx`,
        `${fromDir}/${relativePath}/index.ts`,
        `${fromDir}/${relativePath}/index.tsx`,
        `${fromDir}/${relativePath}/index.js`,
        `${fromDir}/${relativePath}/index.jsx`
      );
    } else if (importPath.startsWith('../')) {
      // Handle parent directory imports
      const parentDir = fromDir.substring(0, fromDir.lastIndexOf('/'));
      const relativePath = importPath.substring(3);
      potentialPaths.push(
        `${parentDir}/${relativePath}`,
        `${parentDir}/${relativePath}.ts`,
        `${parentDir}/${relativePath}.tsx`,
        `${parentDir}/${relativePath}.js`,
        `${parentDir}/${relativePath}.jsx`,
        `${parentDir}/${relativePath}/index.ts`,
        `${parentDir}/${relativePath}/index.tsx`,
        `${parentDir}/${relativePath}/index.js`,
        `${parentDir}/${relativePath}/index.jsx`
      );
    }

    // Check which file exists
    for (const path of potentialPaths) {
      try {
        await projectApi.openFile(path);
        return path;
      } catch {
        // File doesn't exist, try next
      }
    }

    return null;
  }

  /**
   * Resolve imports using tsconfig path mapping
   */
  private static async resolveFromPathMapping(
    projectPath: string,
    paths: Record<string, string[]>,
    baseUrl: string | undefined,
    importPath: string
  ): Promise<string | null> {
    const base = baseUrl ? `${projectPath}/${baseUrl.replace(/^\.\//, '')}` : projectPath;

    for (const [pattern, mappings] of Object.entries(paths)) {
      if (PathResolver.matchesPattern(pattern, importPath)) {
        const replacement = PathResolver.replacePattern(pattern, importPath);
        
        for (const mapping of mappings) {
          const resolvedMapping = mapping.replace('*', replacement);
          const potentialPaths = [
            `${base}/${resolvedMapping}`,
            `${base}/${resolvedMapping}.ts`,
            `${base}/${resolvedMapping}.tsx`,
            `${base}/${resolvedMapping}.js`,
            `${base}/${resolvedMapping}.jsx`,
            `${base}/${resolvedMapping}/index.ts`,
            `${base}/${resolvedMapping}/index.tsx`,
            `${base}/${resolvedMapping}/index.js`,
            `${base}/${resolvedMapping}/index.jsx`
          ];

          for (const path of potentialPaths) {
            try {
              await projectApi.openFile(path);
              return path;
            } catch {
              // File doesn't exist, try next
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Resolve node_modules imports
   */
  private static async resolveNodeModulesImport(
    projectPath: string,
    importPath: string
  ): Promise<string | null> {
    const packageName = importPath.includes('/') ? importPath.split('/')[0] : importPath;
    const subPath = importPath.includes('/') ? importPath.substring(packageName.length + 1) : '';

    try {
      // Try to load package.json to find main entry point
      const packageJsonPath = `${projectPath}/node_modules/${packageName}/package.json`;
      const { content } = await projectApi.openFile(packageJsonPath);
      const packageJson = JSON.parse(content);

      let mainEntry = 'index.js';
      if (packageJson.types) {
        mainEntry = packageJson.types;
      } else if (packageJson.typings) {
        mainEntry = packageJson.typings;
      } else if (packageJson.main) {
        mainEntry = packageJson.main.replace(/\.js$/, '.d.ts');
      }

      const entryPath = subPath ? 
        `${projectPath}/node_modules/${packageName}/${subPath}` :
        `${projectPath}/node_modules/${packageName}/${mainEntry}`;

      // Try various extensions
      const potentialPaths = [
        entryPath,
        `${entryPath}.d.ts`,
        `${entryPath}/index.d.ts`
      ];

      for (const path of potentialPaths) {
        try {
          await projectApi.openFile(path);
          return path;
        } catch {
          // File doesn't exist, try next
        }
      }
    } catch {
      // Package doesn't exist or can't be read
    }

    return null;
  }

  /**
   * Check if import path matches a pattern (supports * wildcard)
   */
  private static matchesPattern(pattern: string, importPath: string): boolean {
    if (!pattern.includes('*')) {
      return pattern === importPath;
    }

    const regexPattern = pattern.replace(/\*/g, '(.*)');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(importPath);
  }

  /**
   * Replace pattern with actual import path parts
   */
  private static replacePattern(pattern: string, importPath: string): string {
    if (!pattern.includes('*')) {
      return '';
    }

    const regexPattern = pattern.replace(/\*/g, '(.*)');
    const regex = new RegExp(`^${regexPattern}$`);
    const match = importPath.match(regex);
    return match ? match[1] : '';
  }

  /**
   * Load a resolved file into Monaco
   */
  private static async loadResolvedFile(filePath: string, projectPath: string): Promise<void> {
    try {
      const { content } = await projectApi.openFile(filePath);
      const uri = monaco.Uri.file(filePath);
      
      const existingModel = monaco.editor.getModel(uri);
      if (!existingModel) {
        const language = PathResolver.getLanguageFromPath(filePath);
        monaco.editor.createModel(content, language, uri);
        console.log(`Loaded file on demand: ${filePath}`);

        // If it's a .d.ts file, also add as extra lib
        if (filePath.endsWith('.d.ts')) {
          const relativePath = filePath.replace(projectPath, '').replace(/^\//, '');
          const virtualPath = `file:///${relativePath}`;
          monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to load resolved file ${filePath}:`, error);
    }
  }

  /**
   * Get Monaco language from file path
   */
  private static getLanguageFromPath(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return 'typescript';
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      return 'javascript';
    }
    return 'typescript'; // Default
  }
}
