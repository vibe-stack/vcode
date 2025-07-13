import React, { useCallback, useMemo } from 'react';
import { DirectoryNode } from '@/services/project-api';
import { useFileGitStatus } from '@/hooks/use-file-git-status';
import { getGitStatusColor, getGitStatusIcon, getGitStatusTooltip } from '@/services/git-api';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen
} from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface FileTreeNodeProps {
    node: DirectoryNode;
    level: number;
    onFileClick: (filePath: string) => void;
    onFileDragStart: (filePath: string, event: React.DragEvent) => void;
    expandedFolders: Set<string>;
    onToggleFolder: (path: string) => void;
}

export const FileTreeNode = React.memo<FileTreeNodeProps>(({
    node,
    level,
    onFileClick,
    onFileDragStart,
    expandedFolders,
    onToggleFolder
}) => {
    const isExpanded = level === 0 || expandedFolders.has(node.path);
    const isDirectory = node.type === 'directory';
    const hasChildren = node.children && node.children.length > 0;

    // Use the new hook to get git status for only this specific file
    const gitFileStatus = useFileGitStatus(node.path);

    // Memoize git status display values
    const { gitColor, gitIcon, gitTooltip } = useMemo(() => {
        if (!gitFileStatus) {
            return { gitColor: '', gitIcon: '', gitTooltip: '' };
        }
        
        return {
            gitColor: getGitStatusColor(gitFileStatus.workingTreeStatus, gitFileStatus.indexStatus),
            gitIcon: getGitStatusIcon(gitFileStatus.workingTreeStatus, gitFileStatus.indexStatus),
            gitTooltip: getGitStatusTooltip(gitFileStatus.workingTreeStatus, gitFileStatus.indexStatus)
        };
    }, [gitFileStatus]);

    const handleClick = useCallback(() => {
        if (isDirectory) {
            onToggleFolder(node.path);
        } else {
            onFileClick(node.path);
        }
    }, [isDirectory, node.path, onToggleFolder, onFileClick]);

    const handleDragStart = useCallback((event: React.DragEvent) => {
        if (!isDirectory) {
            onFileDragStart(node.path, event);
        }
    }, [isDirectory, node.path, onFileDragStart]);

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm",
                    "text-sm select-none",
                    gitColor
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
                draggable={!isDirectory}
                onDragStart={handleDragStart}
                title={gitTooltip}
            >
                {isDirectory && (
                    <div className="flex items-center justify-center w-4 h-4">
                        {hasChildren && (
                            isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )
                        )}
                    </div>
                )}

                <div className="flex items-center justify-center w-4 h-4">
                    {isDirectory ? (
                        isExpanded ? (
                            <FolderOpen className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <Folder className="h-4 w-4 text-emerald-500" />
                        )
                    ) : (
                        <File className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>

                <span className="flex-1 truncate">{node.name}</span>
                
                {/* Git status indicator */}
                {gitIcon && (
                    <span className={cn("text-xs font-mono", gitColor)} title={gitTooltip}>
                        {gitIcon}
                    </span>
                )}
            </div>

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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if the node itself or its dependencies have changed
    return (
        prevProps.node.path === nextProps.node.path &&
        prevProps.node.name === nextProps.node.name &&
        prevProps.node.type === nextProps.node.type &&
        prevProps.level === nextProps.level &&
        prevProps.expandedFolders === nextProps.expandedFolders &&
        prevProps.onFileClick === nextProps.onFileClick &&
        prevProps.onFileDragStart === nextProps.onFileDragStart &&
        prevProps.onToggleFolder === nextProps.onToggleFolder
    );
});

FileTreeNode.displayName = 'FileTreeNode';
