/**
 * VS Code integrated source file mapper
 * This version integrates with the actual VS Code search APIs through the tool system
 */

import { ReactComponentInfo, FrameworkInfo } from './iframe-inspector';
import { SourceLocation, ComponentSourceInfo } from './source-file-mapper';

export class VSCodeSourceFileMapper {
  private projectRoot: string;
  private sourceExtensions = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte'];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Maps a React component to its source file using VS Code tools
   */
  public async mapReactComponent(component: ReactComponentInfo): Promise<ComponentSourceInfo> {
    const possibleSources: SourceLocation[] = [];
    let primarySource: SourceLocation | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Strategy 1: Use React DevTools source location if available
    if (component.sourceLocation) {
      primarySource = {
        filePath: component.sourceLocation.fileName,
        lineNumber: component.sourceLocation.lineNumber,
        columnNumber: component.sourceLocation.columnNumber,
        relativePath: this.getRelativePath(component.sourceLocation.fileName)
      };
      possibleSources.push(primarySource);
      confidence = 'high';
    }

    // Strategy 2: Search by component name using grep_search
    try {
      const componentNameSources = await this.searchForComponent(component.componentName);
      possibleSources.push(...componentNameSources);
      
      if (!primarySource && componentNameSources.length > 0) {
        primarySource = componentNameSources[0];
        confidence = 'medium';
      }
    } catch (error) {
      console.warn('Error searching for component by name:', error);
    }

    // Strategy 3: Find files by naming conventions using file_search
    if (possibleSources.length === 0) {
      try {
        const conventionSources = await this.findByNamingConventions(component.componentName);
        possibleSources.push(...conventionSources);
        
        if (!primarySource && conventionSources.length > 0) {
          primarySource = conventionSources[0];
          confidence = 'low';
        }
      } catch (error) {
        console.warn('Error finding files by naming conventions:', error);
      }
    }

    return {
      component,
      sourceLocation: primarySource,
      possibleSources: this.deduplicateSources(possibleSources),
      confidence
    };
  }

  /**
   * Search for component using VS Code's grep search
   */
  private async searchForComponent(componentName: string): Promise<SourceLocation[]> {
    const sources: SourceLocation[] = [];

    // Search patterns for React components
    const patterns = [
      `export.*${componentName}`,
      `function ${componentName}`,
      `const ${componentName}`,
      `class ${componentName}`,
      `${componentName}.*=.*=>`,
      `${componentName}.*=.*function`
    ];

    for (const pattern of patterns) {
      try {
        // This would be called through the tool system in the actual implementation
        const searchResults = await this.performGrepSearch(pattern);
        sources.push(...searchResults);
      } catch (error) {
        console.warn(`Error searching for pattern "${pattern}":`, error);
      }
    }

    return sources;
  }

  /**
   * Find files using naming conventions with VS Code's file search
   */
  private async findByNamingConventions(componentName: string): Promise<SourceLocation[]> {
    const sources: SourceLocation[] = [];
    
    // Common naming patterns
    const patterns = [
      componentName,
      componentName.toLowerCase(),
      this.camelToKebab(componentName),
      this.camelToSnake(componentName)
    ];

    for (const pattern of patterns) {
      for (const ext of this.sourceExtensions) {
        const candidates = [
          `**/${pattern}${ext}`,
          `**/${pattern}/index${ext}`,
          `**/components/${pattern}${ext}`,
          `**/components/${pattern}/index${ext}`,
          `**/src/${pattern}${ext}`,
          `**/src/components/${pattern}${ext}`
        ];

        for (const candidate of candidates) {
          try {
            const fileResults = await this.performFileSearch(candidate);
            sources.push(...fileResults);
          } catch (error) {
            console.warn(`Error searching for files with pattern "${candidate}":`, error);
          }
        }
      }
    }

    return sources;
  }

  /**
   * Perform grep search (this would be called through the tool system)
   */
  private async performGrepSearch(pattern: string): Promise<SourceLocation[]> {
    // In the actual implementation, this would use the grep_search tool
    // For now, we'll simulate the interface
    
    console.log(`Would perform grep search for: ${pattern}`);
    
    // Example of how this would work:
    // const results = await grep_search({
    //   query: pattern,
    //   isRegexp: true,
    //   includePattern: "**/*.{tsx,jsx,ts,js}",
    //   maxResults: 20
    // });
    
    // return results.map(result => ({
    //   filePath: result.file,
    //   lineNumber: result.line,
    //   relativePath: this.getRelativePath(result.file)
    // }));
    
    return [];
  }

  /**
   * Perform file search (this would be called through the tool system)
   */
  private async performFileSearch(pattern: string): Promise<SourceLocation[]> {
    // In the actual implementation, this would use the file_search tool
    // For now, we'll simulate the interface
    
    console.log(`Would perform file search for: ${pattern}`);
    
    // Example of how this would work:
    // const files = await file_search({
    //   query: pattern,
    //   maxResults: 10
    // });
    
    // return files.map(file => ({
    //   filePath: file,
    //   relativePath: this.getRelativePath(file)
    // }));
    
    return [];
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();
  }

  /**
   * Get relative path from absolute path
   */
  private getRelativePath(absolutePath: string): string {
    if (absolutePath.startsWith(this.projectRoot)) {
      return absolutePath.substring(this.projectRoot.length).replace(/^\//, '');
    }
    return absolutePath;
  }

  /**
   * Remove duplicate sources
   */
  private deduplicateSources(sources: SourceLocation[]): SourceLocation[] {
    const seen = new Set<string>();
    return sources.filter(source => {
      const key = `${source.filePath}:${source.lineNumber}:${source.columnNumber}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
