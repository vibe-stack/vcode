import { projectApi } from '@/services/project-api';
import { MentionItem } from './types';

export class MentionProvider {
  private static instance: MentionProvider;
  private cachedFiles: string[] = [];
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): MentionProvider {
    if (!MentionProvider.instance) {
      MentionProvider.instance = new MentionProvider();
    }
    return MentionProvider.instance;
  }

  async searchMentions(query: string, type: 'file' | 'all' = 'all'): Promise<MentionItem[]> {
    const results: MentionItem[] = [];

    if (type === 'file' || type === 'all') {
      const fileResults = await this.searchFiles(query);
      results.push(...fileResults);
    }

    // Future: Add other mention types like URLs, references, etc.
    if (type === 'all') {
      // Add URL suggestions for common patterns
      if (query.includes('http') || query.includes('www')) {
        results.push({
          id: `url-${query}`,
          label: query,
          type: 'url',
          description: 'Web URL',
        });
      }
    }

    return results;
  }

  // Synchronous search for Tiptap suggestions
  searchMentionsSync(query: string, type: 'file' | 'all' = 'all'): MentionItem[] {
    const results: MentionItem[] = [];

    if (type === 'file' || type === 'all') {
      const fileResults = this.searchFilesSync(query);
      results.push(...fileResults);
    }

    // Future: Add other mention types like URLs, references, etc.
    if (type === 'all') {
      // Add URL suggestions for common patterns
      if (query.includes('http') || query.includes('www')) {
        results.push({
          id: `url-${query}`,
          label: query,
          type: 'url',
          description: 'Web URL',
        });
      }
    }
    return results;
  }

  // Synchronous search for cached files
  private searchFilesSync(query: string): MentionItem[] {
    try {
      // Use cached files only (no async update)
      const matchingFiles = this.cachedFiles.filter(filePath => {
        const fileName = filePath.split('/').pop() || '';
        // If query is empty, show all files (limited)
        if (query.trim() === '') {
          return true;
        }
        return fileName.toLowerCase().includes(query.toLowerCase());
      });

      // Convert to MentionItem format
      return matchingFiles.slice(0, 10).map(filePath => ({
        id: `file-${filePath}`,
        label: filePath.split('/').pop() || filePath,
        type: 'file' as const,
        path: filePath,
        description: this.getFileDescription(filePath),
      }));
    } catch (error) {
      console.error('Error searching files (sync):', error);
      return [];
    }
  }

  private async searchFiles(query: string): Promise<MentionItem[]> {
    try {
      // Update cache if needed
      await this.updateFileCache();

      // Filter files by query
      const matchingFiles = this.cachedFiles.filter(filePath => {
        const fileName = filePath.split('/').pop() || '';
        return fileName.toLowerCase().includes(query.toLowerCase());
      });

      // Convert to MentionItem format
      return matchingFiles.slice(0, 10).map(filePath => ({
        id: `file-${filePath}`,
        label: filePath.split('/').pop() || filePath,
        type: 'file' as const,
        path: filePath,
        description: this.getFileDescription(filePath),
      }));
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  private async updateFileCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheTime < this.CACHE_DURATION) {
      return; // Cache is still fresh
    }

    try {
      // Get current project and search for files
      const currentProject = await projectApi.getCurrentProject();
      if (!currentProject) {
        this.cachedFiles = [];
        return;
      }

      // Search for all files in the project
      const files = await projectApi.searchFiles('', currentProject, {
        excludePatterns: ['node_modules', '.git', 'dist', 'build', '.next', '.vscode'],
      });

      this.cachedFiles = files;
      this.lastCacheTime = now;
    } catch (error) {
      console.error('Error updating file cache:', error);
      this.cachedFiles = [];
    }
  }

  private getFileDescription(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const descriptions: Record<string, string> = {
      'ts': 'TypeScript file',
      'tsx': 'TypeScript React file',
      'js': 'JavaScript file',
      'jsx': 'JavaScript React file',
      'css': 'CSS stylesheet',
      'scss': 'SCSS stylesheet',
      'html': 'HTML file',
      'json': 'JSON file',
      'md': 'Markdown file',
      'txt': 'Text file',
      'py': 'Python file',
      'java': 'Java file',
      'cpp': 'C++ file',
      'c': 'C file',
      'php': 'PHP file',
      'rb': 'Ruby file',
      'go': 'Go file',
      'rs': 'Rust file',
      'swift': 'Swift file',
      'kt': 'Kotlin file',
      'vue': 'Vue component',
      'svelte': 'Svelte component',
    };

    return descriptions[extension || ''] || 'File';
  }

  clearCache(): void {
    this.cachedFiles = [];
    this.lastCacheTime = 0;
  }

  // Preload cache for better performance
  async preloadCache(): Promise<void> {
    await this.updateFileCache();
  }
}

export const mentionProvider = MentionProvider.getInstance();
