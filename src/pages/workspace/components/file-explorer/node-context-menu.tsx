import React from 'react';
import {
    File,
    FileText,
    FolderPlus,
    Copy,
    Edit3,
    Trash2,
    FolderSearch,
    SplitSquareHorizontal
} from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { NodeContextMenuProps } from './types';

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
    node,
    isDirectory,
    disabled = false,
    onOpen,
    onOpenInSplit,
    onRevealInFinder,
    onCopyPath,
    onCopyRelativePath,
    onRename,
    onCreateFile,
    onCreateFolder,
    onDelete,
    children
}) => {
    return (
        <ContextMenu>
            <ContextMenuTrigger disabled={disabled}>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent>
                {!isDirectory && (
                    <>
                        <ContextMenuItem onClick={onOpen}>
                            <File className="h-4 w-4 mr-2" />
                            Open
                        </ContextMenuItem>
                        <ContextMenuItem onClick={onOpenInSplit}>
                            <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                            Open in Split
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </>
                )}
                {isDirectory && (
                    <>
                        <ContextMenuItem onClick={onCreateFile}>
                            <FileText className="h-4 w-4 mr-2" />
                            New File
                        </ContextMenuItem>
                        <ContextMenuItem onClick={onCreateFolder}>
                            <FolderPlus className="h-4 w-4 mr-2" />
                            New Folder
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </>
                )}
                <ContextMenuItem onClick={onRevealInFinder}>
                    <FolderSearch className="h-4 w-4 mr-2" />
                    Reveal in Finder
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onCopyPath}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Path
                </ContextMenuItem>
                <ContextMenuItem onClick={onCopyRelativePath}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Relative Path
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onRename}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
