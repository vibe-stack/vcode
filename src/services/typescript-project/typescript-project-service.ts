// Main TypeScript Project Service

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';
import { TSConfigLoader } from './tsconfig-loader';
import { MonacoConfig } from './monaco-config';
import { FileManager } from './file-manager';
import { DependencyLoader } from './dependency-loader';
import { ProjectDetector } from './project-detector';
import { PathResolver } from './path-resolver';
import type { TSConfig, ProjectFileInfo } from './types';

export class TypeScriptProjectService {
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
      this.tsConfig = await TSConfigLoader.loadTSConfig(projectPath);
      
      if (this.tsConfig) {
        // Apply tsconfig settings to Monaco
        await MonacoConfig.applyTSConfigToMonaco(this.tsConfig, projectPath);
        
        // Setup enhanced module resolution
        MonacoConfig.setupMonacoModuleResolution(projectPath, this.tsConfig);
        
        // Load project files for better intellisense
        await FileManager.loadProjectFiles(projectPath, this.projectFiles, this.fileVersions, this.tsConfig);
        
        // Load TypeScript lib files based on tsconfig
        await MonacoConfig.loadTypeScriptLibFiles(projectPath, this.tsConfig);
        
        // Load actual type definitions from dependencies
        await DependencyLoader.loadProjectDependencyTypes(projectPath);
        
        // Load project's own type definitions
        await FileManager.loadProjectTypeDefinitions(projectPath);
        
        this.isInitialized = true;
        console.log('TypeScript project initialized successfully');
      } else {
        console.log('No tsconfig.json found, using default TypeScript settings');
        // Still load type definitions even without tsconfig
        MonacoConfig.setupMonacoModuleResolution(projectPath, null);
        await MonacoConfig.loadTypeScriptLibFiles(projectPath, null);
        await DependencyLoader.loadProjectDependencyTypes(projectPath);
        await FileManager.loadProjectTypeDefinitions(projectPath);
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Error initializing TypeScript project:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Update a file in Monaco when it changes
   */
  async updateFile(filePath: string, content: string): Promise<void> {
    if (!this.isInitialized || !this.currentProject) {
      return;
    }

    await FileManager.updateFile(filePath, content, this.projectFiles, this.fileVersions);
  }

  /**
   * Update file content in the service cache without modifying Monaco models
   * Use this when the change originates from Monaco editor to avoid circular updates
   */
  updateFileFromEditor(filePath: string, content: string): void {
    if (!this.isInitialized || !this.currentProject) {
      return;
    }

    FileManager.updateFileCache(filePath, content, this.projectFiles, this.fileVersions);
  }

  /**
   * Remove a file from Monaco when it's deleted
   */
  removeFile(filePath: string): void {
    FileManager.removeFile(filePath, this.projectFiles, this.fileVersions);
  }

  /**
   * Load a file into Monaco on demand
   */
  async loadFileIntoMonaco(filePath: string): Promise<void> {
    if (!this.currentProject) return;
    await FileManager.loadFileIntoMonaco(filePath, this.currentProject, this.projectFiles, this.fileVersions);
  }

  /**
   * Load a file on-demand when it's imported but not yet loaded
   */
  async loadFileOnDemand(importPath: string, fromFile: string): Promise<void> {
    if (!this.currentProject) return;
    await PathResolver.loadFileOnDemand(this.currentProject, this.tsConfig, importPath, fromFile);
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
   * Check if the current project appears to be a React project
   */
  isReactProject(): boolean {
    return ProjectDetector.isReactProject(this.tsConfig, this.projectFiles);
  }

  /**
   * Check if the current project appears to be a Node.js project
   */
  isNodeProject(): boolean {
    return ProjectDetector.isNodeProject(this.currentProject);
  }

  /**
   * Refresh the TypeScript project configuration (useful when tsconfig.json changes)
   */
  async refreshProject(): Promise<void> {
    if (!this.currentProject) return;
    
    console.log('Refreshing TypeScript project configuration');
    
    // Clear existing extra libs to avoid stale type definitions
    MonacoConfig.clearMonacoExtraLibs();
    
    this.isInitialized = false;
    await this.initializeProject(this.currentProject);
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
   * Debug method to help diagnose import issues
   */
  async debugImportIssue(importPath: string, fromFile: string): Promise<void> {
    console.log(`\n=== Debugging Import Issue ===`);
    console.log(`Import: "${importPath}"`);
    console.log(`From file: "${fromFile}"`);
    console.log(`Project: ${this.currentProject}`);
    console.log(`Initialized: ${this.isInitialized}`);
    
    if (!this.currentProject) {
      console.log('❌ No current project set');
      return;
    }

    // Check if it's a relative import
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      console.log('🔍 Checking relative import...');
      const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
      console.log(`From directory: ${fromDir}`);
      
      const potentialPaths = [];
      if (importPath.startsWith('./')) {
        const relativePath = importPath.substring(2);
        potentialPaths.push(
          `${fromDir}/${relativePath}`,
          `${fromDir}/${relativePath}.ts`,
          `${fromDir}/${relativePath}.tsx`,
          `${fromDir}/${relativePath}/index.ts`,
          `${fromDir}/${relativePath}/index.tsx`
        );
      }
      
      console.log('Checking these potential paths:');
      for (const path of potentialPaths) {
        try {
          await projectApi.openFile(path);
          console.log(`✅ Found: ${path}`);
        } catch {
          console.log(`❌ Not found: ${path}`);
        }
      }
    }
    
    // Check if it's a node_modules import
    else if (!importPath.startsWith('.')) {
      console.log('🔍 Checking node_modules import...');
      const packageName = importPath.split('/')[0];
      const packagePath = `${this.currentProject}/node_modules/${packageName}`;
      
      try {
        const { content } = await projectApi.openFile(`${packagePath}/package.json`);
        const packageJson = JSON.parse(content);
        console.log(`✅ Package found: ${packageName}`);
        console.log(`Package version: ${packageJson.version}`);
        console.log(`Types entry: ${packageJson.types || packageJson.typings || 'none'}`);
        console.log(`Main entry: ${packageJson.main || 'none'}`);
        
        // Check if types are loaded in Monaco
        const extraLibs = monaco.languages.typescript.typescriptDefaults.getExtraLibs();
        const typeLibs = Object.keys(extraLibs).filter(lib => lib.includes(packageName));
        console.log(`Loaded type libraries for ${packageName}: ${typeLibs.length}`);
        typeLibs.slice(0, 5).forEach(lib => console.log(`  - ${lib}`));
        
      } catch {
        console.log(`❌ Package not found: ${packageName}`);
      }
    }
    
    // Check tsconfig paths
    if (this.tsConfig?.compilerOptions?.paths) {
      console.log('🔍 Checking tsconfig paths...');
      for (const [pattern, mappings] of Object.entries(this.tsConfig.compilerOptions.paths)) {
        if (this.matchesPattern(pattern, importPath)) {
          console.log(`✅ Matches pattern: ${pattern} -> ${mappings.join(', ')}`);
        }
      }
    }
    
    console.log(`=== End Debug ===\n`);
  }

  /**
   * Helper method for pattern matching
   */
  private matchesPattern(pattern: string, importPath: string): boolean {
    if (!pattern.includes('*')) {
      return pattern === importPath;
    }
    const regexPattern = pattern.replace(/\*/g, '(.*)');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(importPath);
  }
}
