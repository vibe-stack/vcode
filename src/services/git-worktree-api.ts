import { GitResult } from '@/services/git-api';

export interface GitWorktreeInfo {
  path: string;
  branch: string;
  commit: string;
  locked: boolean;
  prunable: boolean;
}

export interface GitWorktreeAPI {
  // Worktree operations
  createWorktree: (branchName: string, path: string) => Promise<GitResult>;
  removeWorktree: (path: string, force?: boolean) => Promise<GitResult>;
  listWorktrees: (projectPath: string) => Promise<GitWorktreeInfo[]>;
  pruneWorktrees: (projectPath: string) => Promise<GitResult>;
  
  // Branch operations for worktrees
  createBranch: (projectPath: string, branchName: string, startPoint?: string) => Promise<GitResult>;
  deleteBranch: (projectPath: string, branchName: string, force?: boolean) => Promise<GitResult>;
  checkoutBranch: (projectPath: string, branchName: string) => Promise<GitResult>;
}

declare global {
  interface Window {
    gitWorktreeApi: GitWorktreeAPI;
  }
}

export const gitWorktreeApi = window.gitWorktreeApi;
