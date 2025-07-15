// Git service API for frontend
export interface GitFileStatus {
  path: string;
  workingTreeStatus: string;
  indexStatus: string;
  relativeFilePath: string;
}

export interface GitStatus {
  isGitRepo: boolean;
  files: GitFileStatus[];
  currentBranch: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitResult {
  success: boolean;
  error?: string;
}

declare global {
  interface Window {
    gitApi: {
      // Git status operations
      getStatus: (projectPath: string) => Promise<GitStatus>;
      checkRepo: (projectPath: string) => Promise<boolean>;
      getDiff: (projectPath: string, filePath: string) => Promise<string>;
      
      // Branch operations
      getCurrentBranch: (projectPath: string) => Promise<string>;
      createBranch: (branchName: string) => Promise<GitResult>;
      getBranches: (projectPath: string) => Promise<GitBranch[]>;
      checkout: (projectPath: string, branch: string) => Promise<GitResult>;
      
      // Git operations
      init: (projectPath: string) => Promise<GitResult>;
      add: (projectPath: string, filePath?: string) => Promise<GitResult>;
      commit: (projectPath: string, message: string) => Promise<GitResult>;
      push: (projectPath: string, remote?: string, branch?: string) => Promise<GitResult>;
      pull: (projectPath: string, remote?: string, branch?: string) => Promise<GitResult>;
      
      // Git log
      getLog: (projectPath: string, limit?: number) => Promise<GitCommit[]>;
      
      // Event listeners
      onStatusChanged: (callback: (status: GitStatus) => void) => () => void;
      onBranchChanged: (callback: (branch: string) => void) => () => void;
    };
  }
}

export const gitApi = window.gitApi;

// Git status helper functions
export const getGitStatusColor = (workingTreeStatus: string, indexStatus: string) => {
  // Modified files (orange)
  if (workingTreeStatus === 'M' || indexStatus === 'M') {
    return 'text-orange-300';
  }
  
  // Added files (green)
  if (workingTreeStatus === 'A' || indexStatus === 'A') {
    return 'text-green-300';
  }
  
  // Deleted files (red)
  if (workingTreeStatus === 'D' || indexStatus === 'D') {
    return 'text-red-300';
  }
  
  // Renamed files (blue)
  if (workingTreeStatus === 'R' || indexStatus === 'R') {
    return 'text-blue-300';
  }
  
  // Untracked files (gray)
  if (workingTreeStatus === '?' || indexStatus === '?') {
    return 'text-gray-300';
  }
  
  // Copied files (cyan)
  if (workingTreeStatus === 'C' || indexStatus === 'C') {
    return 'text-cyan-300';
  }
  
  // Updated but unmerged (purple)
  if (workingTreeStatus === 'U' || indexStatus === 'U') {
    return 'text-purple-300';
  }
  
  return '';
};

export const getGitStatusIcon = (workingTreeStatus: string, indexStatus: string) => {
  // Modified files
  if (workingTreeStatus === 'M' || indexStatus === 'M') {
    return '●';
  }
  
  // Added files
  if (workingTreeStatus === 'A' || indexStatus === 'A') {
    return '+';
  }
  
  // Deleted files
  if (workingTreeStatus === 'D' || indexStatus === 'D') {
    return '-';
  }
  
  // Renamed files
  if (workingTreeStatus === 'R' || indexStatus === 'R') {
    return '→';
  }
  
  // Untracked files
  if (workingTreeStatus === '?' || indexStatus === '?') {
    return '?';
  }
  
  // Copied files
  if (workingTreeStatus === 'C' || indexStatus === 'C') {
    return '©';
  }
  
  // Updated but unmerged
  if (workingTreeStatus === 'U' || indexStatus === 'U') {
    return '!';
  }
  
  return '';
};

export const getGitStatusTooltip = (workingTreeStatus: string, indexStatus: string) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'M': return 'Modified';
      case 'A': return 'Added';
      case 'D': return 'Deleted';
      case 'R': return 'Renamed';
      case 'C': return 'Copied';
      case 'U': return 'Updated but unmerged';
      case '?': return 'Untracked';
      default: return '';
    }
  };
  
  const workingText = getStatusText(workingTreeStatus);
  const indexText = getStatusText(indexStatus);
  
  if (workingText && indexText) {
    return `Working tree: ${workingText}, Index: ${indexText}`;
  } else if (workingText) {
    return `Working tree: ${workingText}`;
  } else if (indexText) {
    return `Index: ${indexText}`;
  }
  
  return '';
};
