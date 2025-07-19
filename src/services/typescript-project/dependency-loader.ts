// Dependency Type Loading

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';
import { TSConfigLoader } from './tsconfig-loader';
import type { PackageJson } from './types';

export class DependencyLoader {
  /**
   * Load type definitions from project dependencies by properly parsing package.json and             try {
              if (loadedFiles.has(filePath)) return;
              
              const result = await projectApi.openFile(filePath);
              if (!result || !result.content) return;
              const { content } = result;_modules
   */
  static async loadProjectDependencyTypes(projectPath: string): Promise<void> {
    try {
      
      // Parse package.json to get actual dependencies
      const packageJsonPath = `${projectPath}/package.json`;
      const packageJson = await TSConfigLoader.parsePackageJson(packageJsonPath);
      
      if (!packageJson) {
        return;
      }

      // Get all dependencies
      const allDependencies = DependencyLoader.getAllDependencies(packageJson);

      // Process dependencies in batches to avoid overwhelming the system
      const batchSize = 10;
      const dependencyNames = Object.keys(allDependencies);
      
      for (let i = 0; i < dependencyNames.length; i += batchSize) {
        const batch = dependencyNames.slice(i, i + batchSize);
        const batchPromises = batch.map(depName => 
          DependencyLoader.loadDependencyTypes(projectPath, depName, allDependencies[depName])
        );
        await Promise.allSettled(batchPromises);
        
        // Small delay between batches to prevent overwhelming
        if (i + batchSize < dependencyNames.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (error) {
      console.error('Error loading project dependency types:', error);
    }
  }

  /**
   * Extract all dependencies from package.json
   */
  private static getAllDependencies(packageJson: PackageJson): Record<string, string> {
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const peerDependencies = packageJson.peerDependencies || {};
    const optionalDependencies = packageJson.optionalDependencies || {};

    return {
      ...dependencies,
      ...devDependencies,
      ...peerDependencies,
      ...optionalDependencies
    };
  }

  /**
   * Load types for a specific dependency
   */
  private static async loadDependencyTypes(projectPath: string, dependencyName: string, version: string): Promise<void> {
    try {
      const depPath = `${projectPath}/node_modules/${dependencyName}`;
      
      // Check if the package exists
      const depPackageJson = await TSConfigLoader.parsePackageJson(`${depPath}/package.json`);
      if (!depPackageJson) {
        return;
      }

      // Special handling for frameworks with complex type structures
      if (DependencyLoader.isFrameworkPackage(dependencyName)) {
        await DependencyLoader.loadFrameworkTypes(projectPath, dependencyName, depPath, depPackageJson);
        return;
      }

      // Strategy 1: Check if the package has its own type definitions
      const hasBuiltInTypes = await DependencyLoader.loadBuiltInTypes(dependencyName, depPath, depPackageJson);
      
      if (!hasBuiltInTypes) {
        // Strategy 2: Look for corresponding @types package
        await DependencyLoader.loadCorrespondingTypesPackage(projectPath, dependencyName);
      }

      // Strategy 3: For scoped packages, also check @types equivalents
      if (dependencyName.startsWith('@')) {
        await DependencyLoader.loadScopedTypesPackage(projectPath, dependencyName);
      }

    } catch (error) {
      // noop
    }
  }

  /**
   * Check if a package is a major framework that needs special handling
   */
  private static isFrameworkPackage(packageName: string): boolean {
    const frameworkPackages = [
      'next', 'react', 'vue', 'nuxt', 'svelte', 'angular',
      '@angular/core', '@vue/cli', 'gatsby'
    ];
    return frameworkPackages.includes(packageName);
  }

  /**
   * Load types for framework packages with special handling
   */
  private static async loadFrameworkTypes(
    projectPath: string, 
    packageName: string, 
    packagePath: string, 
    packageJson: PackageJson
  ): Promise<void> {

    // Load built-in types first
    await DependencyLoader.loadBuiltInTypes(packageName, packagePath, packageJson);

    // Framework-specific type loading strategies
    switch (packageName) {
      case 'next':
        await DependencyLoader.loadNextJSTypes(projectPath, packagePath);
        break;
      case 'react':
        await DependencyLoader.loadReactTypes(projectPath, packagePath);
        break;
      default:
        // For other frameworks, use comprehensive type loading
        await DependencyLoader.loadAllPackageTypeFiles(packagePath, packageName);
        break;
    }
  }

  /**
   * Load Next.js specific types with comprehensive coverage
   */
  private static async loadNextJSTypes(projectPath: string, nextPath: string): Promise<void> {
    try {
      // Next.js has types distributed across multiple locations
      const nextTypePatterns = [
        'types/**/*.d.ts',     // Main types directory
        'dist/**/*.d.ts',      // Built types
        'server/**/*.d.ts',    // Server types
        'client/**/*.d.ts',    // Client types
        'app/**/*.d.ts',       // App router types
        'pages/**/*.d.ts',     // Pages router types
        '*.d.ts',              // Root level types
        'navigation/**/*.d.ts', // Navigation types
        'head/**/*.d.ts',      // Head types
        'image/**/*.d.ts',     // Image types
        'link/**/*.d.ts',      // Link types
        'script/**/*.d.ts',    // Script types
        'document/**/*.d.ts',  // Document types
        'app/**/*.d.ts'        // App directory types
      ];

      let totalLoaded = 0;
      const loadedFiles = new Set<string>();

      for (const pattern of nextTypePatterns) {
        try {
          const typeFiles = await projectApi.searchFiles(pattern, nextPath, {
            excludePatterns: ['**/node_modules/**', '**/test/**', '**/tests/**']
          });

          const loadPromises = typeFiles.slice(0, 50).map(async (filePath) => {
            if (loadedFiles.has(filePath)) return;
            
            try {
              const result = await projectApi.openFile(filePath);
              if (!result || !result.content) return;
              const { content } = result;
              
              const relativePath = filePath.replace(nextPath, '').replace(/^\//, '');
              const virtualPath = `file:///node_modules/next/${relativePath}`;
              
              monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
              loadedFiles.add(filePath);
              totalLoaded++;
              
            } catch (error) {
              console.warn(`Failed to load Next.js type file ${filePath}:`, error);
            }
          });

          await Promise.allSettled(loadPromises);
          
        } catch (error) {
          console.warn(`Failed to search for Next.js types with pattern ${pattern}:`, error);
        }
      }

      // Also try to load @types/react if it exists (Next.js depends on React)
      await DependencyLoader.loadCorrespondingTypesPackage(projectPath, 'react');
      
    } catch (error) {
      console.warn('Error loading Next.js specific types:', error);
    }
  }

  /**
   * Load React specific types
   */
  private static async loadReactTypes(projectPath: string, reactPath: string): Promise<void> {
    try {
      // React types are usually in @types/react, but also load any built-in types
      await DependencyLoader.loadAllPackageTypeFiles(reactPath, 'react');
      await DependencyLoader.loadCorrespondingTypesPackage(projectPath, 'react');
      await DependencyLoader.loadCorrespondingTypesPackage(projectPath, 'react-dom');
    } catch (error) {
      console.warn('Error loading React types:', error);
    }
  }

  /**
   * Load built-in type definitions from a package
   */
  private static async loadBuiltInTypes(packageName: string, packagePath: string, packageJson: PackageJson): Promise<boolean> {
    try {
      // Check package.json for type definition entry points
      const typeEntryPoints = [
        packageJson.types,
        packageJson.typings,
        packageJson.main?.replace(/\.js$/, '.d.ts'),
        packageJson.main?.replace(/\.mjs$/, '.d.ts'),
        packageJson.exports?.types,
        packageJson.exports?.['.']?.types,
        packageJson.exports?.['.']?.default?.replace(/\.js$/, '.d.ts'),
        'index.d.ts',
        'lib/index.d.ts',
        'dist/index.d.ts',
        'types/index.d.ts',
        'typings/index.d.ts'
      ].filter(Boolean);

      let foundTypes = false;

      // Try to load all entry points in parallel (truly parallel openFile)
      const loadPromises = typeEntryPoints.map((entryPoint) => {
        const fullPath = entryPoint?.startsWith('/') ? 
          `${packagePath}${entryPoint}` : 
          `${packagePath}/${entryPoint}`;

        // Don't await here, just return the promise
        return projectApi.openFile(fullPath)
          .then(result => {
        if (!result || !result.content) return false;
        const { content } = result;
        const virtualPath = `file:///node_modules/${packageName}/${entryPoint}`;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
        return true;
          })
          .catch(() => false);
      });

      const results = await Promise.all(loadPromises);
      foundTypes = results.some(Boolean);

      // Always scan for additional .d.ts files to catch re-exports and additional types
      await DependencyLoader.loadAllPackageTypeFiles(packagePath, packageName);

      return foundTypes;
    } catch (error) {
      console.warn(`Error loading built-in types for ${packageName}:`, error);
      return false;
    }
  }

  /**
   * Load types from a corresponding @types package if it exists
   */
  private static async loadCorrespondingTypesPackage(projectPath: string, packageName: string): Promise<void> {
    const typesPackageName = `@types/${packageName.replace('@', '').replace('/', '__')}`;
    const typesPath = `${projectPath}/node_modules/${typesPackageName}`;

    try {
      const typesPackageJson = await TSConfigLoader.parsePackageJson(`${typesPath}/package.json`);
      if (typesPackageJson) {
        await DependencyLoader.loadBuiltInTypes(typesPackageName, typesPath, typesPackageJson);
      }
    } catch (error) {
      // @types package doesn't exist, which is fine
    }
  }

  /**
   * Load type definitions for scoped packages
   */
  private static async loadScopedTypesPackage(projectPath: string, scopedPackageName: string): Promise<void> {
    // For @scope/package-name, look for @types/scope__package-name
    const normalizedName = scopedPackageName
      .substring(1) // Remove leading @
      .replace('/', '__');
    
    await DependencyLoader.loadCorrespondingTypesPackage(projectPath, normalizedName);
  }

  /**
   * Load all .d.ts files from a package intelligently
   */
  private static async loadAllPackageTypeFiles(packagePath: string, packageName: string): Promise<void> {
    try {
      // Search for all .d.ts files in the package, prioritizing common directories
      const priorityPatterns = [
        '*.d.ts',           // Root level
        'types/**/*.d.ts',  // Types directory (comprehensive)
        'lib/**/*.d.ts',    // Lib directory (comprehensive)
        'dist/**/*.d.ts',   // Dist directory (comprehensive)
        'src/**/*.d.ts',    // Source directory (comprehensive)
        'typings/**/*.d.ts' // Typings directory (comprehensive)
      ];

      const loadedFiles = new Set<string>();
      let totalLoaded = 0;
      
      for (const pattern of priorityPatterns) {
        try {
          const typeFiles = await projectApi.searchFiles(pattern, packagePath, {
            excludePatterns: ['**/node_modules/**', '**/test/**', '**/tests/**', '**/spec/**', '**/__tests__/**', '**/*.test.d.ts', '**/*.spec.d.ts']
          });

          // Load more files for important packages
          const maxFiles = packageName.startsWith('@types/') ? 100 : 30;
          const filesToLoad = typeFiles.slice(0, maxFiles).filter(filePath => !loadedFiles.has(filePath));
          
          const loadPromises = filesToLoad.map(async (filePath) => {
            try {
              if (loadedFiles.has(filePath)) return;
              
              const { content } = await projectApi.openFile(filePath);
              
              // Create relative path from package root
              const relativePath = filePath.replace(packagePath, '').replace(/^\//, '');
              const virtualPath = `file:///node_modules/${packageName}/${relativePath}`;
              
              monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
              loadedFiles.add(filePath);
              totalLoaded++;
              
            } catch (error) {
              console.warn(`Failed to load type file ${filePath}:`, error);
            }
          });

          await Promise.allSettled(loadPromises);
          
          // Continue loading files until we hit reasonable limits
          if (totalLoaded >= 500) {
            break;
          }
          
        } catch (error) {
          console.warn(`Failed to search for type files with pattern ${pattern} in ${packagePath}:`, error);
        }
      }
      
    } catch (error) {
      console.warn(`Failed to search for type files in ${packagePath}:`, error);
    }
  }
}
