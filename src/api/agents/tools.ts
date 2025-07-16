import { tool } from 'ai';
import { z } from 'zod';
import { fileLockManager } from './file-lock-manager';
import { fileSnapshotManager } from './file-snapshot-manager';
import { agentDB } from './database';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Global context for current session (set by execution engine)
let currentSessionId: string | null = null;
let currentProjectPath: string | null = null;

export function setCurrentSessionId(sessionId: string): void {
  currentSessionId = sessionId;
  
  // Also set the project path for this session
  if (sessionId) {
    const session = agentDB.getSession(sessionId);
    currentProjectPath = session?.projectPath || null;
    console.log('DEBUG: setCurrentSessionId', { sessionId, projectPath: currentProjectPath, session: session ? { id: session.id, name: session.name, projectPath: session.projectPath } : null });
  }
}

export function getCurrentSessionId(): string {
  if (!currentSessionId) {
    throw new Error('No active agent session. Tools can only be used within an agent execution context.');
  }
  return currentSessionId;
}

export function getCurrentProjectPath(): string {
  if (!currentProjectPath) {
    throw new Error('No active project path. Tools can only be used within a project context.');
  }
  console.log('DEBUG: getCurrentProjectPath returning:', currentProjectPath);
  return currentProjectPath;
}

// Helper function to add progress tracking
function addProgress(step: string, status: 'pending' | 'running' | 'completed' | 'failed', details?: string): void {
  if (currentSessionId) {
    agentDB.addProgress({ sessionId: currentSessionId, step, status, details });
  }
}

// Helper function to validate file path is within project bounds
function validateFilePath(filePath: string): string {
  const projectPath = getCurrentProjectPath();
  
  // If filePath is already absolute, use it as-is
  // If filePath is relative, resolve it relative to the project path
  const absoluteFilePath = path.isAbsolute(filePath) 
    ? path.resolve(filePath)
    : path.resolve(projectPath, filePath);
    
  const absoluteProjectPath = path.resolve(projectPath);
  
  // Check if file is within project bounds
  if (!absoluteFilePath.startsWith(absoluteProjectPath)) {
    throw new Error(`File access denied: ${filePath} is outside project bounds (${projectPath})`);
  }
  
  return absoluteFilePath;
}

// Helper function to get current step index
function getCurrentStepIndex(): number {
  if (!currentSessionId) return 0;
  const messages = agentDB.getMessages(currentSessionId);
  return messages.length > 0 ? Math.max(...messages.map(m => m.stepIndex)) : 0;
}

// Read File Tool
const readFileParams = z.object({
  filePath: z.string().describe('The path to the file to read'),
});

