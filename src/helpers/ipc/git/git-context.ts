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

export function exposeGitContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");
  
  contextBridge.exposeInMainWorld("gitApi", {
    // Git status operations
    getStatus: (projectPath: string) => ipcRenderer.invoke(GIT_GET_STATUS_CHANNEL, projectPath),
    checkRepo: (projectPath: string) => ipcRenderer.invoke(GIT_CHECK_REPO_CHANNEL, projectPath),
    getDiff: (projectPath: string, filePath: string) => ipcRenderer.invoke(GIT_GET_DIFF_CHANNEL, projectPath, filePath),
    
    // Branch operations
    getCurrentBranch: (projectPath: string) => ipcRenderer.invoke(GIT_GET_BRANCH_CHANNEL, projectPath),
    getBranches: (projectPath: string) => ipcRenderer.invoke(GIT_GET_BRANCHES_CHANNEL, projectPath),
    checkout: (projectPath: string, branch: string) => ipcRenderer.invoke(GIT_CHECKOUT_CHANNEL, projectPath, branch),
    
    // Git operations
    init: (projectPath: string) => ipcRenderer.invoke(GIT_INIT_CHANNEL, projectPath),
    add: (projectPath: string, filePath?: string) => ipcRenderer.invoke(GIT_ADD_CHANNEL, projectPath, filePath),
    commit: (projectPath: string, message: string) => ipcRenderer.invoke(GIT_COMMIT_CHANNEL, projectPath, message),
    push: (projectPath: string, remote?: string, branch?: string) => ipcRenderer.invoke(GIT_PUSH_CHANNEL, projectPath, remote, branch),
    pull: (projectPath: string, remote?: string, branch?: string) => ipcRenderer.invoke(GIT_PULL_CHANNEL, projectPath, remote, branch),
    
    // Git log
    getLog: (projectPath: string, limit?: number) => ipcRenderer.invoke(GIT_GET_LOG_CHANNEL, projectPath, limit),
    
    // Event listeners
    onStatusChanged: (callback: (status: any) => void) => {
      ipcRenderer.on(GIT_STATUS_CHANGED_EVENT, (_: any, status: any) => callback(status));
      return () => ipcRenderer.removeAllListeners(GIT_STATUS_CHANGED_EVENT);
    },
    
    onBranchChanged: (callback: (branch: string) => void) => {
      ipcRenderer.on(GIT_BRANCH_CHANGED_EVENT, (_: any, branch: any) => callback(branch));
      return () => ipcRenderer.removeAllListeners(GIT_BRANCH_CHANGED_EVENT);
    },
  });
}
