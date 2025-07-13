import { ToolName } from './index';

/**
 * Tool execution functions that run in the frontend
 * These have access to the most up-to-date file state
 */
export const frontendToolExecutors = {
  async readFile(args: { filePath: string }): Promise<string> {
    try {
      // TODO: Check if file is in open buffers first (frontend has most recent state)
      // For now, we'll just read from the filesystem directly
      
      // Read from filesystem via IPC
      const result = await window.projectApi.openFile(args.filePath);
      return result.content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
} as const;

export type FrontendToolExecutors = typeof frontendToolExecutors;
