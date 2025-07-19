// TypeScript Project Service - Type Definitions

export interface TSConfigCompilerOptions {
  target?: string;
  lib?: string[];
  module?: string;
  moduleResolution?: string;
  strict?: boolean;
  esModuleInterop?: boolean;
  allowSyntheticDefaultImports?: boolean;
  skipLibCheck?: boolean;
  allowJs?: boolean;
  jsx?: string;
  declaration?: boolean;
  outDir?: string;
  rootDir?: string;
  baseUrl?: string;
  paths?: Record<string, string[]>;
  typeRoots?: string[];
  types?: string[];
  [key: string]: any;
}

export interface TSConfig {
  compilerOptions?: TSConfigCompilerOptions;
  include?: string[];
  exclude?: string[];
  extends?: string;
}

export interface ProjectFileInfo {
  path: string;
  content: string;
  version: number;
}

export interface PackageJsonDependencies {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface PackageJson extends PackageJsonDependencies {
  name?: string;
  version?: string;
  main?: string;
  types?: string;
  typings?: string;
  exports?: {
    types?: string;
    '.'?: {
      types?: string;
      default?: string;
    };
  };
  [key: string]: any;
}
