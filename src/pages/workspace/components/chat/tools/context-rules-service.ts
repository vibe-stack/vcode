import * as yaml from 'js-yaml';
import { minimatch } from 'minimatch';

// Browser-compatible path utilities
const pathUtils = {
  dirname: (filePath: string): string => {
    const parts = filePath.split('/');
    return parts.slice(0, -1).join('/') || '/';
  },
  
  basename: (filePath: string): string => {
    return filePath.split('/').pop() || '';
  },
  
  join: (...parts: string[]): string => {
    return parts
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/'); // Remove multiple slashes
  },
  
  relative: (from: string, to: string): string => {
    const fromParts = from.split('/').filter(Boolean);
    const toParts = to.split('/').filter(Boolean);
    
    // Find common base
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);
    
    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] === toParts[i]) {
        commonLength++;
      } else {
        break;
      }
    }
    
    // Build relative path
    const upDirs = Array(fromParts.length - commonLength).fill('..');
    const downDirs = toParts.slice(commonLength);
    
    return [...upDirs, ...downDirs].join('/') || '.';
  },
  
  resolve: (...parts: string[]): string => {
    return pathUtils.join(...parts);
  },
  
  isAbsolute: (filePath: string): boolean => {
    return filePath.startsWith('/');
  }
};

// Interfaces for .aicontext files
export interface AiContextFrontmatter {
  version: string;
  extends?: string[];
  applies_to?: string[];
  ignore?: string[];
  metadata?: Record<string, any>;
}

export interface AiContextFile {
  filePath: string;
  frontmatter?: AiContextFrontmatter;
  content: string;
  parsedAt: number; // timestamp for caching
}

export interface ResolvedContext {
  rules: string;
  sources: string[]; // file paths that contributed to this context
}

export interface ContextCacheEntry {
  context: ResolvedContext;
  timestamp: number;
  fileTimestamps: Record<string, number>; // track when each source file was modified
}

export class ContextRulesService {
  private static instance: ContextRulesService;
  private contextCache = new Map<string, ContextCacheEntry>();
  private parsedContextFiles = new Map<string, AiContextFile>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  static getInstance(): ContextRulesService {
    if (!ContextRulesService.instance) {
      ContextRulesService.instance = new ContextRulesService();
    }
    return ContextRulesService.instance;
  }

  /**
   * Get context rules for a specific file path
   * Returns null if no applicable context is found
   */
  async getContextForFile(filePath: string, projectRoot: string): Promise<ResolvedContext | null> {
    try {
      console.log(`[ContextRulesService] Getting context for file: ${filePath}`);
      console.log(`[ContextRulesService] Project root: ${projectRoot}`);
      
      const cacheKey = this.getCacheKey(filePath, projectRoot);
      
      // Check cache first
      const cached = this.getCachedContext(cacheKey);
      if (cached) {
        console.log(`[ContextRulesService] Using cached context for ${filePath}`);
        return cached;
      }

      // Resolve context hierarchy
      const context = await this.resolveContextHierarchy(filePath, projectRoot);
      
      if (!context || !context.rules.trim()) {
        console.log(`[ContextRulesService] No context rules found for ${filePath}, checking for default fallback`);
        
        // Try to provide a fallback context for common file types
        const fallbackContext = this.getDefaultContextForFile(filePath);
        if (fallbackContext) {
          console.log(`[ContextRulesService] Using default fallback context for ${filePath}`);
          return fallbackContext;
        }
        
        return null;
      }

      console.log(`[ContextRulesService] Found context rules for ${filePath}:`, {
        sources: context.sources,
        rulesLength: context.rules.length
      });

      // Cache the result
      this.cacheContext(cacheKey, context);
      
      return context;
    } catch (error) {
      console.warn(`[ContextRulesService] Error getting context for ${filePath}:`, error);
      
      // Try fallback context even if there's an error
      const fallbackContext = this.getDefaultContextForFile(filePath);
      if (fallbackContext) {
        console.log(`[ContextRulesService] Using default fallback context due to error for ${filePath}`);
        return fallbackContext;
      }
      
      return null;
    }
  }

