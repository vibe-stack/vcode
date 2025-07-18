import { tool } from "ai";
import { z } from "zod";

// Read File Tool
const readFileParams = z.object({
  filePath: z.string().describe("The path to the file to read"),
});

export const readFile = tool({
  description: "Read the contents of a file from the filesystem",
  parameters: readFileParams,
  // No execute function - requires frontend confirmation
});

// Write File Tool
const writeFileParams = z.object({
  filePath: z.string().describe("The path to the file to write"),
  content: z.string().describe("The content to write to the file"),
});

export const writeFile = tool({
  description: "Write content to a file in the filesystem",
  parameters: writeFileParams,
  // No execute function - requires frontend confirmation
});

// List Directory Tool
const listDirectoryParams = z.object({
  dirPath: z.string().describe("The path to the directory to list"),
});

export const listDirectory = tool({
  description: "List the contents of a directory",
  parameters: listDirectoryParams,
  // No execute function - requires frontend confirmation
});

// Create Directory Tool
const createDirectoryParams = z.object({
  dirPath: z.string().describe("The path to the directory to create"),
});

export const createDirectory = tool({
  description: "Create a new directory",
  parameters: createDirectoryParams,
  // No execute function - requires frontend confirmation
});

// Delete File Tool
const deleteFileParams = z.object({
  filePath: z.string().describe("The path to the file to delete"),
});

export const deleteFile = tool({
  description: "Delete a file from the filesystem",
  parameters: deleteFileParams,
  // No execute function - requires frontend confirmation
});

// Search Files Tool
const searchFilesParams = z.object({
  query: z.string().describe("The search query to find files"),
  directory: z
    .string()
    .optional()
    .describe("The directory to search in (optional)"),
});

export const searchFiles = tool({
  description: "Search for files by name or content",
  parameters: searchFilesParams,
  // No execute function - requires frontend confirmation
});

// Get Project Info Tool
const getProjectInfoParams = z.object({
  includeStats: z
    .boolean()
    .optional()
    .describe("Whether to include file statistics"),
});

export const getProjectInfo = tool({
  description: "Get information about the current project",
  parameters: getProjectInfoParams,
  // No execute function - requires frontend confirmation
});

export const tools = {
  readFile,
  writeFile,
  listDirectory,
  createDirectory,
  deleteFile,
  searchFiles,
  getProjectInfo,
};

export type ToolName = keyof typeof tools;

// Re-export everything from other modules for convenience
export * from "./tool-config";
export * from "./tool-registry";
export * from "./tool-execution-service";
export * from "./executors";
