import React from 'react';
import { SmartIndexManager } from '@/components/SmartIndexManager';

// Example of how to integrate the Smart Index Manager into your IDE
export function ExampleIndexIntegration() {
  return (
    <div className="h-full">
      <SmartIndexManager />
    </div>
  );
}

// Example of programmatic usage
export class IndexService {
  static async buildProjectIndex(projectPath: string) {
    try {
      await window.indexApi?.buildIndex({
        projectPath,
        chunkSize: 500,
        chunkOverlap: 50,
        includePatterns: [
          '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
          '**/*.py', '**/*.java', '**/*.cpp', '**/*.c',
          '**/*.md', '**/*.json'
        ],
        excludePatterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.git/**'
        ]
      });
      
      console.log('Index built successfully');
      return true;
    } catch (error) {
      console.error('Failed to build index:', error);
      return false;
    }
  }

  static async searchCode(query: string): Promise<any[]> {
    try {
      const results = await window.indexApi?.search(query, 20);
      return results || [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  static async getIndexInfo() {
    try {
      const [status, stats] = await Promise.all([
        window.indexApi?.getStatus(),
        window.indexApi?.getStats()
      ]);
      
      return {
        isBuilt: status?.isBuilt || false,
        projectPath: status?.projectPath,
        lastUpdated: status?.lastUpdated,
        stats
      };
    } catch (error) {
      console.error('Failed to get index info:', error);
      return null;
    }
  }
}

// Example of integration with file change events
export function setupIndexFileWatcher() {
  // Listen for file changes and update index accordingly
  const handleFileChange = async (filePath: string) => {
    try {
      await window.indexApi?.updateFile(filePath);
      console.log(`Updated index for ${filePath}`);
    } catch (error) {
      console.error(`Failed to update index for ${filePath}:`, error);
    }
  };

  const handleFileDelete = async (filePath: string) => {
    try {
      await window.indexApi?.removeFile(filePath);
      console.log(`Removed ${filePath} from index`);
    } catch (error) {
      console.error(`Failed to remove ${filePath} from index:`, error);
    }
  };

  // You would integrate this with your existing file watcher system
  return {
    onFileChange: handleFileChange,
    onFileDelete: handleFileDelete
  };
}