  /**
   * Get default context rules for common file types when no project-specific rules exist
   */
  private getDefaultContextForFile(filePath: string): ResolvedContext | null {
    const fileName = pathUtils.basename(filePath);
    const isTypeScript = fileName.endsWith('.ts') || fileName.endsWith('.tsx');
    const isJavaScript = fileName.endsWith('.js') || fileName.endsWith('.jsx');
    
    if (isTypeScript || isJavaScript) {
      return {
        rules: `## Default AI Code Generation Rules

**IMPORTANT: When creating or modifying TypeScript/JavaScript files, always add the comment \`// Edited by AI\` at the very top of the file.**

This helps track which files have been modified by AI assistance.

## Basic Standards
- Use modern ${isTypeScript ? 'TypeScript' : 'JavaScript'} features
- Follow consistent naming conventions
- Add proper ${isTypeScript ? 'type annotations' : 'JSDoc comments'} where appropriate
- Handle errors gracefully`,
        sources: ['default-fallback']
      };
    }
    
    return null;
  }

  /**
   * Get context rules for multiple files efficiently
   * Returns a map of filePath -> context, only including files that have applicable context
   */
  async getContextForFiles(filePaths: string[], projectRoot: string): Promise<Map<string, ResolvedContext>> {
    const contextMap = new Map<string, ResolvedContext>();
    
    for (const filePath of filePaths) {
      const context = await this.getContextForFile(filePath, projectRoot);
      if (context) {
        contextMap.set(filePath, context);
      }
    }
    
    return contextMap;
  }

  /**
   * Get unique context rules from a set of files (token efficient)
   * Returns consolidated context rules with source attribution
   */
  async getConsolidatedContext(filePaths: string[], projectRoot: string): Promise<ResolvedContext | null> {
    const contextMap = await this.getContextForFiles(filePaths, projectRoot);
    
    if (contextMap.size === 0) {
      return null;
    }

    // Group contexts by their content to avoid duplication
    const uniqueContexts = new Map<string, string[]>(); // rules -> sources
    const allSources = new Set<string>();

    for (const [filePath, context] of contextMap) {
      const rulesHash = this.hashString(context.rules);
      if (!uniqueContexts.has(rulesHash)) {
        uniqueContexts.set(rulesHash, []);
      }
      uniqueContexts.get(rulesHash)!.push(filePath);
      context.sources.forEach(source => allSources.add(source));
    }

    // If all files have the same context, return it once
    if (uniqueContexts.size === 1) {
      const [rules] = contextMap.values();
      return {
        rules: rules.rules,
        sources: Array.from(allSources)
      };
    }

    // Otherwise, consolidate different contexts
    let consolidatedRules = '';
    for (const [rulesHash, affectedFiles] of uniqueContexts) {
      const context = [...contextMap.values()].find(c => this.hashString(c.rules) === rulesHash);
      if (context) {
        consolidatedRules += `## Context for: ${affectedFiles.join(', ')}\n\n`;
        consolidatedRules += context.rules + '\n\n';
      }
    }

    return {
      rules: consolidatedRules.trim(),
      sources: Array.from(allSources)
    };
  }

  /**
   * Invalidate cache for a specific file or directory
   */
  invalidateCache(filePath?: string): void {
    if (filePath) {
      // Invalidate all cache entries that might be affected by this file change
      const keysToDelete: string[] = [];
      for (const key of this.contextCache.keys()) {
        if (key.includes(filePath) || filePath.includes(key.split(':')[1])) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.contextCache.delete(key));
      
      // Also remove parsed context file
      this.parsedContextFiles.delete(filePath);
    } else {
      // Clear all caches
      this.contextCache.clear();
      this.parsedContextFiles.clear();
    }
  }

