import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { DirectoryNode } from '@/services/project-api';
import { useFileGitStatus } from '@/hooks/use-file-git-status';
import { getGitStatusColor, getGitStatusIcon, getGitStatusTooltip } from '@/services/git-api';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    FileText,
    FolderPlus, Copy,
    Edit3,
    Trash2,
    FolderSearch,
    SplitSquareHorizontal
} from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { Button } from '@/components/ui/button';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { projectApi } from '@/services/project-api';

interface FileTreeNodeProps {
    node: DirectoryNode;
    level: number;
    onFileClick: (filePath: string) => void;
    onFileDragStart: (filePath: string, event: React.DragEvent) => void;
    expandedFolders: Set<string>;
    onToggleFolder: (path: string) => void;
    onNodeRenamed?: (oldPath: string, newPath: string) => void;
    onNodeDeleted?: (path: string) => void;
    selectedItems?: Set<string>;
    onItemSelect?: (path: string, isSelected: boolean, event?: React.MouseEvent) => void;
    onCreateInlineItem?: (parentPath: string, type: 'file' | 'folder') => void;
    onRenameItem?: (itemPath: string, type: 'file' | 'folder') => void;
    inlineEditingItem?: { path: string; type: 'file' | 'folder'; isNew: boolean; parentPath?: string } | null;
    onInlineEditSubmit?: (newName: string, originalPath: string, type: 'file' | 'folder', isNew: boolean) => Promise<void>;
    onInlineEditCancel?: () => void;
    onDragEnterFolder?: (folderPath: string) => void;
    onDragLeaveFolder?: (folderPath: string) => void;
    onDragEnd?: () => void;
    onFileDrop?: (draggedFilePath: string, targetFolderPath: string) => Promise<void>;
    dragOverFolder?: string | null;
}

