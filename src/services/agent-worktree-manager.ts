import { EventEmitter } from 'events';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { AgentWorktreeInfo } from '@/helpers/ipc/agents/agent-context';

export interface WorktreeInfo {
  taskId: string;
  worktreePath: string;
  branchName: string;
  isActive: boolean;
  createdAt: Date;
}

export class AgentWorktreeManager extends EventEmitter {
  private worktrees: Map<string, WorktreeInfo> = new Map();
  private projectPath: string = '';

  constructor() {
    super();
    // TODO: Get project path from project store or settings
    // For now, we'll set it when needed
  }

  setProjectPath(projectPath: string) {
    this.projectPath = projectPath;
  }

  async createWorktree(taskId: string, branchName: string): Promise<{ success: boolean; error?: string; worktreePath?: string }> {
    try {
      if (!this.projectPath) {
        return { success: false, error: 'Project path not set' };
      }

      // Create worktree directory name based on task ID
      const worktreeDir = `agent-${taskId}`;
      const worktreePath = path.join(this.projectPath, '..', worktreeDir);

      // Check if worktree already exists
      if (this.worktrees.has(taskId)) {
        return { success: false, error: 'Worktree already exists for this task' };
      }

      // Create the git worktree
      const gitCommand = `git worktree add ${worktreePath} -b ${branchName}`;
      
      try {
        execSync(gitCommand, { 
          cwd: this.projectPath,
          stdio: 'pipe' 
        });
      } catch (gitError) {
        return { 
          success: false, 
          error: `Failed to create git worktree: ${gitError instanceof Error ? gitError.message : 'Unknown error'}` 
        };
      }

      // Store worktree info
      const worktreeInfo: WorktreeInfo = {
        taskId,
        worktreePath,
        branchName,
        isActive: false,
        createdAt: new Date()
      };

      this.worktrees.set(taskId, worktreeInfo);
      this.emitWorktreeStatusChange(worktreeInfo);

      return { success: true, worktreePath };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async deleteWorktree(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const worktreeInfo = this.worktrees.get(taskId);
      if (!worktreeInfo) {
        return { success: false, error: 'Worktree not found' };
      }

      // Remove the git worktree
      const gitCommand = `git worktree remove ${worktreeInfo.worktreePath}`;
      
      try {
        execSync(gitCommand, { 
          cwd: this.projectPath,
          stdio: 'pipe' 
        });
      } catch (gitError) {
        // If git worktree remove fails, try to force remove
        try {
          execSync(`git worktree remove --force ${worktreeInfo.worktreePath}`, { 
            cwd: this.projectPath,
            stdio: 'pipe' 
          });
        } catch (forceError) {
          return { 
            success: false, 
            error: `Failed to remove git worktree: ${forceError instanceof Error ? forceError.message : 'Unknown error'}` 
          };
        }
      }

      // Remove from our tracking
      this.worktrees.delete(taskId);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async switchToWorktree(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const worktreeInfo = this.worktrees.get(taskId);
      if (!worktreeInfo) {
        return { success: false, error: 'Worktree not found' };
      }

      // Mark all worktrees as inactive
      this.worktrees.forEach(wt => {
        wt.isActive = false;
      });

      // Mark the target worktree as active
      worktreeInfo.isActive = true;
      this.emitWorktreeStatusChange(worktreeInfo);

      // TODO: Implement actual workspace switching logic
      // This would involve:
      // 1. Notifying the main window to switch to the worktree directory
      // 2. Updating the file explorer to show the worktree contents
      // 3. Updating the editor to open files from the worktree

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  getWorktree(taskId: string): WorktreeInfo | undefined {
    return this.worktrees.get(taskId);
  }

  getAllWorktrees(): WorktreeInfo[] {
    return Array.from(this.worktrees.values());
  }

  getActiveWorktree(): WorktreeInfo | undefined {
    return Array.from(this.worktrees.values()).find(wt => wt.isActive);
  }

  onWorktreeStatusChange(callback: (info: AgentWorktreeInfo) => void) {
    this.on('worktreeStatusChange', callback);
  }

  private emitWorktreeStatusChange(worktreeInfo: WorktreeInfo) {
    const info: AgentWorktreeInfo = {
      taskId: worktreeInfo.taskId,
      worktreePath: worktreeInfo.worktreePath,
      branchName: worktreeInfo.branchName,
      isActive: worktreeInfo.isActive
    };
    
    this.emit('worktreeStatusChange', info);
  }

  // Utility method to list all git worktrees
  async listGitWorktrees(): Promise<string[]> {
    try {
      const output = execSync('git worktree list', { 
        cwd: this.projectPath,
        encoding: 'utf8'
      });
      return output.trim().split('\n');
    } catch (error) {
      console.error('Failed to list git worktrees:', error);
      return [];
    }
  }

  // Cleanup method to remove orphaned worktrees
  async cleanupOrphanedWorktrees(): Promise<void> {
    const gitWorktrees = await this.listGitWorktrees();
    const trackedWorktrees = Array.from(this.worktrees.values());

    // Find worktrees that exist in git but not in our tracking
    for (const gitWorktree of gitWorktrees) {
      if (gitWorktree.includes('agent-')) {
        const worktreePath = gitWorktree.split(/\s+/)[0];
        const found = trackedWorktrees.find(wt => wt.worktreePath === worktreePath);
        
        if (!found) {
          // This is an orphaned worktree, remove it
          try {
            execSync(`git worktree remove --force ${worktreePath}`, { 
              cwd: this.projectPath,
              stdio: 'pipe' 
            });
            console.log(`Cleaned up orphaned worktree: ${worktreePath}`);
          } catch (error) {
            console.error(`Failed to cleanup worktree ${worktreePath}:`, error);
          }
        }
      }
    }
  }
}
