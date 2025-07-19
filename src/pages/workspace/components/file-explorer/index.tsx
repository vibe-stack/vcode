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
    FolderPlus,
    MessageSquare,
    FileQuestionMarkIcon
} from 'lucide-react';
import { FileTreeNode } from './file-tree-node';
import { GitPanel } from './git-panel';
import { SearchPanel } from './search-panel';
import { AskPanel } from './ask-panel';
import { CreateFilePopover } from './create-file-popover';
import { useEditorContentStore } from '@/stores/editor-content';

export function FileExplorer() {
    const { fileTree, projectName, currentProject } = useProjectStore();
    const { isGitRepo } = useGitStore();
    const { openFile: openFileInSplit, startDrag } = useEditorSplitStore();
    const setView = useEditorContentStore((s) => s.setView);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'files' | 'search' | 'ask' | 'git'>('files');

    const handleFileClick = useCallback(async (filePath: string) => {
        try {
            // Use the split store to open the file
            setView('code');
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'files' | 'search' | 'ask' | 'git')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 border-b rounded-none h-10">
                    <TabsTrigger value="files" className="flex items-center gap-2">
                        <Files className="h-3 w-3" />
                        Files
                    </TabsTrigger>
                    <TabsTrigger value="search" className="flex items-center gap-2">
                        <Search className="h-3 w-3" />
                        Search
                    </TabsTrigger>
                    <TabsTrigger value="ask" className="flex items-center gap-2">
                        <FileQuestionMarkIcon className="h-3 w-3" />
                        Ask
                    </TabsTrigger>
                    <TabsTrigger value="git" className="flex items-center gap-2" disabled={!isGitRepo}>
                        <GitBranch className="h-3 w-3" />
                        Git
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
                            <CreateFilePopover
                                basePath={currentProject || ''}
                                defaultType="file"
                                trigger={
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Create file">
                                        <FileText className="h-3 w-3" />
                                    </Button>
                                }
                            />
                            <CreateFilePopover
                                basePath={currentProject || ''}
                                defaultType="folder"
                                trigger={
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Create folder">
                                        <FolderPlus className="h-3 w-3" />
                                    </Button>
                                }
                            />
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
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
