// TypeScript Project Service for Monaco Editor
// Provides proper TypeScript intellisense by integrating with project tsconfig.json

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';

export interface TSConfigCompilerOptions {
  target?: string;
  lib?: string[];
  module?: string;
  moduleResolution?: string;
  strict?: boolean;
  esModuleInterop?: boolean;
  allowSyntheticDefaultImports?: boolean;
  skipLibCheck?: boolean;
  allowJs?: boolean;
  jsx?: string;
  declaration?: boolean;
  outDir?: string;
  rootDir?: string;
  baseUrl?: string;
  paths?: Record<string, string[]>;
  typeRoots?: string[];
  types?: string[];
  [key: string]: any;
}

export interface TSConfig {
  compilerOptions?: TSConfigCompilerOptions;
  include?: string[];
  exclude?: string[];
  extends?: string;
}

export interface ProjectFileInfo {
  path: string;
  content: string;
  version: number;
}

class TypeScriptProjectService {
  private static instance: TypeScriptProjectService;
  private currentProject: string | null = null;
  private tsConfig: TSConfig | null = null;
  private projectFiles = new Map<string, ProjectFileInfo>();
  private fileVersions = new Map<string, number>();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): TypeScriptProjectService {
    if (!TypeScriptProjectService.instance) {
      TypeScriptProjectService.instance = new TypeScriptProjectService();
    }
    return TypeScriptProjectService.instance;
  }

  /**
   * Initialize TypeScript project for the current workspace
   */
  async initializeProject(projectPath: string): Promise<void> {
    if (this.currentProject === projectPath && this.isInitialized) {
      return;
    }

    console.log('Initializing TypeScript project:', projectPath);
    this.currentProject = projectPath;
    this.projectFiles.clear();
    this.fileVersions.clear();

    try {
      // Look for tsconfig.json
      await this.loadTSConfig(projectPath);
      
      if (this.tsConfig) {
        // Apply tsconfig settings to Monaco
        await this.applyTSConfigToMonaco();
        
        // Load project files for better intellisense
        await this.loadProjectFiles(projectPath);
        
        // Add common type definitions
        await this.addCommonTypeDefinitions();
        
        // Add basic type definitions as fallback
        await this.addBasicTypeDefinitions();
        
        this.isInitialized = true;
        console.log('TypeScript project initialized successfully');
      } else {
        console.log('No tsconfig.json found, using default TypeScript settings');
        // Still add common type definitions even without tsconfig
        await this.addCommonTypeDefinitions();
        await this.addBasicTypeDefinitions();
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Error initializing TypeScript project:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Load and parse tsconfig.json
   */
  private async loadTSConfig(projectPath: string): Promise<void> {
    try {
      // Try multiple possible tsconfig.json locations
      const possiblePaths = [
        `${projectPath}/tsconfig.json`,
        `${projectPath}/tsconfig.app.json`,
        `${projectPath}/jsconfig.json`
      ];
      
      console.log('Looking for TypeScript config in:', possiblePaths);
      
      for (const tsconfigPath of possiblePaths) {
        try {
          const { content } = await projectApi.openFile(tsconfigPath);
          
          // Parse JSON with comments support (basic implementation)
          const cleanedContent = this.removeJSONComments(content);
          this.tsConfig = JSON.parse(cleanedContent);
          
          console.log(`Loaded ${tsconfigPath}:`, this.tsConfig);
          return;
        } catch (error) {
          console.log(`Failed to load ${tsconfigPath}:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      // If we get here, no tsconfig was found
      this.tsConfig = null;
      console.log('No valid tsconfig.json found');
    } catch (error) {
      // tsconfig.json not found or invalid
      this.tsConfig = null;
      console.log('No valid tsconfig.json found');
    }
  }

  /**
   * Remove comments from JSON (basic implementation)
   */
  private removeJSONComments(content: string): string {
    // Remove single-line comments
    content = content.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    return content;
  }

  /**
   * Apply tsconfig.json settings to Monaco Editor
   */
  private async applyTSConfigToMonaco(): Promise<void> {
    if (!this.tsConfig?.compilerOptions) {
      return;
    }

    const options = this.tsConfig.compilerOptions;
    const monacoOptions: monaco.languages.typescript.CompilerOptions = {};

    // Map common TypeScript compiler options to Monaco
    if (options.target) {
      const targetMap: Record<string, monaco.languages.typescript.ScriptTarget> = {
        'ES3': monaco.languages.typescript.ScriptTarget.ES3,
        'ES5': monaco.languages.typescript.ScriptTarget.ES5,
        'ES2015': monaco.languages.typescript.ScriptTarget.ES2015,
        'ES2016': monaco.languages.typescript.ScriptTarget.ES2016,
        'ES2017': monaco.languages.typescript.ScriptTarget.ES2017,
        'ES2018': monaco.languages.typescript.ScriptTarget.ES2018,
        'ES2019': monaco.languages.typescript.ScriptTarget.ES2019,
        'ES2020': monaco.languages.typescript.ScriptTarget.ES2020,
        'ESNext': monaco.languages.typescript.ScriptTarget.Latest,
      };
      monacoOptions.target = targetMap[options.target] || monaco.languages.typescript.ScriptTarget.Latest;
    }

    if (options.module) {
      const moduleMap: Record<string, monaco.languages.typescript.ModuleKind> = {
        'None': monaco.languages.typescript.ModuleKind.None,
        'CommonJS': monaco.languages.typescript.ModuleKind.CommonJS,
        'AMD': monaco.languages.typescript.ModuleKind.AMD,
        'UMD': monaco.languages.typescript.ModuleKind.UMD,
        'System': monaco.languages.typescript.ModuleKind.System,
        'ES6': monaco.languages.typescript.ModuleKind.ES2015,
        'ES2015': monaco.languages.typescript.ModuleKind.ES2015,
        'ESNext': monaco.languages.typescript.ModuleKind.ESNext,
      };
      monacoOptions.module = moduleMap[options.module] || monaco.languages.typescript.ModuleKind.ESNext;
    }

    if (options.moduleResolution) {
      const moduleResolutionMap: Record<string, monaco.languages.typescript.ModuleResolutionKind> = {
        'Classic': monaco.languages.typescript.ModuleResolutionKind.Classic,
        'Node': monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        'bundler': monaco.languages.typescript.ModuleResolutionKind.NodeJs, // Treat bundler as Node for Monaco
      };
      monacoOptions.moduleResolution = moduleResolutionMap[options.moduleResolution] || monaco.languages.typescript.ModuleResolutionKind.NodeJs;
    }

    if (options.jsx) {
      const jsxMap: Record<string, monaco.languages.typescript.JsxEmit> = {
        'preserve': monaco.languages.typescript.JsxEmit.Preserve,
        'react': monaco.languages.typescript.JsxEmit.React,
        'react-jsx': monaco.languages.typescript.JsxEmit.ReactJSX,
        'react-jsxdev': monaco.languages.typescript.JsxEmit.ReactJSXDev,
        'react-native': monaco.languages.typescript.JsxEmit.ReactNative,
      };
      monacoOptions.jsx = jsxMap[options.jsx] || monaco.languages.typescript.JsxEmit.React;
    }

    // Set other boolean options
    if (options.strict !== undefined) monacoOptions.strict = options.strict;
    if (options.esModuleInterop !== undefined) monacoOptions.esModuleInterop = options.esModuleInterop;
    if (options.allowSyntheticDefaultImports !== undefined) monacoOptions.allowSyntheticDefaultImports = options.allowSyntheticDefaultImports;
    if (options.skipLibCheck !== undefined) monacoOptions.skipLibCheck = options.skipLibCheck;
    if (options.allowJs !== undefined) monacoOptions.allowJs = options.allowJs;

    // Always set these for better Monaco experience
    monacoOptions.allowNonTsExtensions = true;
    monacoOptions.noEmit = true;

    // Set lib files if specified
    if (options.lib) {
      monacoOptions.lib = options.lib.map(lib => {
        // Monaco expects lib files without the "lib." prefix and ".d.ts" suffix
        return lib.replace(/^lib\./, '').replace(/\.d\.ts$/, '');
      });
    }

    // Apply to both TypeScript and JavaScript defaults
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(monacoOptions);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(monacoOptions);

    console.log('Applied tsconfig compiler options to Monaco:', monacoOptions);
    console.log('Original tsconfig options:', options);
  }

  /**
   * Load project files to provide better intellisense
   */
  private async loadProjectFiles(projectPath: string): Promise<void> {
    try {
      // Get all TypeScript/JavaScript files in the project
      const files = await projectApi.searchFiles('*.{ts,tsx,js,jsx,d.ts}', projectPath, {
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**', '**/*.min.js', '.git/**']
      });

      console.log(`Found ${files.length} TypeScript/JavaScript files`);

      // Load content for a reasonable number of files (to avoid overwhelming Monaco)
      const filesToLoad = files.slice(0, 50); // Reduced to 50 files for better performance
      
      const loadPromises = filesToLoad.map(async (filePath) => {
        try {
          await this.loadFileIntoMonaco(filePath);
        } catch (error) {
          console.warn(`Failed to load file ${filePath}:`, error);
        }
      });

      // Load files in parallel but with a reasonable limit
      await Promise.allSettled(loadPromises);

      console.log(`Loaded ${this.projectFiles.size} files into Monaco TypeScript service`);
    } catch (error) {
      console.error('Error loading project files:', error);
    }
  }

  /**
   * Load a single file into Monaco's TypeScript service
   */
  async loadFileIntoMonaco(filePath: string): Promise<void> {
    if (!this.currentProject) return;

    try {
      const { content } = await projectApi.openFile(filePath);
      
      // Create a relative path from project root
      const relativePath = filePath.replace(this.currentProject, '').replace(/^\//, '');
      
      // Generate Monaco URI
      const uri = monaco.Uri.file(filePath);
      
      // Update file version
      const currentVersion = this.fileVersions.get(filePath) || 0;
      const newVersion = currentVersion + 1;
      this.fileVersions.set(filePath, newVersion);

      // Store file info
      this.projectFiles.set(filePath, {
        path: filePath,
        content,
        version: newVersion
      });

      // Add to Monaco's extra libs if it's a .d.ts file
      if (filePath.endsWith('.d.ts')) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          content,
          `file:///${relativePath}`
        );
      } else {
        // For regular TS/JS/TSX/JSX files, create a model if it doesn't exist
        const existingModel = monaco.editor.getModel(uri);
        if (!existingModel) {
          // Monaco Editor uses 'typescript' for both .ts and .tsx files
          // and 'javascript' for both .js and .jsx files
          const language = (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) ? 'typescript' : 'javascript';
          monaco.editor.createModel(content, language, uri);
        }
      }

    } catch (error) {
      console.error(`Error loading file ${filePath} into Monaco:`, error);
    }
  }

  /**
   * Update a file in Monaco when it changes
   */
  async updateFile(filePath: string, content: string): Promise<void> {
    if (!this.isInitialized || !this.currentProject) {
      return;
    }

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
    const currentVersion = this.fileVersions.get(filePath) || 0;
    this.fileVersions.set(filePath, currentVersion + 1);
    this.projectFiles.set(filePath, {
      path: filePath,
      content,
      version: currentVersion + 1
    });
  }

  /**
   * Remove a file from Monaco when it's deleted
   */
  removeFile(filePath: string): void {
    const uri = monaco.Uri.file(filePath);
    const model = monaco.editor.getModel(uri);
    
    if (model) {
      model.dispose();
    }

    this.projectFiles.delete(filePath);
    this.fileVersions.delete(filePath);
  }

  /**
   * Get current project path
   */
  getCurrentProject(): string | null {
    return this.currentProject;
  }

  /**
   * Get loaded tsconfig
   */
  getTSConfig(): TSConfig | null {
    return this.tsConfig;
  }

  /**
   * Check if project is properly initialized
   */
  isProjectInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Load actual type definitions from the project's dependencies
   */
  private async addCommonTypeDefinitions(): Promise<void> {
    try {
      // Load type definitions from node_modules
      await this.loadNodeModulesTypeDefinitions();
      
      // Load type definitions from project's own .d.ts files
      await this.loadProjectTypeDefinitions();
      
      console.log('Loaded actual type definitions from project');
    } catch (error) {
      console.error('Error loading type definitions:', error);
    }
  }

  /**
   * Load type definitions from node_modules
   */
  private async loadNodeModulesTypeDefinitions(): Promise<void> {
    if (!this.currentProject) return;

    try {
      const nodeModulesPath = `${this.currentProject}/node_modules`;
      
      // Check if node_modules exists
      try {
        await projectApi.openFile(`${nodeModulesPath}/package.json`);
      } catch {
        console.log('No node_modules found, skipping type definitions loading');
        return;
      }

      // Load package.json to discover dependencies
      const packageJsonPath = `${this.currentProject}/package.json`;
      try {
        const { content } = await projectApi.openFile(packageJsonPath);
        const packageJson = JSON.parse(content);
        
        // Get all dependencies (dependencies, devDependencies, peerDependencies)
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
          ...packageJson.peerDependencies
        };

        // Load type definitions for each dependency
        const typeLoadPromises = Object.keys(allDeps).map(async (depName) => {
          await this.loadPackageTypeDefinitions(depName);
        });

        // Also load common @types packages
        const commonTypes = ['@types/node', '@types/react', '@types/react-dom'];
        for (const typePkg of commonTypes) {
          if (!allDeps[typePkg]) {
            typeLoadPromises.push(this.loadPackageTypeDefinitions(typePkg));
          }
        }

        await Promise.allSettled(typeLoadPromises);
        
      } catch (error) {
        console.log('Could not read package.json, loading common types only');
        // Fallback: try to load common type packages
        const commonTypes = ['@types/node', '@types/react', '@types/react-dom'];
        const fallbackPromises = commonTypes.map(pkg => this.loadPackageTypeDefinitions(pkg));
        await Promise.allSettled(fallbackPromises);
      }

    } catch (error) {
      console.error('Error loading node_modules type definitions:', error);
    }
  }

  /**
   * Load type definitions for a specific package
   */
  private async loadPackageTypeDefinitions(packageName: string): Promise<void> {
    if (!this.currentProject) return;

    try {
      const packagePath = `${this.currentProject}/node_modules/${packageName}`;
      
      // Try to find the main .d.ts file
      const possibleIndexFiles = [
        `${packagePath}/index.d.ts`,
        `${packagePath}/lib/index.d.ts`,
        `${packagePath}/dist/index.d.ts`,
        `${packagePath}/types/index.d.ts`,
        `${packagePath}/typings/index.d.ts`
      ];

      // Check package.json for types field
      try {
        const { content: pkgContent } = await projectApi.openFile(`${packagePath}/package.json`);
        const pkgJson = JSON.parse(pkgContent);
        
        if (pkgJson.types) {
          possibleIndexFiles.unshift(`${packagePath}/${pkgJson.types}`);
        }
        if (pkgJson.typings) {
          possibleIndexFiles.unshift(`${packagePath}/${pkgJson.typings}`);
        }
      } catch {
        // Package.json not found or invalid, continue with default paths
      }

      // Try to load the main type definition file
      for (const indexFile of possibleIndexFiles) {
        try {
          const { content } = await projectApi.openFile(indexFile);
          
          // Create a virtual file path for Monaco
          const virtualPath = `file:///node_modules/${packageName}/index.d.ts`;
          
          monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
          console.log(`Loaded types for ${packageName} from ${indexFile}`);
          
          // Try to load additional .d.ts files from the package
          await this.loadAllPackageTypeFiles(packagePath, packageName);
          break;
          
        } catch {
          // Try next possible location
          continue;
        }
      }

    } catch (error) {
      // Package not found or no types available
      console.log(`No type definitions found for ${packageName}`);
    }
  }

  /**
   * Load all .d.ts files from a package
   */
  private async loadAllPackageTypeFiles(packagePath: string, packageName: string): Promise<void> {
    try {
      // Search for all .d.ts files in the package
      const typeFiles = await projectApi.searchFiles('**/*.d.ts', packagePath, {
        excludePatterns: ['**/node_modules/**', '**/test/**', '**/tests/**', '**/spec/**']
      });

      // Load each type file
      const loadPromises = typeFiles.slice(0, 20).map(async (filePath) => {
        try {
          const { content } = await projectApi.openFile(filePath);
          
          // Create relative path from package root
          const relativePath = filePath.replace(packagePath, '').replace(/^\//, '');
          const virtualPath = `file:///node_modules/${packageName}/${relativePath}`;
          
          monaco.languages.typescript.typescriptDefaults.addExtraLib(content, virtualPath);
          
        } catch (error) {
          console.warn(`Failed to load type file ${filePath}:`, error);
        }
      });

      await Promise.allSettled(loadPromises);
      
    } catch (error) {
      console.warn(`Failed to search for type files in ${packagePath}:`, error);
    }
  }

  /**
   * Load type definitions from the project's own .d.ts files
   */
  private async loadProjectTypeDefinitions(): Promise<void> {
    if (!this.currentProject) return;

    try {
      // Search for .d.ts files in the project (excluding node_modules)
      const projectTypeFiles = await projectApi.searchFiles('**/*.d.ts', this.currentProject, {
        excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '.git/**']
      });

      console.log(`Found ${projectTypeFiles.length} project type definition files`);

      // Load each project .d.ts file
      const loadPromises = projectTypeFiles.map(async (filePath) => {
        try {
          const { content } = await projectApi.openFile(filePath);
          
          // Create relative path from project root
          const relativePath = filePath.replace(this.currentProject!, '').replace(/^\//, '');
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

  /**
   * Check if the current project appears to be a Node.js project
   */
  private isNodeProject(): boolean {
    if (!this.currentProject) return false;
    
    // Check if we have Node.js related dependencies or configuration
    return this.hasPackageJson() || this.hasNodeTypeDefinitions();
  }

  /**
   * Check if the current project appears to be a React project
   */
  private isReactProject(): boolean {
    // Check if JSX is configured in TypeScript
    if (this.tsConfig?.compilerOptions?.jsx) {
      const jsxSettings = ['react', 'react-jsx', 'react-jsxdev', 'react-native'];
      return jsxSettings.includes(this.tsConfig.compilerOptions.jsx);
    }
    
    // If no tsconfig, check if we have any TSX/JSX files loaded
    for (const filePath of this.projectFiles.keys()) {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if package.json exists in the current project
   */
  private hasPackageJson(): boolean {
    // This would need to be implemented with a sync check or cached from initialization
    // For now, assume true if we have a current project
    return !!this.currentProject;
  }

  /**
   * Check if Node.js type definitions are available
   */
  private hasNodeTypeDefinitions(): boolean {
    // Check if @types/node is in our loaded files
    for (const filePath of this.projectFiles.keys()) {
      if (filePath.includes('@types/node') || filePath.includes('node_modules/@types/node')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Refresh the TypeScript project configuration (useful when tsconfig.json changes)
   */
  async refreshProject(): Promise<void> {
    if (!this.currentProject) return;
    
    console.log('Refreshing TypeScript project configuration');
    
    // Clear existing extra libs to avoid stale type definitions
    this.clearMonacoExtraLibs();
    
    this.isInitialized = false;
    await this.initializeProject(this.currentProject);
  }

  /**
   * Clear Monaco's extra libraries (type definitions)
   */
  private clearMonacoExtraLibs(): void {
    try {
      // Monaco doesn't provide a direct way to clear all extra libs,
      // so we need to reset the typescript defaults
      monaco.languages.typescript.typescriptDefaults.setExtraLibs([]);
      monaco.languages.typescript.javascriptDefaults.setExtraLibs([]);
      console.log('Cleared Monaco extra libraries');
    } catch (error) {
      console.warn('Error clearing Monaco extra libraries:', error);
    }
  }

  /**
   * Clear all project data
   */
  clearProject(): void {
    this.currentProject = null;
    this.tsConfig = null;
    this.projectFiles.clear();
    this.fileVersions.clear();
    this.isInitialized = false;
    
    // Clear Monaco models for project files
    for (const filePath of this.projectFiles.keys()) {
      const uri = monaco.Uri.file(filePath);
      const model = monaco.editor.getModel(uri);
      if (model) {
        model.dispose();
      }
    }
    
    console.log('TypeScript project cleared');
  }

  /**
   * Debug method to log current state
   */
  debugInfo(): void {
    console.log('TypeScript Project Service Debug Info:');
    console.log('- Current Project:', this.currentProject);
    console.log('- Is Initialized:', this.isInitialized);
    console.log('- TSConfig:', this.tsConfig);
    console.log('- Loaded Files:', Array.from(this.projectFiles.keys()));
    console.log('- Is React Project:', this.isReactProject());
    console.log('- Is Node Project:', this.isNodeProject());
  }

  /**
   * Add basic type definitions for common scenarios when full project loading fails
   */
  private async addBasicTypeDefinitions(): Promise<void> {
    try {
      // Basic React types for JSX support
      const basicReactTypes = `
declare namespace React {
  interface Component<P = {}, S = {}> {}
  interface FunctionComponent<P = {}> {
    (props: P): JSX.Element | null;
  }
  type FC<P = {}> = FunctionComponent<P>;
  interface ReactElement<P = any> {}
}

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any> {}
    interface ElementClass extends React.Component<any> {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  export = React;
}
`;

      // Add basic React types
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        basicReactTypes,
        'file:///react-basic.d.ts'
      );

      // Basic DOM and global types
      const basicGlobalTypes = `
declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};

declare const window: Window & typeof globalThis;
declare const document: Document;
declare const process: any;
declare const require: any;
declare const module: any;
declare const exports: any;
declare const __dirname: string;
declare const __filename: string;
`;

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        basicGlobalTypes,
        'file:///globals-basic.d.ts'
      );

      console.log('Added basic type definitions');
    } catch (error) {
      console.error('Error adding basic type definitions:', error);
    }
  }
}

// Export singleton instance
export const typescriptProjectService = TypeScriptProjectService.getInstance();

// Export for debugging (can be accessed via window.tsService in browser console)
if (typeof window !== 'undefined') {
  (window as any).tsService = typescriptProjectService;
}
