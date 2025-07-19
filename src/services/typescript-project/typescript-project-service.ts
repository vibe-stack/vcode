// Main TypeScript Project Service

import { TSConfigLoader } from './tsconfig-loader';
import { MonacoConfig } from './monaco-config';
import { FileManager } from './file-manager';
import { DependencyLoader } from './dependency-loader';
import { ProjectDetector } from './project-detector';
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
    // await PathResolver.loadFileOnDemand(this.currentProject, this.tsConfig, importPath, fromFile);
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
}