  private async resolveContextHierarchy(filePath: string, projectRoot: string): Promise<ResolvedContext | null> {
    const applicableContexts: AiContextFile[] = [];
    const sources = new Set<string>();

    console.log(`[ContextRulesService] Resolving context hierarchy for ${filePath} in project ${projectRoot}`);

    try {
      // 1. Find file-specific contexts (same directory)
      const fileDir = pathUtils.dirname(filePath);
      console.log(`[ContextRulesService] Checking file directory: ${fileDir}`);
      
      const fileSpecificContext = await this.findContextFile(fileDir);
      if (fileSpecificContext) {
        console.log(`[ContextRulesService] Found file-specific context: ${fileSpecificContext.filePath}`);
        if (this.isContextApplicable(fileSpecificContext, filePath)) {
          applicableContexts.push(fileSpecificContext);
          sources.add(fileSpecificContext.filePath);
        }
      }

      // 2. Walk up directory tree for directory contexts
      let currentDir = fileDir;
      console.log(`[ContextRulesService] Walking up directory tree from: ${currentDir}`);
      
      while (currentDir !== projectRoot && currentDir !== pathUtils.dirname(currentDir)) {
        currentDir = pathUtils.dirname(currentDir);
        console.log(`[ContextRulesService] Checking directory: ${currentDir}`);
        
        const dirContext = await this.findContextFile(currentDir);
        if (dirContext) {
          console.log(`[ContextRulesService] Found directory context: ${dirContext.filePath}`);
          if (this.isContextApplicable(dirContext, filePath)) {
            applicableContexts.push(dirContext);
            sources.add(dirContext.filePath);
          }
        }
      }

      // 3. Check project root
      if (currentDir === projectRoot || currentDir === pathUtils.dirname(currentDir)) {
        console.log(`[ContextRulesService] Checking project root: ${projectRoot}`);
        const rootContext = await this.findContextFile(projectRoot);
        if (rootContext) {
          console.log(`[ContextRulesService] Found root context: ${rootContext.filePath}`);
          if (this.isContextApplicable(rootContext, filePath)) {
            applicableContexts.push(rootContext);
            sources.add(rootContext.filePath);
          }
        }
      }

      // 4. Process extended contexts for each found context
      for (const context of [...applicableContexts]) {
        if (context.frontmatter?.extends) {
          console.log(`[ContextRulesService] Processing extended contexts for: ${context.filePath}`);
          const extendedContexts = await this.resolveExtendedContexts(
            context.frontmatter.extends, 
            pathUtils.dirname(context.filePath),
            filePath
          );
          applicableContexts.push(...extendedContexts);
          extendedContexts.forEach(ext => sources.add(ext.filePath));
        }
      }

      console.log(`[ContextRulesService] Found ${applicableContexts.length} applicable contexts:`, Array.from(sources));

      if (applicableContexts.length === 0) {
        console.log(`[ContextRulesService] No applicable contexts found for ${filePath}`);
        return null;
      }

      // 5. Merge contexts (most specific first, then extended)
      const mergedContent = this.mergeContexts(applicableContexts);
      
      return {
        rules: mergedContent,
        sources: Array.from(sources)
      };

    } catch (error) {
      console.warn(`[ContextRulesService] Error resolving context hierarchy for ${filePath}:`, error);
      return null;
    }
  }

