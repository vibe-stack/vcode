// TSConfig Loading and Parsing

import { projectApi } from '@/services/project-api';
import type { TSConfig } from './types';

export class TSConfigLoader {
  /**
   * Load and parse tsconfig.json from project
   */
  static async loadTSConfig(projectPath: string): Promise<TSConfig | null> {
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
          const cleanedContent = TSConfigLoader.removeJSONComments(content);
          const tsConfig = JSON.parse(cleanedContent);
          
          console.log(`Loaded ${tsconfigPath}:`, tsConfig);
          return tsConfig;
        } catch (error) {
          console.log(`Failed to load ${tsconfigPath}:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      // If we get here, no tsconfig was found
      console.log('No valid tsconfig.json found');
      return null;
    } catch (error) {
      // tsconfig.json not found or invalid
      console.log('No valid tsconfig.json found');
      return null;
    }
  }

  /**
   * Remove comments from JSON (basic implementation)
   */
  private static removeJSONComments(content: string): string {
    // Remove single-line comments
    content = content.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    return content;
  }

  /**
   * Parse package.json file
   */
  static async parsePackageJson(packageJsonPath: string): Promise<any | null> {
    try {
      const { content } = await projectApi.openFile(packageJsonPath);
      return JSON.parse(content);
    } catch (error) {
      console.log('Could not parse package.json:', error);
      return null;
    }
  }
}
