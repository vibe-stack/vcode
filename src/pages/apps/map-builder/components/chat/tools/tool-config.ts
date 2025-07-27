import { ToolName } from './index';

export interface ToolConfig {
  name: ToolName;
  displayName: string;
  description: string;
  category: 'file' | 'directory' | 'search' | 'project';
  requiresConfirmation: boolean;
  dangerLevel: 'safe' | 'caution' | 'dangerous';
  enabled: boolean;
}

export const toolConfigs: Record<ToolName, ToolConfig> = {
  readFile: {
    name: 'readFile',
    displayName: 'Read File',
    description: 'Read the contents of a file',
    category: 'file',
    requiresConfirmation: false,
    dangerLevel: 'safe',
    enabled: true,
  },
  writeFile: {
    name: 'writeFile',
    displayName: 'Write File',
    description: 'Write or modify a file',
    category: 'file',
    requiresConfirmation: false,
    dangerLevel: 'caution',
    enabled: true,
  },
  listDirectory: {
    name: 'listDirectory',
    displayName: 'List Directory',
    description: 'List contents of a directory',
    category: 'directory',
    requiresConfirmation: false,
    dangerLevel: 'safe',
    enabled: true,
  },
  createDirectory: {
    name: 'createDirectory',
    displayName: 'Create Directory',
    description: 'Create a new directory',
    category: 'directory',
    requiresConfirmation: false,
    dangerLevel: 'caution',
    enabled: true,
  },
  deleteFile: {
    name: 'deleteFile',
    displayName: 'Delete File',
    description: 'Delete a file from the filesystem',
    category: 'file',
    requiresConfirmation: true,
    dangerLevel: 'dangerous',
    enabled: true,
  },
  searchFiles: {
    name: 'searchFiles',
    displayName: 'Search Files',
    description: 'Search for files by name or content',
    category: 'search',
    requiresConfirmation: false,
    dangerLevel: 'safe',
    enabled: true,
  },
  searchCodebase: {
    name: 'searchCodebase',
    displayName: 'Search Codebase',
    description: 'Search the codebase using natural language queries',
    category: 'search',
    requiresConfirmation: false,
    dangerLevel: 'safe',
    enabled: true,
  },
  getProjectInfo: {
    name: 'getProjectInfo',
    displayName: 'Get Project Info',
    description: 'Get information about the current project',
    category: 'project',
    requiresConfirmation: false,
    dangerLevel: 'safe',
    enabled: true,
  },
  runTerminalCommand: {
    name: 'runTerminalCommand',
    displayName: 'Run Terminal Command',
    description: 'Execute a command in a terminal',
    category: 'project',
    requiresConfirmation: false,
    dangerLevel: 'caution',
    enabled: true,
  },
};

export function getToolConfig(toolName: ToolName): ToolConfig | undefined {
  return toolConfigs[toolName];
}

export function getEnabledTools(): ToolName[] {
  return Object.values(toolConfigs)
    .filter(config => config.enabled)
    .map(config => config.name);
}

export function getToolsByCategory(category: ToolConfig['category']): ToolConfig[] {
  return Object.values(toolConfigs).filter(config => config.category === category);
}

export function getToolsRequiringConfirmation(): ToolName[] {
  return Object.values(toolConfigs)
    .filter(config => config.requiresConfirmation && config.enabled)
    .map(config => config.name);
}
