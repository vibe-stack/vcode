// TSConfig Loading and Parsing

import { projectApi } from '@/services/project-api';
import type { TSConfig } from './types';

export class TSConfigLoader {
  /**
   * Load and parse tsconfig.json from project, including extended configs.
   */
  static async loadTSConfig(projectPath: string): Promise<TSConfig | null> {
    const loadedConfigs = new Set<string>();

    const loadAndMerge = async (configPath: string): Promise<TSConfig | null> => {
      if (loadedConfigs.has(configPath)) {
        console.warn(`[TSConfigLoader] Circular dependency detected in tsconfig chain: ${configPath}`);
        return {};
      }
      loadedConfigs.add(configPath);

      try {
        const result = await projectApi.openFile(configPath);
        if (!result || !result.content) {
          throw new Error(`Failed to read tsconfig from ${configPath}`);
        }
        const { content } = result;
        const cleanedContent = TSConfigLoader.removeJSONComments(content);

        
        try {
          const tsConfig = JSON.parse(cleanedContent) as TSConfig;
          
          if (tsConfig.extends) {
            const extendedConfigPath = `${projectPath}/${tsConfig.extends}`;
            const baseConfig = await loadAndMerge(extendedConfigPath);
            
            // Deep merge configs
            return TSConfigLoader.mergeConfigs(baseConfig || {}, tsConfig);
          }
          
          return tsConfig;
          
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            console.error(`[TSConfigLoader] JSON parsing error in ${configPath}:`, parseError.message);
            if (process.env.NODE_ENV === 'development') {
              console.error('[TSConfigLoader] Cleaned content that failed to parse:');
              console.error(cleanedContent);
            }
          }
          throw parseError;
        }

      } catch (error) {
        return null;
      }
    };

    const possiblePaths = [
      `${projectPath}/tsconfig.json`,
      `${projectPath}/tsconfig.app.json`,
      `${projectPath}/jsconfig.json`
    ];

    for (const path of possiblePaths) {
      const tsConfig = await loadAndMerge(path);
      if (tsConfig) {
        return tsConfig;
      }
    }

    return null;
  }

  /**
   * Deeply merge two TSConfig objects.
   */
  private static mergeConfigs(base: TSConfig, extended: TSConfig): TSConfig {
    const merged: TSConfig = { ...base };

    // Merge compilerOptions
    if (extended.compilerOptions) {
      merged.compilerOptions = { ...base.compilerOptions, ...extended.compilerOptions };
      // Special handling for paths to ensure they are merged correctly
      if (base.compilerOptions?.paths && extended.compilerOptions.paths) {
        merged.compilerOptions.paths = { ...base.compilerOptions.paths, ...extended.compilerOptions.paths };
      }
    }

    // Override or merge other top-level properties
    if (extended.include) merged.include = extended.include;
    if (extended.exclude) merged.exclude = extended.exclude;
    if (extended.files) merged.files = extended.files;

    return merged;
  }

  /**
   * Remove comments from JSON (JSONC format support)
   */
  private static removeJSONComments(content: string): string {
    let result = '';
    let i = 0;
    let inString = false;
    let inSingleLineComment = false;
    let inMultiLineComment = false;
    let stringDelimiter = '';

    while (i < content.length) {
      const char = content[i];
      const nextChar = content[i + 1];

      // Handle string detection
      if (!inSingleLineComment && !inMultiLineComment) {
        if ((char === '"' || char === "'") && (i === 0 || content[i - 1] !== '\\')) {
          if (!inString) {
            inString = true;
            stringDelimiter = char;
          } else if (char === stringDelimiter) {
            inString = false;
            stringDelimiter = '';
          }
        }
      }

      // Handle comments only if we're not inside a string
      if (!inString) {
        // Start of single-line comment
        if (char === '/' && nextChar === '/' && !inMultiLineComment) {
          inSingleLineComment = true;
          i += 2;
          continue;
        }

        // Start of multi-line comment
        if (char === '/' && nextChar === '*' && !inSingleLineComment) {
          inMultiLineComment = true;
          i += 2;
          continue;
        }

        // End of multi-line comment
        if (char === '*' && nextChar === '/' && inMultiLineComment) {
          inMultiLineComment = false;
          i += 2;
          continue;
        }

        // End of single-line comment
        if (inSingleLineComment && (char === '\n' || char === '\r')) {
          inSingleLineComment = false;
        }
      }

      // Add character to result if not in a comment
      if (!inSingleLineComment && !inMultiLineComment) {
        result += char;
      }

      i++;
    }

    return result;
  }

  /**
   * Parse package.json file
   */
  static async parsePackageJson(packageJsonPath: string): Promise<any | null> {
    try {
      const result = await projectApi.openFile(packageJsonPath);
      if (!result || !result.content) {
        return null;
      }
      const { content } = result;
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
}
