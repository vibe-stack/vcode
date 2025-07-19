// Monaco Editor Configuration

import * as monaco from 'monaco-editor';
import { projectApi } from '@/services/project-api';
import type { TSConfig } from './types';

export class MonacoConfig {
  /**
   * Apply tsconfig.json settings to Monaco Editor
   */
  static async applyTSConfigToMonaco(tsConfig: TSConfig | null, projectPath: string): Promise<void> {
    if (!tsConfig?.compilerOptions) {
      return;
    }

    const options = tsConfig.compilerOptions;
    const monacoOptions: monaco.languages.typescript.CompilerOptions = {};

    // Map common TypeScript compiler options to Monaco
    if (options.target) {
      const targetMap: Record<string, monaco.languages.typescript.ScriptTarget> = {
        'ES3': monaco.languages.typescript.ScriptTarget.ES3,
        'ES5': monaco.languages.typescript.ScriptTarget.ES5,
        'ES2015': monaco.languages.typescript.ScriptTarget.ES2015,
        'ES2016': monaco.languages.typescript.ScriptTarget.ES2016,
        'ES2017': monaco.languages.typescript.ScriptTarget.ES2017,
        'ES2018': monaco.languages.typescript.ScriptTarget.ES2018,
        'ES2019': monaco.languages.typescript.ScriptTarget.ES2019,
        'ES2020': monaco.languages.typescript.ScriptTarget.ES2020,
        'ESNext': monaco.languages.typescript.ScriptTarget.Latest,
      };
      monacoOptions.target = targetMap[options.target] || monaco.languages.typescript.ScriptTarget.Latest;
    }

    if (options.module) {
      const moduleMap: Record<string, monaco.languages.typescript.ModuleKind> = {
        'None': monaco.languages.typescript.ModuleKind.None,
        'CommonJS': monaco.languages.typescript.ModuleKind.CommonJS,
        'AMD': monaco.languages.typescript.ModuleKind.AMD,
        'UMD': monaco.languages.typescript.ModuleKind.UMD,
        'System': monaco.languages.typescript.ModuleKind.System,
        'ES6': monaco.languages.typescript.ModuleKind.ES2015,
        'ES2015': monaco.languages.typescript.ModuleKind.ES2015,
        'ESNext': monaco.languages.typescript.ModuleKind.ESNext,
      };
      monacoOptions.module = moduleMap[options.module] || monaco.languages.typescript.ModuleKind.ESNext;
    }

    if (options.moduleResolution) {
      const moduleResolutionMap: Record<string, monaco.languages.typescript.ModuleResolutionKind> = {
        'Classic': monaco.languages.typescript.ModuleResolutionKind.Classic,
        'Node': monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        'bundler': monaco.languages.typescript.ModuleResolutionKind.NodeJs, // Treat bundler as Node for Monaco
      };
      monacoOptions.moduleResolution = moduleResolutionMap[options.moduleResolution] || monaco.languages.typescript.ModuleResolutionKind.NodeJs;
    }

    if (options.jsx) {
      const jsxMap: Record<string, monaco.languages.typescript.JsxEmit> = {
        'preserve': monaco.languages.typescript.JsxEmit.Preserve,
        'react': monaco.languages.typescript.JsxEmit.React,
        'react-jsx': monaco.languages.typescript.JsxEmit.ReactJSX,
        'react-jsxdev': monaco.languages.typescript.JsxEmit.ReactJSXDev,
        'react-native': monaco.languages.typescript.JsxEmit.ReactNative,
      };
      monacoOptions.jsx = jsxMap[options.jsx] || monaco.languages.typescript.JsxEmit.React;
    }

    // Set other boolean options
    if (options.strict !== undefined) monacoOptions.strict = options.strict;
    if (options.esModuleInterop !== undefined) monacoOptions.esModuleInterop = options.esModuleInterop;
    if (options.allowSyntheticDefaultImports !== undefined) monacoOptions.allowSyntheticDefaultImports = options.allowSyntheticDefaultImports;
    if (options.skipLibCheck !== undefined) monacoOptions.skipLibCheck = options.skipLibCheck;
    if (options.allowJs !== undefined) monacoOptions.allowJs = options.allowJs;

    // Always set these for better Monaco experience
    monacoOptions.allowNonTsExtensions = true;
    monacoOptions.noEmit = true;

    // Set lib files if specified
    if (options.lib) {
      monacoOptions.lib = options.lib.map(lib => {
        // Monaco expects lib files without the "lib." prefix and ".d.ts" suffix
        return lib.replace(/^lib\./, '').replace(/\.d\.ts$/, '');
      });
    }

    // Properly configure baseUrl and paths for module resolution
    if (options.baseUrl) {
      monacoOptions.baseUrl = `${projectPath}${options.baseUrl.replace(/^\./, '')}`;
    }

    if (options.paths) {
      monacoOptions.paths = {};
      for (const [key, value] of Object.entries(options.paths)) {
        monacoOptions.paths[key] = value.map(p => `${projectPath}${p.replace(/^\./, '')}`);
      }
    }

    // Apply to both TypeScript and JavaScript defaults
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(monacoOptions);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(monacoOptions);
  }

  /**
   * Clear Monaco's extra libraries (type definitions)
   */
  static clearMonacoExtraLibs(): void {
    try {
      // Monaco doesn't provide a direct way to clear all extra libs,
      // so we need to reset the typescript defaults
      monaco.languages.typescript.typescriptDefaults.setExtraLibs([]);
      monaco.languages.typescript.javascriptDefaults.setExtraLibs([]);
    } catch (error) {
      console.warn('Error clearing Monaco extra libraries:', error);
    }
  }

  /**
   * Load TypeScript lib files that match the project's target configuration
   */
  static async loadTypeScriptLibFiles(projectPath: string, tsConfig: TSConfig | null): Promise<void> {
    try {
      const compilerOptions = tsConfig?.compilerOptions;
      const libsToLoad = compilerOptions?.lib || ['DOM', 'ES2022'];

      console.log('Loading TypeScript lib files:', libsToLoad);

      // Map lib names to their actual files in node_modules/typescript/lib
      const typescriptLibPath = `${projectPath}/node_modules/typescript/lib`;
      
      for (const lib of libsToLoad) {
        try {
          const libFileName = `lib.${lib.toLowerCase()}.d.ts`;
          const libFilePath = `${typescriptLibPath}/${libFileName}`;
          
          const result = await projectApi.openFile(libFilePath);
          if (!result || !result.content) {
            continue;
          }
          const { content } = result;
          
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            content,
            `file:///node_modules/typescript/lib/${libFileName}`
          );
          
        } catch (error) {
          console.warn(`Could not load TypeScript lib ${lib}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading TypeScript lib files:', error);
    }
  }

  /**
   * Setup Monaco's module resolution to better handle imports
   */
  static setupMonacoModuleResolution(projectPath: string, tsConfig: TSConfig | null): void {
    try {
      // Create a custom module resolution host for Monaco
      const compilerOptions = {
        ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        baseUrl: projectPath,
        paths: tsConfig?.compilerOptions?.paths || {}
      };

      // Apply enhanced compiler options
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);

    } catch (error) {
      console.error('[MonacoConfig] Error setting up module resolution:', error);
    }
  }
}
