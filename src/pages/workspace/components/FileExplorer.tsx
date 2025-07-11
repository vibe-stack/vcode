import React, { useState, useCallback } from 'react';
import { useProjectStore } from '@/stores/project';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { DirectoryNode } from '@/services/project-api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Search,
  Plus,
  MoreHorizontal 
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

function FileTreeNode({ 
  node, 
  level, 
  onFileClick, 
  onFileDragStart, 
  expandedFolders, 
  onToggleFolder 
}: FileTreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path);
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
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
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

export function FileExplorer() {
  const { fileTree, projectName, currentProject } = useProjectStore();
  const { openFile: openFileInBuffer } = useBufferStore();
  const { openFile: openFileInSplit, startDrag } = useEditorSplitStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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
    event.dataTransfer.setData('text/plain', filePath);
    event.dataTransfer.setData('application/x-file-path', filePath);
    event.dataTransfer.effectAllowed = 'move';
  }, [startDrag]);

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

  const filteredTree = useCallback((node: DirectoryNode): DirectoryNode | null => {
    if (!searchQuery.trim()) return node;
    
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
        children: filteredChildren as DirectoryNode[]
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
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium truncate">{projectName || 'Explorer'}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
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
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No files found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
