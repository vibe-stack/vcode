import React, { useState, useCallback } from 'react';
import { useProjectStore } from '@/stores/project';
import { useGitStore } from '@/stores/git';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { DirectoryNode } from '@/services/project-api';
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
    FolderPlus
} from 'lucide-react';
import { FileTreeNode } from './file-tree-node';
import { GitPanel } from './git-panel';
import { CreateFilePopover } from './create-file-popover';

export function FileExplorer() {
    const { fileTree, projectName, currentProject } = useProjectStore();
    const { isGitRepo } = useGitStore();
    const { openFile: openFileInSplit, startDrag } = useEditorSplitStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'files' | 'git'>('files');

    const handleFileClick = useCallback(async (filePath: string) => {
        try {
            // Use the split store to open the file
            await openFileInSplit(filePath);
        } catch (error) {
            console.error('Failed to open file:', error);
        }
    }, [openFileInSplit]);

    const handleFileDragStart = useCallback((filePath: string, event: React.DragEvent) => {
        startDrag('file', filePath);
    }, [startDrag]);

    const handleNodeRenamed = useCallback((oldPath: string, newPath: string) => {
        // Handle file/folder rename in the store
        // This might need to refresh the file tree
        console.log('Node renamed:', oldPath, '->', newPath);
    }, []);

    const handleNodeDeleted = useCallback((path: string) => {
        // Handle file/folder deletion in the store
        // This might need to refresh the file tree
        console.log('Node deleted:', path);
    }, []);

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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'files' | 'git')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 border-b rounded-none h-11 px-2 py-1">
                    <TabsTrigger value="files" className="flex items-center gap-1.5 rounded-md data-[state=active]:shadow-sm">
                        <Files className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Files</span>
                    </TabsTrigger>
                    <TabsTrigger value="git" className="flex items-center gap-1.5 rounded-md data-[state=active]:shadow-sm" disabled={!isGitRepo}>
                        <GitBranch className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Git</span>
                    </TabsTrigger>
                </TabsList>

                {/* Files Tab */}
                <TabsContent value="files" className="flex-1 flex flex-col m-0 p-0 overflow-y-auto">
                    {/* Search Header */}
                    <div className="border-b px-3 py-2.5 flex flex-row gap-2 bg-gradient-to-b from-background to-background/80">
                        <div className="relative grow">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 h-8 text-xs rounded-lg"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <CreateFilePopover
                                basePath={currentProject || ''}
                                defaultType="file"
                                trigger={
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" title="Create file">
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                }
                            />
                            <CreateFilePopover
                                basePath={currentProject || ''}
                                defaultType="folder"
                                trigger={
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" title="Create folder">
                                        <FolderPlus className="h-4 w-4" />
                                    </Button>
                                }
                            />
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* File Tree */}
                    <ScrollArea className="flex-1">
                        <div className="p-1">
                            {displayTree ? (
                                <FileTreeNode
                                    node={displayTree}
                                    level={0}
                                    onFileClick={handleFileClick}
                                    onFileDragStart={handleFileDragStart}
                                    expandedFolders={expandedFolders}
                                    onToggleFolder={handleToggleFolder}
                                    onNodeRenamed={handleNodeRenamed}
                                    onNodeDeleted={handleNodeDeleted}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground text-sm">No files found</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* Git Tab */}
                <TabsContent value="git" className="flex-1 flex flex-col m-0 p-0 overflow-y-auto">
                    <GitPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
