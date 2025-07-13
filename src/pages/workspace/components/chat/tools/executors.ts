import { ToolName } from './index';

/**
 * Tool execution functions that run in the frontend
 * These have access to the most up-to-date file state
 */
export const frontendToolExecutors = {
  async readFile(args: { filePath: string }): Promise<string> {
    try {
      // Check if file is in open buffers first (frontend has most recent state)
      // For now, we'll just read from the filesystem directly
      // If the path is relative, resolve it relative to the current project
      let filePath = args.filePath;
      if (!filePath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }
      // Read from filesystem via IPC
      const result = await window.projectApi.openFile(filePath);
      return result.content;
    } catch (error) {
      console.error('[readFile tool] Error:', error);
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
} as const;

export type FrontendToolExecutors = typeof frontendToolExecutors;
