import React, { useCallback, useMemo, useState } from "react";
import { DirectoryNode } from "@/services/project-api";
import { useFileGitStatus } from "@/hooks/use-file-git-status";
import {
  getGitStatusColor,
  getGitStatusIcon,
  getGitStatusTooltip,
} from "@/services/git-api";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileText,
  FolderPlus,
  ExternalLink,
  Copy,
  Edit3,
  Trash2,
  FolderSearch,
  SplitSquareHorizontal,
} from "lucide-react";
import { cn } from "@/utils/tailwind";
import { Button } from "@/components/ui/button";
import { CreateFilePopover } from "./create-file-popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useEditorSplitStore } from "@/stores/editor-splits";
import { projectApi } from "@/services/project-api";

interface FileTreeNodeProps {
  node: DirectoryNode;
  level: number;
  onFileClick: (filePath: string) => void;
  onFileDragStart: (filePath: string, event: React.DragEvent) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onNodeRenamed?: (oldPath: string, newPath: string) => void;
  onNodeDeleted?: (path: string) => void;
}

export const FileTreeNode = ({
  node,
  level,
  onFileClick,
  onFileDragStart,
  expandedFolders,
  onToggleFolder,
  onNodeRenamed,
  onNodeDeleted,
}: FileTreeNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState("");
  const isExpanded = expandedFolders.has(node.path);
  const isDirectory = node.type === "directory";
  const hasChildren = node.children && node.children.length > 0;

  const { openFile: openFileInSplit, createSplit } = useEditorSplitStore();

  // Use the new hook to get git status for only this specific file
  const gitFileStatus = useFileGitStatus(node.path);

  // Memoize git status display values
  const { gitColor, gitIcon, gitTooltip } = useMemo(() => {
    if (!gitFileStatus) {
      return { gitColor: "", gitIcon: "", gitTooltip: "" };
    }

    return {
      gitColor: getGitStatusColor(
        gitFileStatus.workingTreeStatus,
        gitFileStatus.indexStatus,
      ),
      gitIcon: getGitStatusIcon(
        gitFileStatus.workingTreeStatus,
        gitFileStatus.indexStatus,
      ),
      gitTooltip: getGitStatusTooltip(
        gitFileStatus.workingTreeStatus,
        gitFileStatus.indexStatus,
      ),
    };
  }, [gitFileStatus]);

  const handleClick = useCallback(() => {
    if (isDirectory) {
      onToggleFolder(node.path);
    } else {
      onFileClick(node.path);
    }
  }, [isDirectory, node.path, onToggleFolder, onFileClick]);

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!isDirectory) {
        onFileDragStart(node.path, event);
      }
    },
    [isDirectory, node.path, onFileDragStart],
  );

  // Context menu handlers
  const handleOpen = useCallback(() => {
    if (!isDirectory) {
      onFileClick(node.path);
    }
  }, [isDirectory, node.path, onFileClick]);

  const handleOpenInSplit = useCallback(async () => {
    if (!isDirectory) {
      // Create a horizontal split and open the file in it
      await openFileInSplit(node.path);
    }
  }, [isDirectory, node.path, openFileInSplit]);

  const handleRevealInFinder = useCallback(() => {
    // Use Electron shell to reveal the file in finder
    window.shellApi?.showItemInFolder(node.path);
  }, [node.path]);

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(node.path);
  }, [node.path]);

  const handleCopyRelativePath = useCallback(async () => {
    // Get the relative path from the project root
    try {
      const projectRoot = await projectApi.getCurrentProject();
      if (projectRoot) {
        const relativePath = node.path
          .replace(projectRoot, "")
          .replace(/^\//, "");
        navigator.clipboard.writeText(relativePath);
      } else {
        navigator.clipboard.writeText(node.path);
      }
    } catch (error) {
      // Fallback to absolute path
      navigator.clipboard.writeText(node.path);
    }
  }, [node.path]);

  const handleRename = useCallback(() => {
    setIsRenaming(true);
    setRenamingValue(node.name);
  }, [node.name]);

  const handleRenameSubmit = useCallback(async () => {
    if (renamingValue.trim() && renamingValue !== node.name) {
      try {
        const parentPath = node.path.substring(0, node.path.lastIndexOf("/"));
        const newPath = `${parentPath}/${renamingValue.trim()}`;

        if (isDirectory) {
          await projectApi.renameFolder(node.path, newPath);
        } else {
          await projectApi.renameFile(node.path, newPath);
        }

        onNodeRenamed?.(node.path, newPath);
      } catch (error) {
        console.error("Failed to rename:", error);
      }
    }
    setIsRenaming(false);
    setRenamingValue("");
  }, [renamingValue, node.name, node.path, isDirectory, onNodeRenamed]);

  const handleRenamingKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleRenameSubmit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setIsRenaming(false);
        setRenamingValue("");
      }
    },
    [handleRenameSubmit],
  );

  const handleDelete = useCallback(async () => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      try {
        if (isDirectory) {
          await projectApi.deleteFolder(node.path);
        } else {
          await projectApi.deleteFile(node.path);
        }
        onNodeDeleted?.(node.path);
      } catch (error) {
        console.error("Failed to delete:", error);
      }
    }
  }, [node.path, node.name, isDirectory, onNodeDeleted]);

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "hover:bg-accent hover:text-accent-foreground group flex cursor-default items-center gap-1 rounded-sm px-2 py-0.5",
              "relative text-sm select-none",
              gitColor,
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            draggable={!isDirectory}
            onDragStart={handleDragStart}
            title={gitTooltip}
          >
            {isDirectory && (
              <div className="flex h-4 w-4 items-center justify-center">
                {hasChildren &&
                  (isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  ))}
              </div>
            )}

            <div className="flex h-4 w-4 items-center justify-center">
              {isDirectory ? (
                isExpanded ? (
                  <FolderOpen className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Folder className="h-3.5 w-3.5 text-emerald-500" />
                )
              ) : (
                <File className="text-muted-foreground h-3.5 w-3.5" />
              )}
            </div>

            {isRenaming ? (
              <input
                type="text"
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onKeyDown={handleRenamingKeyDown}
                onBlur={handleRenameSubmit}
                className="bg-background/50 focus:ring-ring flex-1 rounded border-0 px-1 text-sm outline-0 focus:ring-1"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <span className="flex-1 truncate">{node.name}</span>
            )}

            {/* Git status indicator */}
            {gitIcon && (
              <span
                className={cn("font-mono text-sm", gitColor)}
                title={gitTooltip}
              >
                {gitIcon}
              </span>
            )}

            {/* Action buttons for directories on hover */}
            {isDirectory && isHovered && !isRenaming && (
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <CreateFilePopover
                  basePath={node.path}
                  defaultType="file"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-accent-foreground/10 h-5 w-5 p-0"
                      title="Create file"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                  }
                />
                <CreateFilePopover
                  basePath={node.path}
                  defaultType="folder"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-accent-foreground/10 h-5 w-5 p-0"
                      title="Create folder"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FolderPlus className="h-3 w-3" />
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {!isDirectory && (
            <>
              <ContextMenuItem onClick={handleOpen}>
                <File className="mr-2 h-4 w-4" />
                Open
              </ContextMenuItem>
              <ContextMenuItem onClick={handleOpenInSplit}>
                <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                Open in Split
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={handleRevealInFinder}>
            <FolderSearch className="mr-2 h-4 w-4" />
            Reveal in Finder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleCopyPath}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Path
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyRelativePath}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Relative Path
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleRename}>
            <Edit3 className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isDirectory && isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
              onFileDragStart={onFileDragStart}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onNodeRenamed={onNodeRenamed}
              onNodeDeleted={onNodeDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};
// , (prevProps, nextProps) => {
//     // Custom comparison function to prevent unnecessary re-renders
//     // Only re-render if the node itself or its dependencies have changed
//     return (
//         prevProps.node.path === nextProps.node.path &&
//         prevProps.node.name === nextProps.node.name &&
//         prevProps.node.type === nextProps.node.type &&
//         prevProps.level === nextProps.level &&
//         prevProps.expandedFolders === nextProps.expandedFolders &&
//         prevProps.onFileClick === nextProps.onFileClick &&
//         prevProps.onFileDragStart === nextProps.onFileDragStart &&
//         prevProps.onToggleFolder === nextProps.onToggleFolder &&
//         prevProps.onNodeRenamed === nextProps.onNodeRenamed &&
//         prevProps.onNodeDeleted === nextProps.onNodeDeleted
//     );
// });

// FileTreeNode.displayName = 'FileTreeNode';
