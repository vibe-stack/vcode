export interface ToolExecutionResult {
  message: string;
  metadata?: {
    fileChanges?: {
      filePath: string;
      operation: "create" | "update" | "delete";
      prevState: string;
      nextState: string;
    }[];
  };
}

/**
 * Tool execution functions that run in the frontend
 * These have access to the most up-to-date file state
 */
export const frontendToolExecutors = {
  async readFile(args: { filePath: string }): Promise<ToolExecutionResult> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith("/")) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }
      const result = await window.projectApi.openFile(filePath);
      return {
        message: result.content,
      };
    } catch (error) {
      console.error("[readFile tool] Error:", error);
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  async writeFile(args: {
    filePath: string;
    content: string;
  }): Promise<ToolExecutionResult> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith("/")) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }

      // Process the content to handle escaped characters (like \n)
      const processedContent = args.content
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\");

      // Get previous content for snapshot
      let prevState = "";
      let operation: "create" | "update" = "create";

      try {
        const existingFile = await window.projectApi.openFile(filePath);
        prevState = existingFile.content;
        operation = "update";
      } catch (error) {
        // File doesn't exist, create it
        await window.projectApi.createFile(filePath, "");
        operation = "create";
      }

      // Import the stores dynamically to avoid circular imports
      const { useEditorSplitStore } = await import("@/stores/editor-splits");
      const { useBufferStore } = await import("@/stores/buffers");

      // Open the file in a buffer (this will create or reuse existing buffer)
      const editorStore = useEditorSplitStore.getState();
      await editorStore.openFile(filePath);

      // Get the buffer for this file
      const bufferStore = useBufferStore.getState();
      const buffer = bufferStore.getBufferByPath(filePath);

      if (!buffer) {
        throw new Error(`Failed to create buffer for ${filePath}`);
      }

      // Update the buffer content
      bufferStore.updateBufferContent(buffer.id, processedContent);

      // Save the buffer
      const saveSuccess = await bufferStore.saveBuffer(buffer.id);

      if (!saveSuccess) {
        throw new Error(`Failed to save buffer for ${filePath}`);
      }

      return {
        message: `Successfully wrote to ${filePath}`,
        metadata: {
          fileChanges: [
            {
              filePath,
              operation,
              prevState,
              nextState: processedContent,
            },
          ],
        },
      };
    } catch (error) {
      console.error("[writeFile tool] Error:", error);
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  async listDirectory(args: { dirPath: string }): Promise<ToolExecutionResult> {
    try {
      let dirPath = args.dirPath;
      if (!dirPath.startsWith("/")) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          dirPath = `${currentProject}/${dirPath}`;
        }
      }
      const result = await window.projectApi.getDirectoryTree(dirPath);
      return {
        message: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      console.error("[listDirectory tool] Error:", error);
      throw new Error(
        `Failed to list directory: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  async createDirectory(args: {
    dirPath: string;
  }): Promise<ToolExecutionResult> {
    try {
      let dirPath = args.dirPath;
      if (!dirPath.startsWith("/")) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          dirPath = `${currentProject}/${dirPath}`;
        }
      }
      await window.projectApi.createFolder(dirPath);
      return {
        message: `Successfully created directory ${dirPath}`,
      };
    } catch (error) {
      console.error("[createDirectory tool] Error:", error);
      throw new Error(
        `Failed to create directory: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  async deleteFile(args: { filePath: string }): Promise<ToolExecutionResult> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith("/")) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }

      // Get file content for snapshot
      let prevState = "";
      try {
        const existingFile = await window.projectApi.openFile(filePath);
        prevState = existingFile.content;
      } catch (error) {
        // File doesn't exist, nothing to delete
        return {
          message: `File ${filePath} does not exist`,
        };
      }

      await window.projectApi.deleteFile(filePath);

      return {
        message: `Successfully deleted ${filePath}`,
        metadata: {
          fileChanges: [
            {
              filePath,
              operation: "delete",
              prevState,
              nextState: "",
            },
          ],
        },
      };
    } catch (error) {
      console.error("[deleteFile tool] Error:", error);
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  async searchFiles(args: {
    query: string;
    directory?: string;
  }): Promise<ToolExecutionResult> {
    try {
      let searchDir = args.directory;
      if (searchDir && !searchDir.startsWith("/")) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          searchDir = `${currentProject}/${searchDir}`;
        }
      }
      const result = await window.projectApi.searchFiles(args.query, searchDir);
      return {
        message: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      console.error("[searchFiles tool] Error:", error);
      throw new Error(
        `Failed to search files: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  async getProjectInfo(args: {
    includeStats?: boolean;
  }): Promise<ToolExecutionResult> {
    try {
      const currentProject = await window.projectApi.getCurrentProject();
      if (!currentProject) {
        return {
          message: "No project is currently open",
        };
      }

      const projectInfo: any = {
        name: currentProject.split("/").pop() || "Unknown",
        path: currentProject,
        isOpen: true,
      };

      if (args.includeStats) {
        try {
          const stats = await window.projectApi.getFileStats(currentProject);
          projectInfo.stats = stats;
        } catch (error) {
          projectInfo.stats = "Unable to retrieve project statistics";
        }
      }

      return {
        message: JSON.stringify(projectInfo, null, 2),
      };
    } catch (error) {
      console.error("[getProjectInfo tool] Error:", error);
      throw new Error(
        `Failed to get project info: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
} as const;

export type FrontendToolExecutors = typeof frontendToolExecutors;
