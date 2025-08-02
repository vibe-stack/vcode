import React, { useCallback, useMemo, useState } from 'react';
import { useFileGitStatus } from '@/hooks/use-file-git-status';
import { getGitStatusColor, getGitStatusIcon, getGitStatusTooltip } from '@/services/git-api';
import { cn } from '@/utils/tailwind';
import { FileTreeNodeProps } from './types';
import { FileTreeNodeIcon } from './file-tree-node-icon';
import { GitStatusIndicator } from './git-status-indicator';
import { InlineEditor } from './inline-editor';
import { NewItemCreator } from './new-item-creator';
import { useDragAndDrop } from './use-drag-and-drop';
import { useContextMenuActions } from './use-context-menu-actions';
import { useInlineEditing } from './use-inline-editing';
import { useNativeContextMenu } from '@/hooks/use-native-context-menu';

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
    const isExpanded = level === 0 || expandedFolders.has(node.path);
    const isDirectory = node.type === 'directory';
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedItems.has(node.path);
    const isInlineEditing = inlineEditingItem?.path === node.path;

    // Use the optimized hook to get git status for only this specific file
    const gitFileStatus = useFileGitStatus(node.path);
    
    // Test comment to trigger git status change - final test

    // Custom hooks for functionality
    const { inputRef, handleInlineInputKeyDown, handleInlineInputBlur } = useInlineEditing({
        isInlineEditing,
        inlineEditingItem,
        onInlineEditSubmit,
        onInlineEditCancel
    });

    const { isDraggedOver, handleDragStart, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop({
        isDirectory,
        isExpanded,
        isInlineEditing,
        nodePath: node.path,
        onToggleFolder,
        onFileDragStart,
        onDragEnterFolder,
        onDragLeaveFolder,
        onDragEnd,
        onFileDrop,
        dragOverFolder
    });

    const contextMenuActions = useContextMenuActions({
        nodePath: node.path,
        nodeName: node.name,
        isDirectory,
        onFileClick,
        onNodeDeleted,
        onCreateInlineItem,
        onRenameItem
    });

    const { showContextMenu } = useNativeContextMenu();

    const handleContextMenu = useCallback(async (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (isInlineEditing || (inlineEditingItem?.isNew && inlineEditingItem.parentPath === node.path)) {
            return;
        }

        const menuItems = [];

        // File items
        if (!isDirectory) {
            menuItems.push(
                { id: 'open', label: 'Open' },
                { id: 'openInSplit', label: 'Open in Split' },
                { id: 'separator1', label: '', type: 'separator' as const }
            );
        }

        // Directory items
        if (isDirectory) {
            menuItems.push(
                { id: 'createFile', label: 'New File' },
                { id: 'createFolder', label: 'New Folder' },
                { id: 'separator2', label: '', type: 'separator' as const }
            );
        }

        // Common items
        menuItems.push(
            { id: 'revealInFinder', label: 'Reveal in Finder' },
            { id: 'separator3', label: '', type: 'separator' as const },
            { id: 'copyPath', label: 'Copy Path' },
            { id: 'copyRelativePath', label: 'Copy Relative Path' },
            { id: 'separator4', label: '', type: 'separator' as const },
            { id: 'rename', label: 'Rename' },
            { id: 'delete', label: 'Delete', enabled: true }
        );

        const selectedAction = await showContextMenu({
            items: menuItems,
            x: event.clientX,
            y: event.clientY
        });

        // Handle the selected action
        switch (selectedAction) {
            case 'open':
                contextMenuActions.handleOpen();
                break;
            case 'openInSplit':
                contextMenuActions.handleOpenInSplit();
                break;
            case 'revealInFinder':
                contextMenuActions.handleRevealInFinder();
                break;
            case 'copyPath':
                contextMenuActions.handleCopyPath();
                break;
            case 'copyRelativePath':
                contextMenuActions.handleCopyRelativePath();
                break;
            case 'rename':
                contextMenuActions.handleRename();
                break;
            case 'createFile':
                contextMenuActions.handleCreateFile();
                break;
            case 'createFolder':
                contextMenuActions.handleCreateFolder();
                break;
            case 'delete':
                contextMenuActions.handleDelete();
                break;
        }
    }, [
        isInlineEditing,
        inlineEditingItem,
        node.path,
        isDirectory,
        showContextMenu,
        contextMenuActions
    ]);

    // Memoize git status display values based on the actual status strings, not the object reference
    const { gitColor, gitIcon, gitTooltip } = useMemo(() => {
        if (!gitFileStatus) {
            return { gitColor: '', gitIcon: '', gitTooltip: '' };
        }
        
        return {
            gitColor: getGitStatusColor(gitFileStatus.workingTreeStatus, gitFileStatus.indexStatus),
            gitIcon: getGitStatusIcon(gitFileStatus.workingTreeStatus, gitFileStatus.indexStatus),
            gitTooltip: getGitStatusTooltip(gitFileStatus.workingTreeStatus, gitFileStatus.indexStatus)
        };
    }, [gitFileStatus?.workingTreeStatus, gitFileStatus?.indexStatus]);

    const handleClick = useCallback((event: React.MouseEvent) => {
        if (isInlineEditing || (inlineEditingItem?.isNew && inlineEditingItem.parentPath === node.path)) {
            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // Don't handle clicks on truncated indicators
        if (node.path.includes('__truncated__')) {
            event.stopPropagation();
            event.preventDefault();
            return;
        }

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
    }, [isDirectory, node.path, onToggleFolder, onFileClick, isSelected, onItemSelect, isInlineEditing, inlineEditingItem]);

    return (
        <div className="file-tree-node-container">
            <div
                className={cn(
                    "flex items-center gap-1 px-2 py-1 cursor-default hover:bg-accent hover:text-accent-foreground rounded-sm group",
                    "text-sm select-none relative",
                    isSelected && "bg-accent/50",
                    isDraggedOver && isDirectory && "bg-accent border-2 border-accent-foreground/25",
                    node.isGitIgnored && "opacity-60", // Make gitignored files/folders semi-transparent
                    node.isHidden && "text-muted-foreground", // Style hidden files differently
                    node.path.includes('__truncated__') && "cursor-default hover:bg-transparent", // Make truncated items non-interactive
                    gitColor
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                draggable={!isDirectory && !isInlineEditing}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                title={gitTooltip}
            >
                <FileTreeNodeIcon 
                    isDirectory={isDirectory}
                    isExpanded={isExpanded}
                    hasChildren={!!hasChildren}
                    isHidden={node.isHidden}
                    isLargeFolder={node.isLargeFolder}
                    isPlaceholder={node.name.includes('more items')}
                />

                {isInlineEditing ? (
                    <InlineEditor
                        inputRef={inputRef}
                        defaultValue={inlineEditingItem?.isNew ? '' : node.name}
                        placeholder={inlineEditingItem?.type === 'folder' ? 'folder name' : 'file name'}
                        onKeyDown={handleInlineInputKeyDown}
                        onBlur={handleInlineInputBlur}
                    />
                ) : (
                    <span className={cn(
                        "flex-1 truncate",
                        node.name.includes('more items') && "text-orange-600 italic font-medium opacity-70"
                    )}>
                        {node.name}
                    </span>
                )}
                
                <GitStatusIndicator
                    gitIcon={gitIcon}
                    gitColor={gitColor}
                    gitTooltip={gitTooltip}
                    isInlineEditing={isInlineEditing}
                />
            </div>

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
                        <NewItemCreator
                            inlineEditingItem={inlineEditingItem}
                            level={level}
                            onInlineEditSubmit={onInlineEditSubmit}
                            onInlineEditCancel={onInlineEditCancel}
                        />
                    )}
                </div>
            )}
        </div>
    );
});