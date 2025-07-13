/**
 * Tool execution functions that run in the frontend
 * These have access to the most up-to-date file state
 */
export const frontendToolExecutors = {
  async readFile(args: { filePath: string }): Promise<string> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }
      const result = await window.projectApi.openFile(filePath);
      return result.content;
    } catch (error) {
      console.error('[readFile tool] Error:', error);
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async writeFile(args: { filePath: string; content: string }): Promise<string> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }
      await window.projectApi.saveFile(filePath, args.content);
      return `Successfully wrote to ${filePath}`;
    } catch (error) {
      console.error('[writeFile tool] Error:', error);
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async listDirectory(args: { dirPath: string }): Promise<string> {
    try {
      let dirPath = args.dirPath;
      if (!dirPath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          dirPath = `${currentProject}/${dirPath}`;
        }
      }
      const result = await window.projectApi.getDirectoryTree(dirPath);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      console.error('[listDirectory tool] Error:', error);
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async createDirectory(args: { dirPath: string }): Promise<string> {
    try {
      let dirPath = args.dirPath;
      if (!dirPath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          dirPath = `${currentProject}/${dirPath}`;
        }
      }
      await window.projectApi.createFolder(dirPath);
      return `Successfully created directory ${dirPath}`;
    } catch (error) {
      console.error('[createDirectory tool] Error:', error);
      throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async deleteFile(args: { filePath: string }): Promise<string> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }
      await window.projectApi.deleteFile(filePath);
      return `Successfully deleted ${filePath}`;
    } catch (error) {
      console.error('[deleteFile tool] Error:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async searchFiles(args: { query: string; directory?: string }): Promise<string> {
    try {
      let searchDir = args.directory;
      if (searchDir && !searchDir.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          searchDir = `${currentProject}/${searchDir}`;
        }
      }
      const result = await window.projectApi.searchFiles(args.query, searchDir);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      console.error('[searchFiles tool] Error:', error);
      throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getProjectInfo(args: { includeStats?: boolean }): Promise<string> {
    try {
      const currentProject = await window.projectApi.getCurrentProject();
      if (!currentProject) {
        return 'No project is currently open';
      }

      const projectInfo: any = {
        name: currentProject.split('/').pop() || 'Unknown',
        path: currentProject,
        isOpen: true,
      };

      if (args.includeStats) {
        try {
          const stats = await window.projectApi.getFileStats(currentProject);
          projectInfo.stats = stats;
        } catch (error) {
          projectInfo.stats = 'Unable to retrieve project statistics';
        }
      }

      return JSON.stringify(projectInfo, null, 2);
    } catch (error) {
      console.error('[getProjectInfo tool] Error:', error);
      throw new Error(`Failed to get project info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
} as const;

export type FrontendToolExecutors = typeof frontendToolExecutors;
