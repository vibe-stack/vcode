// TypeScript Project Service - Main Export
// Provides proper TypeScript intellisense by integrating with project tsconfig.json

export * from './types';
export { TSConfigLoader } from './tsconfig-loader';
export { MonacoConfig } from './monaco-config';
export { FileManager } from './file-manager';
export { DependencyLoader } from './dependency-loader';
export { ProjectDetector } from './project-detector';
export { PathResolver } from './path-resolver';
export { TypeScriptProjectService } from './typescript-project-service';

// Export singleton instance
import { TypeScriptProjectService } from './typescript-project-service';
export const typescriptProjectService = TypeScriptProjectService.getInstance();

// Export for debugging (can be accessed via window.tsService in browser console)
if (typeof window !== 'undefined') {
  (window as any).tsService = typescriptProjectService;
}
