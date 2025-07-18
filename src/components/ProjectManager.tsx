import React, { useState, useEffect } from "react";
import {
  projectApi,
  DirectoryNode,
  RecentProject,
} from "../services/project-api";

interface ProjectManagerProps {
  onProjectOpen?: (projectPath: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onProjectOpen,
}) => {
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [directoryTree, setDirectoryTree] = useState<DirectoryNode | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current project and recent projects on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [current, recent] = await Promise.all([
          projectApi.getCurrentProject(),
          projectApi.getRecentProjects(),
        ]);

        setCurrentProject(current);
        setRecentProjects(recent);

        if (current) {
          await loadDirectoryTree(current);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load project data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Set up file change listeners
  useEffect(() => {
    const unsubscribeFileChanged = projectApi.onFileChanged(
      (filePath, eventType) => {
        console.log(`File changed: ${filePath} (${eventType})`);
        // Optionally refresh directory tree or handle file changes
      },
    );

    const unsubscribeFileCreated = projectApi.onFileCreated((filePath) => {
      console.log(`File created: ${filePath}`);
      // Refresh directory tree when files are created
      if (currentProject) {
        loadDirectoryTree(currentProject);
      }
    });

    const unsubscribeFileDeleted = projectApi.onFileDeleted((filePath) => {
      console.log(`File deleted: ${filePath}`);
      // Refresh directory tree when files are deleted
      if (currentProject) {
        loadDirectoryTree(currentProject);
      }
    });

    return () => {
      unsubscribeFileChanged();
      unsubscribeFileCreated();
      unsubscribeFileDeleted();
    };
  }, [currentProject]);

  const loadDirectoryTree = async (projectPath: string) => {
    try {
      const tree = await projectApi.getDirectoryTree(projectPath, {
        depth: 3,
        includeFiles: true,
      });
      setDirectoryTree(tree);
    } catch (err) {
      console.error("Failed to load directory tree:", err);
    }
  };

  const handleOpenFolder = async () => {
    try {
      setLoading(true);
      setError(null);

      const projectPath = await projectApi.openFolder();
      if (projectPath) {
        setCurrentProject(projectPath);
        await loadDirectoryTree(projectPath);

        // Update recent projects
        const updated = await projectApi.addRecentProject(projectPath);
        setRecentProjects(updated);

        // Start watching for file changes
        await projectApi.watchFileChanges(projectPath);

        onProjectOpen?.(projectPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open project");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecentProject = async (project: RecentProject) => {
    try {
      setLoading(true);
      setError(null);

      setCurrentProject(project.path);
      await projectApi.setCurrentProject(project.path);
      await loadDirectoryTree(project.path);

      // Update recent projects (move to top)
      const updated = await projectApi.addRecentProject(
        project.path,
        project.name,
      );
      setRecentProjects(updated);

      // Start watching for file changes
      await projectApi.watchFileChanges(project.path);

      onProjectOpen?.(project.path);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open recent project",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFile = async () => {
    if (!currentProject) return;

    const fileName = prompt("Enter file name:");
    if (!fileName) return;

    try {
      const filePath = `${currentProject}/${fileName}`;
      await projectApi.createFile(filePath, "// New file\n");
      await loadDirectoryTree(currentProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create file");
    }
  };

  const handleCreateFolder = async () => {
    if (!currentProject) return;

    const folderName = prompt("Enter folder name:");
    if (!folderName) return;

    try {
      const folderPath = `${currentProject}/${folderName}`;
      await projectApi.createFolder(folderPath);
      await loadDirectoryTree(currentProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  const renderDirectoryTree = (node: DirectoryNode, level: number = 0) => {
    const indent = "  ".repeat(level);
    const icon = node.type === "directory" ? "📁" : "📄";

    return (
      <div key={node.path} className="font-mono text-sm">
        <div className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
          {indent}
          {icon} {node.name}
        </div>
        {node.children?.map((child) => renderDirectoryTree(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading project...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Project Manager</h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={handleOpenFolder}
          className="mr-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Open Folder
        </button>

        {currentProject && (
          <>
            <button
              onClick={handleCreateFile}
              className="mr-2 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
            >
              Create File
            </button>
            <button
              onClick={handleCreateFolder}
              className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
            >
              Create Folder
            </button>
          </>
        )}
      </div>

      {currentProject && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Current Project</h2>
          <div className="rounded bg-gray-100 p-3 dark:bg-gray-800">
            <code>{currentProject}</code>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Recent Projects</h2>
          <div className="space-y-2">
            {recentProjects.length === 0 ? (
              <p className="text-gray-500">No recent projects</p>
            ) : (
              recentProjects.map((project) => (
                <div
                  key={project.path}
                  className="cursor-pointer rounded bg-gray-100 p-3 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  onClick={() => handleOpenRecentProject(project)}
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {project.path}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last opened: {new Date(project.lastOpened).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Directory Tree</h2>
          <div className="max-h-96 overflow-y-auto rounded bg-gray-100 p-3 dark:bg-gray-800">
            {directoryTree ? (
              renderDirectoryTree(directoryTree)
            ) : (
              <p className="text-gray-500">No project open</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
