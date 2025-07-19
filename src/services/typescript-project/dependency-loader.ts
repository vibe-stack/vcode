// Dependency Type Loading

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';
import { TSConfigLoader } from './tsconfig-loader';
import type { PackageJson } from './types';

export class DependencyLoader {
  /**
   * Load type definitions from project dependencies by properly parsing package.json and node_modules
   */
  static async loadProjectDependencyTypes(projectPath: string): Promise<void> {
    try {
      console.log('Loading project dependency types...');
      
      // Parse package.json to get actual dependencies
      const packageJsonPath = `${projectPath}/package.json`;
      const packageJson = await TSConfigLoader.parsePackageJson(packageJsonPath);
      
      if (!packageJson) {
        console.log('No package.json found, skipping dependency type loading');
        return;
      }

      // Get all dependencies
      const allDependencies = DependencyLoader.getAllDependencies(packageJson);
      console.log(`Found ${Object.keys(allDependencies).length} dependencies to analyze for types`);

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

      console.log('Finished loading dependency types');
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
        console.log(`Package ${dependencyName} not found in node_modules`);
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
      console.log(`Error loading types for ${dependencyName}:`, error);
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

      // First, try to load the main entry point
      for (const entryPoint of typeEntryPoints) {
        const fullPath = entryPoint!.startsWith('/') ? 
          `${packagePath}${entryPoint}` : 
          `${packagePath}/${entryPoint}`;

        try {
          const { content } = await projectApi.openFile(fullPath);
          
          // Create virtual file path for Monaco
          const virtualPath = `file:///node_modules/${packageName}/${entryPoint}`;
          
          monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
          console.log(`Loaded built-in types for ${packageName} from ${entryPoint}`);
          
          foundTypes = true;
          break;
          
        } catch (error) {
          // Continue to next entry point
        }
      }

      // Always scan for additional .d.ts files to catch re-exports and additional types
      await DependencyLoader.loadAllPackageTypeFiles(packagePath, packageName);
      
      // For packages like Next.js, also check for specific type files
      if (packageName === 'next') {
        await DependencyLoader.loadNextJSSpecificTypes(packagePath, packageName);
      }

      return foundTypes;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load specific type files for Next.js which has a complex type structure
   */
  private static async loadNextJSSpecificTypes(packagePath: string, packageName: string): Promise<void> {
    const nextSpecificFiles = [
      'types/global.d.ts',
      'types/index.d.ts',
      'dist/types/global.d.ts',
      'dist/types/index.d.ts',
      'dist/lib/metadata/types/metadata-types.d.ts',
      'dist/lib/metadata/types/metadata-interface.d.ts'
    ];

    for (const filePath of nextSpecificFiles) {
      try {
        const fullPath = `${packagePath}/${filePath}`;
        const { content } = await projectApi.openFile(fullPath);
        
        const virtualPath = `file:///node_modules/${packageName}/${filePath}`;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
        console.log(`Loaded Next.js specific types from ${filePath}`);
      } catch (error) {
        // File doesn't exist, continue
      }
    }
  }

  /**
   * Load type definitions from corresponding @types package
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
          const maxFiles = packageName === 'next' || packageName.startsWith('@types/') ? 100 : 30;
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
          if (totalLoaded >= (packageName === 'next' ? 150 : 50)) {
            break;
          }
          
        } catch (error) {
          console.warn(`Failed to search for type files with pattern ${pattern} in ${packagePath}:`, error);
        }
      }
      
      if (totalLoaded > 0) {
        console.log(`Loaded ${totalLoaded} type files for ${packageName}`);
      }
      
    } catch (error) {
      console.warn(`Failed to search for type files in ${packagePath}:`, error);
    }
  }
}
