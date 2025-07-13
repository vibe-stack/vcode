import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GitStatus, GitBranch, GitCommit, GitFileStatus, gitApi } from '@/services/git-api';

// Helper function to compare file arrays for equality
function areFilesEqual(files1: GitFileStatus[], files2: GitFileStatus[]): boolean {
  if (files1.length !== files2.length) return false;
  
  for (let i = 0; i < files1.length; i++) {
    const file1 = files1[i];
    const file2 = files2[i];
    
    if (file1.path !== file2.path || 
        file1.workingTreeStatus !== file2.workingTreeStatus ||
        file1.indexStatus !== file2.indexStatus ||
        file1.relativeFilePath !== file2.relativeFilePath) {
      return false;
    }
  }
  
  return true;
}

interface GitState {
  // Git status
  gitStatus: GitStatus | null;
  isGitRepo: boolean;
  
  // Current project path
  currentProjectPath: string | null;
  
  // Loading states
  isLoadingStatus: boolean;
  isLoadingBranches: boolean;
  isLoadingLog: boolean;
  
  // Git data
  branches: GitBranch[];
  currentBranch: string;
  commits: GitCommit[];
  
  // Auto-refresh
  autoRefreshInterval: NodeJS.Timeout | null;
  
  // Actions
  setCurrentProject: (projectPath: string) => Promise<void>;
  refreshGitStatus: () => Promise<void>;
  loadBranches: () => Promise<void>;
  loadCommits: (limit?: number) => Promise<void>;
  
  // Auto-refresh control
  startAutoRefresh: (interval?: number) => void;
  stopAutoRefresh: () => void;
  
  // Git operations
  initRepo: () => Promise<boolean>;
  addFile: (filePath?: string) => Promise<boolean>;
  commitChanges: (message: string) => Promise<boolean>;
  pushChanges: (remote?: string, branch?: string) => Promise<boolean>;
  pullChanges: (remote?: string, branch?: string) => Promise<boolean>;
  checkoutBranch: (branchName: string) => Promise<boolean>;
  
  // Utilities
  clearGitState: () => void;
}

