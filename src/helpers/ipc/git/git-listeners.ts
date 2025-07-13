import { ipcMain, BrowserWindow } from "electron";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";
import { FSWatcher } from "fs";
import {
  GIT_GET_STATUS_CHANNEL,
  GIT_GET_DIFF_CHANNEL,
  GIT_INIT_CHANNEL,
  GIT_ADD_CHANNEL,
  GIT_COMMIT_CHANNEL,
  GIT_PUSH_CHANNEL,
  GIT_PULL_CHANNEL,
  GIT_CHECK_REPO_CHANNEL,
  GIT_GET_BRANCH_CHANNEL,
  GIT_GET_BRANCHES_CHANNEL,
  GIT_CHECKOUT_CHANNEL,
  GIT_GET_LOG_CHANNEL,
  GIT_STATUS_CHANGED_EVENT,
  GIT_BRANCH_CHANGED_EVENT,
} from "./git-channels";

const execAsync = promisify(exec);

interface GitStatus {
  isGitRepo: boolean;
  files: GitFileStatus[];
  currentBranch: string;
}

interface GitFileStatus {
  path: string;
  workingTreeStatus: string;
  indexStatus: string;
  relativeFilePath: string;
}

interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

let mainWindow: BrowserWindow | null = null;
let currentProjectPath: string | null = null;
let gitStatusWatcher: FSWatcher | null = null;
let statusUpdateTimeout: NodeJS.Timeout | null = null;

// Helper function to check if a directory is a git repository
async function isGitRepository(dirPath: string): Promise<boolean> {
  try {
    const gitDir = path.join(dirPath, '.git');
    return fs.existsSync(gitDir);
  } catch (error) {
    return false;
  }
}

// Helper function to run git commands
async function runGitCommand(command: string, cwd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command, { cwd });
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

// Watch for git status changes
function watchGitStatus(projectPath: string) {
  if (gitStatusWatcher) {
    gitStatusWatcher.close();
  }

  // Clear any existing timeout
  if (statusUpdateTimeout) {
    clearTimeout(statusUpdateTimeout);
    statusUpdateTimeout = null;
  }

  try {
    const gitDir = path.join(projectPath, '.git');
    if (!fs.existsSync(gitDir)) return;

    // Debounced status update function
    const debouncedStatusUpdate = () => {
      if (statusUpdateTimeout) {
        clearTimeout(statusUpdateTimeout);
      }
      statusUpdateTimeout = setTimeout(() => {
        emitGitStatusChange(projectPath);
        statusUpdateTimeout = null;
      }, 1000); // 1 second debounce
    };

    // Watch for changes in .git directory
    gitStatusWatcher = fs.watch(gitDir, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.includes('index') || filename.includes('HEAD'))) {
        debouncedStatusUpdate();
      }
    });

    // Also watch for file changes in the project (but with more selective filtering)
    const projectWatcher = fs.watch(projectPath, { recursive: true }, (eventType, filename) => {
      if (filename && 
          !filename.startsWith('.git/') && 
          !filename.includes('node_modules') &&
          !filename.includes('.vscode') &&
          !filename.includes('dist') &&
          !filename.includes('build') &&
          !filename.includes('.DS_Store') &&
          !filename.includes('.vite')) {
        debouncedStatusUpdate();
      }
    });

    // Store both watchers
    gitStatusWatcher = {
      close: () => {
        projectWatcher.close();
        if (statusUpdateTimeout) {
          clearTimeout(statusUpdateTimeout);
          statusUpdateTimeout = null;
        }
      }
    } as FSWatcher;

  } catch (error) {
    console.error('Error setting up git status watcher:', error);
  }
}

// Get git status for the current project
async function getGitStatus(projectPath: string): Promise<GitStatus> {
  const isRepo = await isGitRepository(projectPath);
  
  if (!isRepo) {
    return {
      isGitRepo: false,
      files: [],
      currentBranch: '',
    };
  }

  try {
    // Get current branch
    const branch = await runGitCommand('git branch --show-current', projectPath);
    
    // Get status in porcelain format
    const statusOutput = await runGitCommand('git status --porcelain', projectPath);
    
    const files: GitFileStatus[] = [];
    if (statusOutput) {
      const lines = statusOutput.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const indexStatus = line[0];
        const workingTreeStatus = line[1];
        const filePath = line.substring(3);
        
        files.push({
          path: path.join(projectPath, filePath),
          workingTreeStatus,
          indexStatus,
          relativeFilePath: filePath,
        });
      }
    }
    
    return {
      isGitRepo: true,
      files,
      currentBranch: branch,
    };
  } catch (error) {
    console.error('Error getting git status:', error);
    return {
      isGitRepo: false,
      files: [],
      currentBranch: '',
    };
  }
}

// Get git diff for a specific file
async function getGitDiff(projectPath: string, filePath: string): Promise<string> {
  const isRepo = await isGitRepository(projectPath);
  if (!isRepo) {
    throw new Error('Not a git repository');
  }

  try {
    const relativePath = path.relative(projectPath, filePath);
    const diff = await runGitCommand(`git diff HEAD -- "${relativePath}"`, projectPath);
    return diff;
  } catch (error) {
    console.error('Error getting git diff:', error);
    return '';
  }
}

