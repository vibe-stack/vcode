import React, { useCallback } from 'react';
import { DirectoryNode } from '@/services/project-api';
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

export function FileTreeNode({
    node,
    level,
    onFileClick,
    onFileDragStart,
    expandedFolders,
    onToggleFolder
}: FileTreeNodeProps) {
    const isExpanded = level === 0 || expandedFolders.has(node.path);
    const isDirectory = node.type === 'directory';
    const hasChildren = node.children && node.children.length > 0;

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
                    "text-sm select-none"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
                draggable={!isDirectory}
                onDragStart={handleDragStart}
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
}