export const useGitStore = create(immer<GitState>((set, get) => ({
  // Initial state
  gitStatus: null,
  isGitRepo: false,
  currentProjectPath: null,
  isLoadingStatus: false,
  isLoadingBranches: false,
  isLoadingLog: false,
  branches: [],
  currentBranch: '',
  commits: [],
  autoRefreshInterval: null,

  // Set current project and initialize git state
  setCurrentProject: async (projectPath: string) => {
    // Stop any existing auto-refresh
    get().stopAutoRefresh();
    
    set((state) => {
      state.currentProjectPath = projectPath;
      state.isLoadingStatus = true;
    });

    try {
      // Check if it's a git repository
      const isRepo = await gitApi.checkRepo(projectPath);
      
      set((state) => {
        state.isGitRepo = isRepo;
      });

      if (isRepo) {
        // Load initial git data
        await Promise.all([
          get().refreshGitStatus(),
          get().loadBranches(),
          get().loadCommits(),
        ]);
        
        // Start auto-refresh for git repos
        get().startAutoRefresh(30000); // 30 second interval
      }
    } catch (error) {
      console.error('Error initializing git state:', error);
      set((state) => {
        state.isGitRepo = false;
        state.gitStatus = null;
      });
    } finally {
      set((state) => {
        state.isLoadingStatus = false;
      });
    }
  },

  // Auto-refresh control
  startAutoRefresh: (interval = 5000000) => {
    get().stopAutoRefresh(); // Clear any existing interval
    
    const intervalId = setInterval(() => {
      const { isGitRepo, currentProjectPath } = get();
      if (isGitRepo && currentProjectPath) {
        get().refreshGitStatus();
      }
    }, interval);
    
    set((state) => {
      state.autoRefreshInterval = intervalId;
    });
  },

  stopAutoRefresh: () => {
    const { autoRefreshInterval } = get();
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      set((state) => {
        state.autoRefreshInterval = null;
      });
    }
  },

  // Refresh git status
  refreshGitStatus: async () => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return;

    set((state) => {
      state.isLoadingStatus = true;
    });

    try {
      const status = await gitApi.getStatus(currentProjectPath);
      
      // Check if the status actually changed to prevent unnecessary re-renders
      const currentStatus = get().gitStatus;
      if (currentStatus && currentStatus.isGitRepo === status.isGitRepo && 
          currentStatus.currentBranch === status.currentBranch &&
          areFilesEqual(currentStatus.files, status.files)) {
        // Status hasn't changed, skip update
        set((state) => {
          state.isLoadingStatus = false;
        });
        return;
      }
      
      set((state) => {
        state.gitStatus = status;
        state.isGitRepo = status.isGitRepo;
        state.currentBranch = status.currentBranch;
      });
    } catch (error) {
      console.error('Error refreshing git status:', error);
    } finally {
      set((state) => {
        state.isLoadingStatus = false;
      });
    }
  },

  // Load branches
  loadBranches: async () => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return;

    set((state) => {
      state.isLoadingBranches = true;
    });

    try {
      const branches = await gitApi.getBranches(currentProjectPath);
      
      set((state) => {
        state.branches = branches;
        const currentBranch = branches.find(b => b.current);
        if (currentBranch) {
          state.currentBranch = currentBranch.name;
        }
      });
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      set((state) => {
        state.isLoadingBranches = false;
      });
    }
  },

  // Load commits
  loadCommits: async (limit = 10) => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return;

    set((state) => {
      state.isLoadingLog = true;
    });

    try {
      const commits = await gitApi.getLog(currentProjectPath, limit);
      
      set((state) => {
        state.commits = commits;
      });
    } catch (error) {
      console.error('Error loading commits:', error);
    } finally {
      set((state) => {
        state.isLoadingLog = false;
      });
    }
  },

  // Initialize git repository
  initRepo: async () => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return false;

    try {
      const result = await gitApi.init(currentProjectPath);
      
      if (result.success) {
        await get().setCurrentProject(currentProjectPath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing git repository:', error);
      return false;
    }
  },

  // Add file to git
  addFile: async (filePath?: string) => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return false;

    try {
      const result = await gitApi.add(currentProjectPath, filePath);
      
      if (result.success) {
        await get().refreshGitStatus();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding file to git:', error);
      return false;
    }
  },

  // Commit changes
  commitChanges: async (message: string) => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return false;

    try {
      const result = await gitApi.commit(currentProjectPath, message);
      
      if (result.success) {
        await Promise.all([
          get().refreshGitStatus(),
          get().loadCommits(),
        ]);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error committing changes:', error);
      return false;
    }
  },

  // Push changes
  pushChanges: async (remote?: string, branch?: string) => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return false;

    try {
      const result = await gitApi.push(currentProjectPath, remote, branch);
      return result.success;
    } catch (error) {
      console.error('Error pushing changes:', error);
      return false;
    }
  },

  // Pull changes
  pullChanges: async (remote?: string, branch?: string) => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return false;

    try {
      const result = await gitApi.pull(currentProjectPath, remote, branch);
      
      if (result.success) {
        await Promise.all([
          get().refreshGitStatus(),
          get().loadCommits(),
        ]);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error pulling changes:', error);
      return false;
    }
  },

  // Checkout branch
  checkoutBranch: async (branchName: string) => {
    const { currentProjectPath } = get();
    if (!currentProjectPath) return false;

    try {
      const result = await gitApi.checkout(currentProjectPath, branchName);
      
      if (result.success) {
        await Promise.all([
          get().refreshGitStatus(),
          get().loadBranches(),
          get().loadCommits(),
        ]);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking out branch:', error);
      return false;
    }
  },

  // Clear git state
  clearGitState: () => {
    get().stopAutoRefresh();
    
    set((state) => {
      state.gitStatus = null;
      state.isGitRepo = false;
      state.currentProjectPath = null;
      state.branches = [];
      state.currentBranch = '';
      state.commits = [];
    });
  },
})));

// Set up git event listeners
if (typeof window !== 'undefined' && window.gitApi) {
  // Listen for git status changes
  window.gitApi.onStatusChanged((status) => {
    useGitStore.setState((state) => {
      state.gitStatus = status;
      state.isGitRepo = status.isGitRepo;
      state.currentBranch = status.currentBranch;
    });
  });

  // Listen for branch changes
  window.gitApi.onBranchChanged((branch) => {
    useGitStore.setState((state) => {
      state.currentBranch = branch;
    });
  });
}