export const readFile = tool({
  description: 'Read the contents of a file from the filesystem',
  parameters: readFileParams,
  execute: async ({ filePath }) => {
    const sessionId = getCurrentSessionId();
    addProgress(`Reading file: ${filePath}`, 'running');

    try {
      // Validate and resolve file path
      const resolvedFilePath = validateFilePath(filePath);

      // Acquire read lock
      const lockResult = await fileLockManager.acquireReadLockWithStrategy(sessionId, resolvedFilePath);
      
      if (!lockResult.success) {
        addProgress(`Failed to read file: ${filePath}`, 'failed', lockResult.reason);
        return { 
          success: false, 
          error: lockResult.reason,
          conflictingSession: lockResult.conflictingSession 
        };
      }

      // Read file
      const content = await promisify(fs.readFile)(resolvedFilePath, 'utf-8');
      
      // Release lock
      if (lockResult.lockId) {
        fileLockManager.releaseLock(lockResult.lockId, sessionId);
      }

      addProgress(`Successfully read file: ${filePath}`, 'completed');
      return { success: true, content };
      
    } catch (error) {
      addProgress(`Error reading file: ${filePath}`, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

// Write File Tool
const writeFileParams = z.object({
  filePath: z.string().describe('The path to the file to write'),
  content: z.string().describe('The content to write to the file'),
});

export const writeFile = tool({
  description: 'Write content to a file in the filesystem',
  parameters: writeFileParams,
  execute: async ({ filePath, content }) => {
    const sessionId = getCurrentSessionId();
    const stepIndex = getCurrentStepIndex();
    addProgress(`Writing file: ${filePath}`, 'running');

    try {
      // Validate and resolve file path
      const resolvedFilePath = validateFilePath(filePath);

      // Acquire write lock
      const lockResult = await fileLockManager.acquireFileLock(sessionId, resolvedFilePath, 'write');
      
      if (!lockResult.success) {
        addProgress(`Failed to write file: ${filePath}`, 'failed', lockResult.reason);
        return { 
          success: false, 
          error: lockResult.reason,
          conflictingSession: lockResult.conflictingSession 
        };
      }

      // Determine operation type and create snapshot
      let operation: 'create' | 'update';
      try {
        await promisify(fs.access)(resolvedFilePath);
        operation = 'update';
      } catch {
        operation = 'create';
      }

      const snapshot = await fileSnapshotManager.captureFileSnapshot(
        sessionId,
        resolvedFilePath,
        operation,
        stepIndex
      );

      // Ensure directory exists
      const dir = path.dirname(resolvedFilePath);
      await promisify(fs.mkdir)(dir, { recursive: true });
      
      // Write file
      await promisify(fs.writeFile)(resolvedFilePath, content, 'utf-8');
      console.log(`✅ Successfully wrote file: ${resolvedFilePath} (${content.length} characters)`);
      
      // Verify the file was actually written
      try {
        const verifyContent = await promisify(fs.readFile)(resolvedFilePath, 'utf-8');
        if (verifyContent !== content) {
          throw new Error(`File content mismatch after write`);
        }
        console.log(`✅ File write verified: ${resolvedFilePath}`);
      } catch (verifyError) {
        console.error(`❌ File write verification failed: ${resolvedFilePath}`, verifyError);
        throw verifyError;
      }
      
      // Update snapshot with after content
      await fileSnapshotManager.updateSnapshotAfterContent(snapshot.id, content);
      
      // Release lock
      if (lockResult.lockId) {
        fileLockManager.releaseLock(lockResult.lockId, sessionId);
      }

      addProgress(`Successfully wrote file: ${filePath}`, 'completed');
      return { success: true };
      
    } catch (error) {
      addProgress(`Error writing file: ${filePath}`, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

// List Directory Tool
const listDirectoryParams = z.object({
  dirPath: z.string().describe('The path to the directory to list'),
});

export const listDirectory = tool({
  description: 'List the contents of a directory',
  parameters: listDirectoryParams,
  execute: async ({ dirPath }) => {
    addProgress(`Listing directory: ${dirPath}`, 'running');

    try {
      // Validate and resolve directory path
      const resolvedDirPath = validateFilePath(dirPath);

      const items = await promisify(fs.readdir)(resolvedDirPath, { withFileTypes: true });
      
      const result = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(resolvedDirPath, item.name),
      }));

      addProgress(`Successfully listed directory: ${dirPath}`, 'completed');
      return { success: true, items: result };
      
    } catch (error) {
      addProgress(`Error listing directory: ${dirPath}`, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

// Create Directory Tool
const createDirectoryParams = z.object({
  dirPath: z.string().describe('The path to the directory to create'),
});

export const createDirectory = tool({
  description: 'Create a new directory',
  parameters: createDirectoryParams,
  execute: async ({ dirPath }) => {
    addProgress(`Creating directory: ${dirPath}`, 'running');

    try {
      // Validate and resolve directory path
      const resolvedDirPath = validateFilePath(dirPath);

      await promisify(fs.mkdir)(resolvedDirPath, { recursive: true });
      
      addProgress(`Successfully created directory: ${dirPath}`, 'completed');
      return { success: true };
      
    } catch (error) {
      addProgress(`Error creating directory: ${dirPath}`, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

// Delete File Tool
const deleteFileParams = z.object({
  filePath: z.string().describe('The path to the file to delete'),
});

export const deleteFile = tool({
  description: 'Delete a file from the filesystem',
  parameters: deleteFileParams,
  execute: async ({ filePath }) => {
    const sessionId = getCurrentSessionId();
    const stepIndex = getCurrentStepIndex();
    addProgress(`Deleting file: ${filePath}`, 'running');

    try {
      // Validate and resolve file path
      const resolvedFilePath = validateFilePath(filePath);

      // Acquire write lock for deletion
      const lockResult = await fileLockManager.acquireFileLock(sessionId, resolvedFilePath, 'write');
      
      if (!lockResult.success) {
        addProgress(`Failed to delete file: ${filePath}`, 'failed', lockResult.reason);
        return { 
          success: false, 
          error: lockResult.reason,
          conflictingSession: lockResult.conflictingSession 
        };
      }

      // Create snapshot before deletion
      const snapshot = await fileSnapshotManager.captureFileSnapshot(
        sessionId,
        resolvedFilePath,
        'delete',
        stepIndex
      );

      // Delete file
      await promisify(fs.unlink)(resolvedFilePath);
      
      // Release lock
      if (lockResult.lockId) {
        fileLockManager.releaseLock(lockResult.lockId, sessionId);
      }

      addProgress(`Successfully deleted file: ${filePath}`, 'completed');
      return { success: true };
      
    } catch (error) {
      addProgress(`Error deleting file: ${filePath}`, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

// Search Files Tool
const searchFilesParams = z.object({
  query: z.string().describe('The search query to find files'),
  directory: z.string().optional().describe('The directory to search in (optional)'),
});

export const searchFiles = tool({
  description: 'Search for files by name or content',
  parameters: searchFilesParams,
  execute: async ({ query, directory }) => {
    const searchDir = directory || getCurrentProjectPath(); // Use project path instead of process.cwd()
    addProgress(`Searching files in: ${searchDir}`, 'running');

    try {
      // This is a simplified search - in a real implementation you'd want something more sophisticated
      const findFiles = async (dir: string, pattern: string): Promise<string[]> => {
        const results: string[] = [];
        const items = await promisify(fs.readdir)(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory() && !item.name.startsWith('.')) {
            results.push(...await findFiles(fullPath, pattern));
          } else if (item.isFile() && item.name.toLowerCase().includes(pattern.toLowerCase())) {
            results.push(fullPath);
          }
        }
        
        return results;
      };

      // Validate and resolve search directory
      const resolvedSearchDir = validateFilePath(searchDir);

      const matches = await findFiles(resolvedSearchDir, query);
      
      addProgress(`Search completed in: ${searchDir}`, 'completed', `Found ${matches.length} matches`);
      return { success: true, matches };
      
    } catch (error) {
      addProgress(`Error searching files in: ${searchDir}`, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

// Get Project Info Tool
const getProjectInfoParams = z.object({
  includeStats: z.boolean().optional().describe('Whether to include file statistics'),
});

export const getProjectInfo = tool({
  description: 'Get information about the current project',
  parameters: getProjectInfoParams,
  execute: async ({ includeStats = false }) => {
    const projectPath = getCurrentProjectPath(); // Use the actual project path, not process.cwd()
    addProgress(`Getting project info for: ${projectPath}`, 'running');

    try {
      const info: any = {
        path: projectPath,
        name: path.basename(projectPath),
      };

      // Check for common project files
      const projectFiles = ['package.json', 'tsconfig.json', 'pyproject.toml', 'Cargo.toml'];
      for (const file of projectFiles) {
        const filePath = path.join(projectPath, file);
        if (fs.existsSync(filePath)) {
          info.configFiles = info.configFiles || [];
          info.configFiles.push(file);
        }
      }

      // Get basic stats if requested
      if (includeStats) {
        const getDirectoryStats = async (dir: string): Promise<{ files: number; directories: number }> => {
          let files = 0;
          let directories = 0;
          
          try {
            const items = await promisify(fs.readdir)(dir, { withFileTypes: true });
            
            for (const item of items) {
              if (item.name.startsWith('.')) continue; // Skip hidden files/dirs
              
              if (item.isDirectory()) {
                directories++;
                const subStats = await getDirectoryStats(path.join(dir, item.name));
                files += subStats.files;
                directories += subStats.directories;
              } else {
                files++;
              }
            }
          } catch (error) {
            // Skip directories we can't access
          }
          
          return { files, directories };
        };

        info.stats = await getDirectoryStats(projectPath);
      }

      addProgress(`Successfully got project info`, 'completed');
      return { success: true, info };
      
    } catch (error) {
      addProgress(`Error getting project info`, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
});

export const agentTools = {
  readFile,
  writeFile,
  listDirectory,
  createDirectory,
  deleteFile,
  searchFiles,
  getProjectInfo,
};

export type ToolName = keyof typeof agentTools;