  private async findContextFile(directory: string): Promise<AiContextFile | null> {
    const contextPath = pathUtils.join(directory, '.aicontext');
    console.log(`[ContextRulesService] Looking for context file: ${contextPath}`);
    
    // Check if we've already parsed this file
    const cached = this.parsedContextFiles.get(contextPath);
    if (cached) {
      console.log(`[ContextRulesService] Using cached context file: ${contextPath}`);
      return cached;
    }

    try {
      // Use the project API to read the file
      console.log(`[ContextRulesService] Attempting to read context file: ${contextPath}`);
      const fileResult = await window.projectApi.openFile(contextPath);
      console.log(`[ContextRulesService] Successfully read context file: ${contextPath}`);
      
      const contextFile = this.parseContextFile(contextPath, fileResult.content);
      
      // Cache the parsed file
      this.parsedContextFiles.set(contextPath, contextFile);
      
      return contextFile;
    } catch (error) {
      // File doesn't exist or can't be read - this is normal
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`[ContextRulesService] Context file not found: ${contextPath}`, errorMessage);
      return null;
    }
  }

  private parseContextFile(filePath: string, content: string): AiContextFile {
    let frontmatter: AiContextFrontmatter | undefined;
    let markdownContent = content;

    // Check for YAML frontmatter
    if (content.startsWith('---\n')) {
      const endOfFrontmatter = content.indexOf('\n---\n', 4);
      if (endOfFrontmatter !== -1) {
        const frontmatterContent = content.slice(4, endOfFrontmatter);
        markdownContent = content.slice(endOfFrontmatter + 5);
        
        try {
          frontmatter = yaml.load(frontmatterContent) as AiContextFrontmatter;
        } catch (error) {
          console.warn(`[ContextRulesService] Invalid YAML frontmatter in ${filePath}:`, error);
        }
      }
    }

    return {
      filePath,
      frontmatter,
      content: markdownContent.trim(),
      parsedAt: Date.now()
    };
  }

  private isContextApplicable(context: AiContextFile, filePath: string): boolean {
    // If no applies_to is specified, context applies to all files
    if (!context.frontmatter?.applies_to) {
      return true;
    }

    const fileName = pathUtils.basename(filePath);
    const relativePath = pathUtils.relative(pathUtils.dirname(context.filePath), filePath);

    // Check if file matches any of the patterns
    return context.frontmatter.applies_to.some(pattern => {
      return minimatch(fileName, pattern) || minimatch(relativePath, pattern);
    });
  }

  private async resolveExtendedContexts(
    extendsPaths: string[],
    baseDir: string,
    targetFilePath: string
  ): Promise<AiContextFile[]> {
    const extendedContexts: AiContextFile[] = [];

    for (const extendPath of extendsPaths) {
      try {
        const resolvedPath = pathUtils.isAbsolute(extendPath)
          ? extendPath
          : pathUtils.resolve(baseDir, extendPath);
        
        const extendedContext = await this.findContextFile(pathUtils.dirname(resolvedPath));
        if (extendedContext && this.isContextApplicable(extendedContext, targetFilePath)) {
          extendedContexts.push(extendedContext);
          
          // Recursively resolve extends
          if (extendedContext.frontmatter?.extends) {
            const nestedExtended = await this.resolveExtendedContexts(
              extendedContext.frontmatter.extends,
              pathUtils.dirname(extendedContext.filePath),
              targetFilePath
            );
            extendedContexts.push(...nestedExtended);
          }
        }
      } catch (error) {
        console.warn(`[ContextRulesService] Error resolving extended context ${extendPath}:`, error);
      }
    }

    return extendedContexts;
  }

  private mergeContexts(contexts: AiContextFile[]): string {
    if (contexts.length === 0) {
      return '';
    }

    if (contexts.length === 1) {
      return contexts[0].content;
    }

    // Merge multiple contexts
    // Extended contexts come first (least specific), then local contexts (most specific)
    const merged = contexts.map(context => {
      const source = pathUtils.basename(context.filePath);
      return `# Context from ${source}\n\n${context.content}`;
    }).join('\n\n---\n\n');

    return merged;
  }

  private getCacheKey(filePath: string, projectRoot: string): string {
    return `${projectRoot}:${filePath}`;
  }

  private getCachedContext(cacheKey: string): ResolvedContext | null {
    const cached = this.contextCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.contextCache.delete(cacheKey);
      return null;
    }

    return cached.context;
  }

  private cacheContext(cacheKey: string, context: ResolvedContext): void {
    const fileTimestamps: Record<string, number> = {};
    
    // In a real implementation, you'd want to track file modification times
    // For now, we'll use the current timestamp
    context.sources.forEach(source => {
      fileTimestamps[source] = Date.now();
    });

    this.contextCache.set(cacheKey, {
      context,
      timestamp: Date.now(),
      fileTimestamps
    });
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

export const contextRulesService = ContextRulesService.getInstance();
