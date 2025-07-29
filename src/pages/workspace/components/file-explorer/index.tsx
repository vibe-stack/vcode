import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useProjectStore } from '@/stores/project';
import { useGitStore } from '@/stores/git';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { DirectoryNode, projectApi } from '@/services/project-api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Search,
    Plus,
    MoreHorizontal,
    Files,
    GitBranch,
    FileText,
    FolderPlus,
    MessageSquare,
    FileQuestionMarkIcon
} from 'lucide-react';
import { FileTreeNode } from './file-tree-node';
import { GitPanel } from './git-panel';
import { SearchPanel } from './search-panel';
import { AskPanel } from './ask-panel';
import { InlineEditingItem } from './inline-editing-item';
import { useEditorContentStore } from '@/stores/editor-content';
import { createNestedPath, getPathRange, flattenDirectoryTree } from './utils';

export function FileExplorer() {
    const { fileTree, projectName, currentProject, refreshFileTree } = useProjectStore();
    const { isGitRepo } = useGitStore();
    const { openFile: openFileInSplit, startDrag } = useEditorSplitStore();
    const setView = useEditorContentStore((s) => s.setView);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'files' | 'search' | 'ask' | 'git'>('files');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null);
    const [inlineEditingItem, setInlineEditingItem] = useState<{
        path: string;
        type: 'file' | 'folder';
        isNew: boolean;
        parentPath?: string;
    } | null>(null);
    const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
    const [dragExpandTimeout, setDragExpandTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleFileClick = useCallback(async (filePath: string) => {
        try {
            // Use the split store to open the file
            setView('code');
            await openFileInSplit(filePath);
        } catch (error) {
            console.error('Failed to open file:', error);
        }
    }, [openFileInSplit, setView]);

    const handleFileDragStart = useCallback((filePath: string, event: React.DragEvent) => {
        // Set the file path in the data transfer for file moving
        event.dataTransfer.setData('text/plain', filePath);
        event.dataTransfer.effectAllowed = 'move';
        
        // Also notify the split store for editor split drag functionality
        startDrag('file', filePath);
    }, [startDrag]);

    const handleNodeRenamed = useCallback(async (oldPath: string, newPath: string) => {
        // Safely refresh the file tree after rename
        // Use a small delay to ensure the file system operation is complete
        setTimeout(async () => {
            try {
                await refreshFileTree();
            } catch (error) {
                console.error('Failed to refresh file tree after rename:', error);
            }
        }, 50);
    }, [refreshFileTree]);

    const handleNodeDeleted = useCallback(async (path: string) => {
        // Remove from selection if it was selected
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(path);
            return newSet;
        });
        
        // Safely refresh the file tree after deletion
        setTimeout(async () => {
            try {
                await refreshFileTree();
            } catch (error) {
                console.error('Failed to refresh file tree after deletion:', error);
            }
        }, 50);
    }, [refreshFileTree]);

    const handleToggleFolder = useCallback((path: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    }, []);

    // Get flattened list of all visible paths for range selection
    const flattenedPaths = useMemo(() => {
        if (!fileTree) return [];
        return flattenDirectoryTree(fileTree, expandedFolders);
    }, [fileTree, expandedFolders]);

    const handleItemSelect = useCallback((path: string, isSelected: boolean, event?: React.MouseEvent) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            
            if (event?.shiftKey && lastSelectedItem) {
                // Range selection
                const range = getPathRange(flattenedPaths, lastSelectedItem, path);
                range.forEach(p => newSet.add(p));
            } else if (event?.metaKey || event?.ctrlKey) {
                // Multi-selection
                if (isSelected) {
                    newSet.add(path);
                } else {
                    newSet.delete(path);
                }
            } else {
                // Single selection
                newSet.clear();
                if (isSelected) {
                    newSet.add(path);
                }
            }
            
            return newSet;
        });
        
        setLastSelectedItem(path);
    }, [lastSelectedItem, flattenedPaths]);

    const handleCreateInlineItem = useCallback((parentPath: string, type: 'file' | 'folder') => {
        // Ensure the parent folder is expanded if it's a directory
        if (fileTree && parentPath !== fileTree.path) {
            setExpandedFolders(prev => new Set(prev).add(parentPath));
        }
        
        setInlineEditingItem({
            path: `${parentPath}/__new__`,
            type,
            isNew: true,
            parentPath
        });
    }, [fileTree]);

    const handleRenameItem = useCallback((itemPath: string, type: 'file' | 'folder') => {
        setInlineEditingItem({
            path: itemPath,
            type,
            isNew: false,
            parentPath: undefined
        });
    }, []);

    // Listen for keyboard shortcut events from the keymap system
    useEffect(() => {
        const handleCreateFile = () => {
            if (currentProject) {
                handleCreateInlineItem(currentProject, 'file');
            }
        };

        const handleCreateFolder = () => {
            if (currentProject) {
                handleCreateInlineItem(currentProject, 'folder');
            }
        };

        window.addEventListener('explorer:createFile', handleCreateFile);
        window.addEventListener('explorer:createFolder', handleCreateFolder);

        return () => {
            window.removeEventListener('explorer:createFile', handleCreateFile);
            window.removeEventListener('explorer:createFolder', handleCreateFolder);
        };
    }, [currentProject, handleCreateInlineItem]);

    const handleCreateNewFile = useCallback(() => {
        if (currentProject) {
            handleCreateInlineItem(currentProject, 'file');
        }
    }, [currentProject, handleCreateInlineItem]);

    const handleCreateNewFolder = useCallback(() => {
        if (currentProject) {
            handleCreateInlineItem(currentProject, 'folder');
        }
    }, [currentProject, handleCreateInlineItem]);

    const handleInlineEditSubmit = useCallback(async (newName: string, originalPath: string, type: 'file' | 'folder', isNew: boolean) => {
        try {
            if (isNew && inlineEditingItem?.parentPath) {
                // Creating new file/folder
                await createNestedPath(inlineEditingItem.parentPath, newName, type);
            } else {
                // Renaming existing file/folder
                const parentPath = originalPath.substring(0, originalPath.lastIndexOf('/'));
                const newPath = `${parentPath}/${newName}`;
                
                if (type === 'folder') {
                    await projectApi.renameFolder(originalPath, newPath);
                } else {
                    await projectApi.renameFile(originalPath, newPath);
                }
            }
            
            // Safely refresh the file tree after create/rename operation
            setTimeout(async () => {
                try {
                    await refreshFileTree();
                } catch (error) {
                    console.error('Failed to refresh file tree after create/rename:', error);
                }
            }, 50);
        } catch (error) {
            console.error('Failed to create/rename item:', error);
        } finally {
            setInlineEditingItem(null);
        }
    }, [inlineEditingItem, refreshFileTree]);

    const handleInlineEditCancel = useCallback(() => {
        setInlineEditingItem(null);
    }, []);

    // Drag and drop auto-expansion handlers
    const handleDragEnterFolder = useCallback((folderPath: string) => {
        // Clear any existing timeout
        if (dragExpandTimeout) {
            clearTimeout(dragExpandTimeout);
        }
        setDragOverFolder(folderPath);
        // Only set timeout if we're not already expanded
        if (!expandedFolders.has(folderPath)) {
            const timeout = setTimeout(() => {
                // Only expand if still hovered
                setDragExpandTimeout(null);
                setDragOverFolder(current => {
                    if (current === folderPath) {
                        setExpandedFolders(prev => new Set(prev).add(folderPath));
                    }
                    return current;
                });
            }, 1000);
            setDragExpandTimeout(timeout);
        }
    }, [dragExpandTimeout, expandedFolders]);

    const handleDragLeaveFolder = useCallback((folderPath: string) => {
        // Only clear if we're leaving the specific folder we were over
        if (dragOverFolder === folderPath) {
            if (dragExpandTimeout) {
                clearTimeout(dragExpandTimeout);
                setDragExpandTimeout(null);
            }
            setDragOverFolder(null);
        }
    }, [dragExpandTimeout, dragOverFolder]);

    const handleDragEndGlobal = useCallback(() => {
        if (dragExpandTimeout) {
            clearTimeout(dragExpandTimeout);
            setDragExpandTimeout(null);
        }
        setDragOverFolder(null);
    }, [dragExpandTimeout]);

    const handleFileDrop = useCallback(async (draggedFilePath: string, targetFolderPath: string) => {
        try {
            // Don't move if dropping on self or parent
            if (draggedFilePath === targetFolderPath) return;
            
            const fileName = draggedFilePath.split('/').pop()!;
            const newPath = `${targetFolderPath}/${fileName}`;
            
            // Check if target already exists
            if (draggedFilePath === newPath) return;
            
            await projectApi.renameFile(draggedFilePath, newPath);
            
            // Safely refresh the file tree after move
            setTimeout(async () => {
                try {
                    await refreshFileTree();
                } catch (error) {
                    console.error('Failed to refresh file tree after move:', error);
                }
            }, 50);
        } catch (error) {
            console.error('Failed to move file:', error);
        }
    }, [refreshFileTree]);

    // Helper to sort children: folders first (alphabetically), then files (alphabetically)
    const sortChildren = (children: DirectoryNode[]): DirectoryNode[] => {
        return [...children].sort((a, b) => {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name);
            }
            return a.type === 'directory' ? -1 : 1;
        });
    };

    const filteredTree = useCallback((node: DirectoryNode): DirectoryNode | null => {
        if (!searchQuery.trim()) {
            if (node.type === 'directory' && node.children) {
                return {
                    ...node,
                    children: sortChildren(node.children).map(child => filteredTree(child)).filter(Boolean) as DirectoryNode[]
                };
            }
            return node;
        }

        const query = searchQuery.toLowerCase();
        const matchesSearch = node.name.toLowerCase().includes(query);

        if (node.type === 'file') {
            return matchesSearch ? node : null;
        }

        // For directories, check if any children match
        const filteredChildren = node.children?.map(child => filteredTree(child)).filter(Boolean) || [];

        if (matchesSearch || filteredChildren.length > 0) {
            return {
                ...node,
                children: sortChildren(filteredChildren as DirectoryNode[])
            };
        }

        return null;
    }, [searchQuery]);

    if (!fileTree) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No project loaded</p>
            </div>
        );
    }

    const displayTree = filteredTree(fileTree);

    return (
        <div className="h-full flex flex-col border-r">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'files' | 'search' | 'ask' | 'git')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 border-b rounded-none h-10">
                    <TabsTrigger value="files" className="flex items-center gap-2">
                        <Files className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="search" className="flex items-center gap-2">
                        <Search className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="ask" className="flex items-center gap-2">
                        <FileQuestionMarkIcon className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="git" className="flex items-center gap-2" disabled={!isGitRepo}>
                        <GitBranch className="h-3 w-3" />
                    </TabsTrigger>
                </TabsList>

                {/* Files Tab */}
                <TabsContent value="files" className="flex-1 flex flex-col m-0 p-0 overflow-y-auto">
                    {/* Search Header */}
                    <div className="border-b p-3 flex flex-row gap-2">
                        <div className="relative grow">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-7 h-7 text-xs"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                title="Create file"
                                onClick={handleCreateNewFile}
                            >
                                <FileText className="h-3 w-3" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                title="Create folder"
                                onClick={handleCreateNewFolder}
                            >
                                <FolderPlus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* File Tree */}
                    <ScrollArea className="flex-1">
                        <div className="p-1">
                            {displayTree ? (
                                <>
                                    <FileTreeNode
                                        node={displayTree}
                                        level={0}
                                        onFileClick={handleFileClick}
                                        onFileDragStart={handleFileDragStart}
                                        expandedFolders={expandedFolders}
                                        onToggleFolder={handleToggleFolder}
                                        onNodeRenamed={handleNodeRenamed}
                                        onNodeDeleted={handleNodeDeleted}
                                        selectedItems={selectedItems}
                                        onItemSelect={handleItemSelect}
                                        onCreateInlineItem={handleCreateInlineItem}
                                        onRenameItem={handleRenameItem}
                                        inlineEditingItem={inlineEditingItem}
                                        onInlineEditSubmit={handleInlineEditSubmit}
                                        onInlineEditCancel={handleInlineEditCancel}
                                        onDragEnterFolder={handleDragEnterFolder}
                                        onDragLeaveFolder={handleDragLeaveFolder}
                                        onDragEnd={handleDragEndGlobal}
                                        onFileDrop={handleFileDrop}
                                        dragOverFolder={dragOverFolder}
                                    />
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground text-sm">No files found</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* Search Tab */}
                <TabsContent value="search" className="flex-1 flex flex-col m-0 p-0 overflow-y-auto">
                    <SearchPanel />
                </TabsContent>

                {/* Ask Tab */}
                <TabsContent value="ask" className="flex-1 flex flex-col m-0 p-0 overflow-y-auto">
                    <AskPanel />
                </TabsContent>

                {/* Git Tab */}
                <TabsContent value="git" className="flex-1 flex flex-col m-0 p-0 overflow-y-auto">
                    <GitPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
