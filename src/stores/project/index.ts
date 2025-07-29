import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DirectoryNode, RecentProject, projectApi } from '@/services/project-api';
import { useGitStore } from '@/stores/git';
import { initializeTypeScriptProject } from '@/config/monaco-languages';

export interface ProjectState {
    // Current project
    currentProject: string | null;
    projectName: string | null;

    // File tree
    fileTree: DirectoryNode | null;

    // Recent projects
    recentProjects: RecentProject[];

    // Loading states
    isLoadingProject: boolean;
    isLoadingRecentProjects: boolean;

    // Actions
    setCurrentProject: (path: string) => Promise<void>;
    loadFileTree: (rootPath: string) => Promise<void>;
    loadRecentProjects: () => Promise<void>;
    openProject: (path?: string) => Promise<void>;
    addRecentProject: (path: string, name?: string) => Promise<void>;
    removeRecentProject: (path: string) => Promise<void>;
    clearCurrentProject: () => void;

    // Auto-open functionality
    setLastOpenedProject: (path: string) => Promise<void>;
    getLastOpenedProject: () => Promise<string | null>;
    autoOpenLastProject: () => Promise<void>;

    // File watching
    watchCurrentProject: () => Promise<void>;
    unwatchCurrentProject: () => Promise<void>;

    // File tree updates
    refreshFileTree: () => Promise<void>;
    updateFileInTree: (filePath: string, action: 'created' | 'deleted' | 'modified') => void;
}

export const useProjectStore = create(immer<ProjectState>((set, get) => ({
    // Initial state
    currentProject: null,
    projectName: null,
    fileTree: null,
    recentProjects: [],
    isLoadingProject: false,
    isLoadingRecentProjects: false,

    // Set current project
    setCurrentProject: async (path: string) => {
        try {
            set((state) => {
                state.isLoadingProject = true;
            });
            const projectPath = await projectApi.setCurrentProject(path);
            const projectName = path.split('/').pop() || 'Unknown Project';

            set((state) => {
                state.currentProject = projectPath;
                state.projectName = projectName;
            });

            // Load file tree for the new project
            await get().loadFileTree(projectPath);

            // Add to recent projects
            await get().addRecentProject(projectPath, projectName);

            // Save as last opened project for auto-open
            await get().setLastOpenedProject(projectPath);

            // Start watching the project
            await get().watchCurrentProject();

            // Initialize git store for the new project
            useGitStore.getState().setCurrentProject(projectPath);

            // Initialize TypeScript project integration
            await initializeTypeScriptProject(projectPath);
        } catch (error) {
            console.error('Error setting current project:', error);
        } finally {
            set((state) => {
                state.isLoadingProject = false;
            });
        }
    },

    // Clear current project
    clearCurrentProject: () => {
        get().unwatchCurrentProject();
        // Clear git store
        useGitStore.getState().clearGitState();
        set((state) => {
            state.currentProject = null;
            state.projectName = null;
            state.fileTree = null;
        });
    },

    // Load file tree
    loadFileTree: async (rootPath: string) => {
        try {
            const tree = await projectApi.getDirectoryTree(rootPath, {
                depth: 20,
                includeFiles: true
            });
            set((state) => {
                state.fileTree = tree;
            });
        } catch (error) {
            console.error('Error loading file tree:', error);
        }
    },

    // Load recent projects
    loadRecentProjects: async () => {
        try {
            set((state) => {
                state.isLoadingRecentProjects = true;
            });
            const projects = await projectApi.getRecentProjects();
            set((state) => {
                state.recentProjects = projects;
            });
        } catch (error) {
            console.error('Error loading recent projects:', error);
        } finally {
            set((state) => {
                state.isLoadingRecentProjects = false;
            });
        }
    },

    // Open project (with optional path)
    openProject: async (path?: string) => {
        try {
            const selectedPath = await projectApi.openFolder(path);
            if (selectedPath) {
                await get().setCurrentProject(selectedPath);
            }
        } catch (error) {
            console.error('Error opening project:', error);
        }
    },

    // Add recent project
    addRecentProject: async (path: string, name?: string) => {
        try {
            const updatedProjects = await projectApi.addRecentProject(path, name);
            set({ recentProjects: updatedProjects });
        } catch (error) {
            console.error('Error adding recent project:', error);
        }
    },

    // Remove recent project
    removeRecentProject: async (path: string) => {
        try {
            const updatedProjects = await projectApi.removeRecentProject(path);
            set({ recentProjects: updatedProjects });
        } catch (error) {
            console.error('Error removing recent project:', error);
        }
    },

    // Set last opened project for auto-open
    setLastOpenedProject: async (path: string) => {
        try {
            await projectApi.setLastOpenedProject(path);
        } catch (error) {
            console.error('Error setting last opened project:', error);
        }
    },

    // Get last opened project
    getLastOpenedProject: async () => {
        try {
            return await projectApi.getLastOpenedProject();
        } catch (error) {
            console.error('Error getting last opened project:', error);
            return null;
        }
    },

    // Auto-open last project
    autoOpenLastProject: async () => {
        try {
            const path = await projectApi.getLastOpenedProject();
            if (path) {
                await get().setCurrentProject(path);
            }
        } catch (error) {
            console.error('Error auto-opening last project:', error);
        }
    },

    // Watch current project for changes
    watchCurrentProject: async () => {
        const { currentProject } = get();
        if (!currentProject) return;

        try {
            // Set up file change listeners
            projectApi.onFileChanged((filePath, eventType) => {
                get().updateFileInTree(filePath, eventType as 'created' | 'deleted' | 'modified');
            });

            projectApi.onFileCreated((filePath) => {
                get().updateFileInTree(filePath, 'created');
            });

            projectApi.onFileDeleted((filePath) => {
                get().updateFileInTree(filePath, 'deleted');
            });

            projectApi.onFileRenamed((oldPath, newPath) => {
                get().updateFileInTree(oldPath, 'deleted');
                get().updateFileInTree(newPath, 'created');
            });

            await projectApi.watchFileChanges(currentProject);
        } catch (error) {
            console.error('Error watching project:', error);
        }
    },

    // Unwatch current project
    unwatchCurrentProject: async () => {
        const { currentProject } = get();
        if (!currentProject) return;

        try {
            await projectApi.unwatchFileChanges(currentProject);
        } catch (error) {
            console.error('Error unwatching project:', error);
        }
    },

    // Refresh file tree
    refreshFileTree: async () => {
        const { currentProject } = get();
        if (currentProject) {
            await get().loadFileTree(currentProject);
        }
    },

    // Update file in tree (optimistic update)
    updateFileInTree: (filePath: string, action: 'created' | 'deleted' | 'modified') => {
        const { fileTree } = get();
        if (!fileTree) return;

        // Only auto-refresh for modifications, not for create/delete which are often part of renames
        // This prevents the double refresh issue that causes navigation problems
        if (action === 'modified') {
            setTimeout(() => get().refreshFileTree(), 50);
        }
        // For create/delete, we let the UI components handle the refresh manually
        // since they have better context about when it's safe to do so
    },
})))