export const FileTreeNode = (({
    node,
    level,
    onFileClick,
    onFileDragStart,
    expandedFolders,
    onToggleFolder,
    onNodeRenamed,
    onNodeDeleted,
    selectedItems = new Set(),
    onItemSelect,
    onCreateInlineItem,
    onRenameItem,
    inlineEditingItem,
    onInlineEditSubmit,
    onInlineEditCancel,
    onDragEnterFolder,
    onDragLeaveFolder,
    onDragEnd,
    onFileDrop,
    dragOverFolder,
}: FileTreeNodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [dragHoverTimer, setDragHoverTimer] = useState<NodeJS.Timeout | null>(null);
    const isExpanded = level === 0 || expandedFolders.has(node.path);
    const isDirectory = node.type === 'directory';
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedItems.has(node.path);
    const isInlineEditing = inlineEditingItem?.path === node.path;
    const isDraggedOver = dragOverFolder === node.path;
    const inputRef = useRef<HTMLInputElement>(null);

    const { openFile: openFileInSplit, createSplit } = useEditorSplitStore();

    // Use the new hook to get git status for only this specific file
    const gitFileStatus = useFileGitStatus(node.path);

    // Focus input when entering inline editing mode
    useEffect(() => {
        if (isInlineEditing && inputRef.current) {
            inputRef.current.focus();
            // If it's a rename operation, select all text
            if (!inlineEditingItem?.isNew) {
                inputRef.current.select();
            }
        }
    }, [isInlineEditing, inlineEditingItem?.isNew]);

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

    const handleClick = useCallback((event: React.MouseEvent) => {
        if (isInlineEditing) return;

        if (onItemSelect) {
            // Handle multi-selection
            if (event.metaKey || event.ctrlKey) {
                // Cmd/Ctrl + click for multi-select
                onItemSelect(node.path, !isSelected, event);
            } else if (event.shiftKey) {
                // Shift + click for range selection
                onItemSelect(node.path, true, event);
            } else {
                // Regular click - clear selection and select this item
                onItemSelect(node.path, true, event);
            }
        }

        if (isDirectory) {
            onToggleFolder(node.path);
        } else if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
            onFileClick(node.path);
        }
    }, [isDirectory, node.path, onToggleFolder, onFileClick, isSelected, onItemSelect, isInlineEditing]);

    const handleDragStart = useCallback((event: React.DragEvent) => {
        if (!isDirectory && !isInlineEditing) {
            onFileDragStart(node.path, event);
        }
    }, [isDirectory, node.path, onFileDragStart, isInlineEditing]);

    // Allow dropping on any item in a folder (not just the folder row)
    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        // If this node is a directory, or if it is a file and its parent is a directory, treat the parent as drop target
        if (isDirectory) {
            if (onDragEnterFolder && !isDraggedOver) {
                onDragEnterFolder(node.path);
            } else if (!onDragEnterFolder && !isExpanded && !dragHoverTimer) {
                // Fallback to old behavior if new system not available
                const timer = setTimeout(() => {
                    onToggleFolder(node.path);
                    setDragHoverTimer(null);
                }, 1000);
                setDragHoverTimer(timer);
            }
        } else if (onDragEnterFolder && node.path && node.path.includes("/")) {
            // For files, treat their parent folder as the drop target
            const parentPath = node.path.substring(0, node.path.lastIndexOf("/"));
            if (parentPath) {
                onDragEnterFolder(parentPath);
            }
        }
    }, [isDirectory, isExpanded, dragHoverTimer, onToggleFolder, node.path, onDragEnterFolder, isDraggedOver]);

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        // Only trigger leave if we're actually leaving this element (not entering a child)
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            if (dragHoverTimer) {
                clearTimeout(dragHoverTimer);
                setDragHoverTimer(null);
            }
            
            if (onDragLeaveFolder) {
                onDragLeaveFolder(node.path);
            }
        }
    }, [dragHoverTimer, onDragLeaveFolder, node.path]);

    const handleDrop = useCallback(async (event: React.DragEvent) => {
        event.preventDefault();
        if (dragHoverTimer) {
            clearTimeout(dragHoverTimer);
            setDragHoverTimer(null);
        }
        const draggedFilePath = event.dataTransfer.getData('text/plain');
        // If dropping on a directory, use its path. If dropping on a file, use its parent folder as the drop target.
        let targetFolderPath = node.path;
        if (!isDirectory && node.path && node.path.includes("/")) {
            targetFolderPath = node.path.substring(0, node.path.lastIndexOf("/"));
        }
        if (onFileDrop && draggedFilePath && draggedFilePath !== targetFolderPath) {
            await onFileDrop(draggedFilePath, targetFolderPath);
        }
        // Clear drag state
        if (onDragEnd) {
            onDragEnd();
        }
    }, [dragHoverTimer, isDirectory, onFileDrop, node.path, onDragEnd]);

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
                const relativePath = node.path.replace(projectRoot, '').replace(/^\//, '');
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
        if (onRenameItem) {
            onRenameItem(node.path, isDirectory ? 'folder' : 'file');
        }
    }, [node.path, isDirectory, onRenameItem]);

    const handleCreateFile = useCallback(() => {
        if (onCreateInlineItem) {
            onCreateInlineItem(node.path, 'file');
        }
    }, [node.path, onCreateInlineItem]);

    const handleCreateFolder = useCallback(() => {
        if (onCreateInlineItem) {
            onCreateInlineItem(node.path, 'folder');
        }
    }, [node.path, onCreateInlineItem]);

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
                console.error('Failed to delete:', error);
            }
        }
    }, [node.path, node.name, isDirectory, onNodeDeleted]);

    const handleInlineInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const inputValue = (event.target as HTMLInputElement).value.trim();
            if (inputValue && onInlineEditSubmit && inlineEditingItem) {
                onInlineEditSubmit(inputValue, inlineEditingItem.path, inlineEditingItem.type, inlineEditingItem.isNew);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            if (onInlineEditCancel) {
                onInlineEditCancel();
            }
        }
    }, [onInlineEditSubmit, onInlineEditCancel, inlineEditingItem]);

    const handleInlineInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        const inputValue = event.target.value.trim();
        if (inputValue && onInlineEditSubmit && inlineEditingItem) {
            onInlineEditSubmit(inputValue, inlineEditingItem.path, inlineEditingItem.type, inlineEditingItem.isNew);
        } else if (onInlineEditCancel) {
            onInlineEditCancel();
        }
    }, [onInlineEditSubmit, onInlineEditCancel, inlineEditingItem]);

    return (
        <div>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 cursor-default hover:bg-accent hover:text-accent-foreground rounded-sm group",
                            "text-sm select-none relative",
                            isSelected && "bg-accent/50",
                            isDraggedOver && isDirectory && "bg-accent border-2 border-accent-foreground/25",
                            gitColor
                        )}
                        style={{ paddingLeft: `${level * 12 + 8}px` }}
                        onClick={handleClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        draggable={!isDirectory && !isInlineEditing}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
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

                        {isInlineEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                defaultValue={inlineEditingItem?.isNew ? '' : node.name}
                                onKeyDown={handleInlineInputKeyDown}
                                onBlur={handleInlineInputBlur}
                                className="flex-1 bg-background/90 border border-ring rounded px-1 text-sm outline-none"
                                placeholder={inlineEditingItem?.type === 'folder' ? 'folder name' : 'file name'}
                            />
                        ) : (
                            <span className="flex-1 truncate">{node.name}</span>
                        )}
                        
                        {/* Git status indicator */}
                        {gitIcon && !isInlineEditing && (
                            <span className={cn("text-xs font-mono", gitColor)} title={gitTooltip}>
                                {gitIcon}
                            </span>
                        )}
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {!isDirectory && (
                        <>
                            <ContextMenuItem onClick={handleOpen}>
                                <File className="h-4 w-4 mr-2" />
                                Open
                            </ContextMenuItem>
                            <ContextMenuItem onClick={handleOpenInSplit}>
                                <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                                Open in Split
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                        </>
                    )}
                    {isDirectory && (
                        <>
                            <ContextMenuItem onClick={handleCreateFile}>
                                <FileText className="h-4 w-4 mr-2" />
                                New File
                            </ContextMenuItem>
                            <ContextMenuItem onClick={handleCreateFolder}>
                                <FolderPlus className="h-4 w-4 mr-2" />
                                New Folder
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                        </>
                    )}
                    <ContextMenuItem onClick={handleRevealInFinder}>
                        <FolderSearch className="h-4 w-4 mr-2" />
                        Reveal in Finder
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={handleCopyPath}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Path
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleCopyRelativePath}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Relative Path
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={handleRename}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {isDirectory && isExpanded && (
                <div>
                    {hasChildren && node.children!.map((child) => (
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
                            selectedItems={selectedItems}
                            onItemSelect={onItemSelect}
                            onCreateInlineItem={onCreateInlineItem}
                            onRenameItem={onRenameItem}
                            inlineEditingItem={inlineEditingItem}
                            onInlineEditSubmit={onInlineEditSubmit}
                            onInlineEditCancel={onInlineEditCancel}
                            onDragEnterFolder={onDragEnterFolder}
                            onDragLeaveFolder={onDragLeaveFolder}
                            onDragEnd={onDragEnd}
                            onFileDrop={onFileDrop}
                            dragOverFolder={dragOverFolder}
                        />
                    ))}
                    {/* Show inline editing item if it's being created in this directory */}
                    {inlineEditingItem?.isNew && inlineEditingItem.parentPath === node.path && (
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded-sm text-sm relative"
                            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
                        >
                            <div className="flex items-center justify-center w-4 h-4">
                                {inlineEditingItem.type === 'folder' ? (
                                    <Folder className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <File className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                            <input
                                type="text"
                                ref={(el) => {
                                    if (el && !el.value) {
                                        el.focus();
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        const value = (event.target as HTMLInputElement).value.trim();
                                        if (value && onInlineEditSubmit) {
                                            onInlineEditSubmit(value, inlineEditingItem.path, inlineEditingItem.type, true);
                                        }
                                    } else if (event.key === 'Escape') {
                                        event.preventDefault();
                                        if (onInlineEditCancel) {
                                            onInlineEditCancel();
                                        }
                                    }
                                }}
                                onBlur={(event) => {
                                    const value = event.target.value.trim();
                                    if (value && onInlineEditSubmit) {
                                        onInlineEditSubmit(value, inlineEditingItem.path, inlineEditingItem.type, true);
                                    } else if (onInlineEditCancel) {
                                        onInlineEditCancel();
                                    }
                                }}
                                className="flex-1 bg-background/90 border border-ring rounded px-1 text-sm outline-none"
                                placeholder={inlineEditingItem.type === 'folder' ? 'folder name' : 'file name'}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});