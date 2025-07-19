// Project Type Detection Utilities

import type { TSConfig, ProjectFileInfo } from './types';

export class ProjectDetector {
  /**
   * Check if the current project appears to be a Node.js project
   */
  static isNodeProject(projectPath: string | null): boolean {
    if (!projectPath) return false;
    
    // Check if we have Node.js related dependencies or configuration
    return ProjectDetector.hasPackageJson(projectPath) || ProjectDetector.hasNodeTypeDefinitions();
  }

  /**
   * Check if the current project appears to be a React project
   */
  static isReactProject(tsConfig: TSConfig | null, projectFiles: Map<string, ProjectFileInfo>): boolean {
    // Check if JSX is configured in TypeScript
    if (tsConfig?.compilerOptions?.jsx) {
      const jsxSettings = ['react', 'react-jsx', 'react-jsxdev', 'react-native'];
      return jsxSettings.includes(tsConfig.compilerOptions.jsx);
    }
    
    // If no tsconfig, check if we have any TSX/JSX files loaded
    for (const filePath of projectFiles.keys()) {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if package.json exists in the current project
   */
  private static hasPackageJson(projectPath: string): boolean {
    // This would need to be implemented with a sync check or cached from initialization
    // For now, assume true if we have a current project
    return !!projectPath;
  }

  /**
   * Check if Node.js type definitions are available
   */
  private static hasNodeTypeDefinitions(): boolean {
    // This is a simplified check - in a real implementation, you'd check the loaded files
    // For now, we'll assume this is handled elsewhere
    return false;
  }
}
