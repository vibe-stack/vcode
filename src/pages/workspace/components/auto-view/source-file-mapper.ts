/**
 * Source file mapper for mapping framework components to their source files
 * Handles React, Vue, Angular, and other frameworks with different strategies
 */

import { ReactComponentInfo, FrameworkInfo } from './iframe-inspector';

export interface SourceLocation {
  filePath: string;
  lineNumber?: number;
  columnNumber?: number;
  relativePath?: string;
}

export interface ComponentSourceInfo {
  component: ReactComponentInfo;
  sourceLocation: SourceLocation | null;
  possibleSources: SourceLocation[];
  confidence: 'high' | 'medium' | 'low';
}

export class SourceFileMapper {
  private projectRoot: string;
  private sourceExtensions = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte'];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Maps a React component to its source file
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

    // Strategy 2: Search by component name
    const componentNameSources = await this.findFilesByComponentName(component.componentName);
    possibleSources.push(...componentNameSources);

    // Strategy 3: Analyze fiber node for additional clues
    if (component.fiberNode && !primarySource) {
      const fiberSources = await this.analyzeFiberNode(component.fiberNode);
      possibleSources.push(...fiberSources);
      if (fiberSources.length > 0) {
        primarySource = fiberSources[0];
        confidence = 'medium';
      }
    }

    // Strategy 4: Fallback to naming conventions
    if (!primarySource && possibleSources.length === 0) {
      const conventionSources = await this.findByNamingConventions(component.componentName);
      possibleSources.push(...conventionSources);
      if (conventionSources.length > 0) {
        primarySource = conventionSources[0];
        confidence = 'low';
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
   * Find files that might contain the given component name
   */
  private async findFilesByComponentName(componentName: string): Promise<SourceLocation[]> {
    const sources: SourceLocation[] = [];
    
    try {
      // Use workspace search to find component definitions
      const patterns = [
        `export.*${componentName}`,
        `function ${componentName}`,
        `const ${componentName}`,
        `class ${componentName}`,
        `${componentName}.*=.*=>`,
        `${componentName}.*=.*function`
      ];

      for (const pattern of patterns) {
        const results = await this.searchWorkspace(pattern);
        sources.push(...results);
      }
    } catch (error) {
      console.warn('Error searching for component:', error);
    }

    return sources;
  }

  /**
   * Analyze React fiber node for source information
   */
  private async analyzeFiberNode(fiberNode: any): Promise<SourceLocation[]> {
    const sources: SourceLocation[] = [];

    try {
      // Check for source information in the fiber node
      if (fiberNode._debugSource) {
        sources.push({
          filePath: fiberNode._debugSource.fileName,
          lineNumber: fiberNode._debugSource.lineNumber,
          columnNumber: fiberNode._debugSource.columnNumber,
          relativePath: this.getRelativePath(fiberNode._debugSource.fileName)
        });
      }

      // Check parent fibers
      let parent = fiberNode.return;
      while (parent && sources.length < 3) {
        if (parent._debugSource) {
          sources.push({
            filePath: parent._debugSource.fileName,
            lineNumber: parent._debugSource.lineNumber,
            columnNumber: parent._debugSource.columnNumber,
            relativePath: this.getRelativePath(parent._debugSource.fileName)
          });
        }
        parent = parent.return;
      }
    } catch (error) {
      console.warn('Error analyzing fiber node:', error);
    }

    return sources;
  }

  /**
   * Find files using common naming conventions
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
          const results = await this.findFiles(candidate);
          sources.push(...results);
        }
      }
    }

    return sources;
  }

  /**
   * Search workspace for a pattern
   */
  private async searchWorkspace(pattern: string): Promise<SourceLocation[]> {
    const sources: SourceLocation[] = [];
    
    try {
      // TODO: Integrate with VS Code's workspace search API
      // This would use the grep_search tool to find component definitions
      // For now, we'll implement a basic simulation
      
      // Example implementation would be:
      // const results = await vscode.workspace.findTextInFiles(pattern, {
      //   include: '**/*.{tsx,jsx,ts,js}',
      //   exclude: '**/node_modules/**'
      // });
      
      console.log(`Searching workspace for pattern: ${pattern}`);
      
    } catch (error) {
      console.warn('Error searching workspace:', error);
    }
    
    return sources;
  }

  /**
   * Find files matching a glob pattern
   */
  private async findFiles(pattern: string): Promise<SourceLocation[]> {
    const sources: SourceLocation[] = [];
    
    try {
      // TODO: Integrate with VS Code's file search API
      // This would use the file_search tool to find matching files
      // For now, we'll implement a basic simulation
      
      // Example implementation would be:
      // const files = await vscode.workspace.findFiles(pattern);
      
      console.log(`Finding files with pattern: ${pattern}`);
      
    } catch (error) {
      console.warn('Error finding files:', error);
    }
    
    return sources;
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