// Get git branches
async function getGitBranches(projectPath: string): Promise<GitBranch[]> {
  const isRepo = await isGitRepository(projectPath);
  if (!isRepo) {
    return [];
  }

  try {
    const branchOutput = await runGitCommand('git branch -a', projectPath);
    const branches: GitBranch[] = [];
    
    const lines = branchOutput.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const current = trimmedLine.startsWith('*');
      const branchName = trimmedLine.replace(/^\*\s*/, '').replace(/^remotes\//, '');
      
      if (branchName && !branchName.includes('->')) {
        branches.push({
          name: branchName,
          current,
          remote: branchName.includes('/') ? branchName.split('/')[0] : undefined,
        });
      }
    }
    
    return branches;
  } catch (error) {
    console.error('Error getting git branches:', error);
    return [];
  }
}

// Get git log
async function getGitLog(projectPath: string, limit: number = 10): Promise<GitCommit[]> {
  const isRepo = await isGitRepository(projectPath);
  if (!isRepo) {
    return [];
  }

  try {
    const logOutput = await runGitCommand(
      `git log --oneline --format="%H|%s|%an|%ad" --date=iso -n ${limit}`,
      projectPath
    );
    
    const commits: GitCommit[] = [];
    const lines = logOutput.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 4) {
        commits.push({
          hash: parts[0],
          message: parts[1],
          author: parts[2],
          date: parts[3],
        });
      }
    }
    
    return commits;
  } catch (error) {
    console.error('Error getting git log:', error);
    return [];
  }
}

export function addGitEventListeners(window: BrowserWindow) {
  mainWindow = window;

  // Get git status
  ipcMain.handle(GIT_GET_STATUS_CHANNEL, async (_, projectPath: string) => {
    return await getGitStatus(projectPath);
  });

  // Check if directory is a git repository
  ipcMain.handle(GIT_CHECK_REPO_CHANNEL, async (_, projectPath: string) => {
    const isRepo = await isGitRepository(projectPath);
    if (isRepo && projectPath !== currentProjectPath) {
      currentProjectPath = projectPath;
      watchGitStatus(projectPath);
    }
    return isRepo;
  });

  // Get git diff for a file
  ipcMain.handle(GIT_GET_DIFF_CHANNEL, async (_, projectPath: string, filePath: string) => {
    return await getGitDiff(projectPath, filePath);
  });

  // Get current branch
  ipcMain.handle(GIT_GET_BRANCH_CHANNEL, async (_, projectPath: string) => {
    const isRepo = await isGitRepository(projectPath);
    if (!isRepo) return '';
    
    try {
      return await runGitCommand('git branch --show-current', projectPath);
    } catch (error) {
      return '';
    }
  });

  // Get all branches
  ipcMain.handle(GIT_GET_BRANCHES_CHANNEL, async (_, projectPath: string) => {
    return await getGitBranches(projectPath);
  });

  // Get git log
  ipcMain.handle(GIT_GET_LOG_CHANNEL, async (_, projectPath: string, limit?: number) => {
    return await getGitLog(projectPath, limit);
  });

  // Git init
  ipcMain.handle(GIT_INIT_CHANNEL, async (_, projectPath: string) => {
    try {
      await runGitCommand('git init', projectPath);
      
      // Start watching after init
      currentProjectPath = projectPath;
      watchGitStatus(projectPath);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Git add
  ipcMain.handle(GIT_ADD_CHANNEL, async (_, projectPath: string, filePath?: string) => {
    try {
      const command = filePath ? `git add "${filePath}"` : 'git add .';
      await runGitCommand(command, projectPath);
      
      // Emit status changed event
      const status = await getGitStatus(projectPath);
      mainWindow?.webContents.send(GIT_STATUS_CHANGED_EVENT, status);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Git commit
  ipcMain.handle(GIT_COMMIT_CHANNEL, async (_, projectPath: string, message: string) => {
    try {
      await runGitCommand(`git commit -m "${message}"`, projectPath);
      
      // Emit status changed event
      const status = await getGitStatus(projectPath);
      mainWindow?.webContents.send(GIT_STATUS_CHANGED_EVENT, status);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Git push
  ipcMain.handle(GIT_PUSH_CHANNEL, async (_, projectPath: string, remote?: string, branch?: string) => {
    try {
      const command = remote && branch ? `git push ${remote} ${branch}` : 'git push';
      await runGitCommand(command, projectPath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Git pull
  ipcMain.handle(GIT_PULL_CHANNEL, async (_, projectPath: string, remote?: string, branch?: string) => {
    try {
      const command = remote && branch ? `git pull ${remote} ${branch}` : 'git pull';
      await runGitCommand(command, projectPath);
      
      // Emit status changed event
      const status = await getGitStatus(projectPath);
      mainWindow?.webContents.send(GIT_STATUS_CHANGED_EVENT, status);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Git checkout
  ipcMain.handle(GIT_CHECKOUT_CHANNEL, async (_, projectPath: string, branch: string) => {
    try {
      await runGitCommand(`git checkout ${branch}`, projectPath);
      
      // Emit branch changed event
      const currentBranch = await runGitCommand('git branch --show-current', projectPath);
      mainWindow?.webContents.send(GIT_BRANCH_CHANGED_EVENT, currentBranch);
      
      // Emit status changed event
      const status = await getGitStatus(projectPath);
      mainWindow?.webContents.send(GIT_STATUS_CHANGED_EVENT, status);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

// Helper function to emit git status changes from external sources
export function emitGitStatusChange(projectPath: string) {
  if (mainWindow) {
    getGitStatus(projectPath).then(status => {
      mainWindow?.webContents.send(GIT_STATUS_CHANGED_EVENT, status);
    });
  }
}
