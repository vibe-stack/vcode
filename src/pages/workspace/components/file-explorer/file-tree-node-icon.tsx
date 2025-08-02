import React from 'react';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    Archive,
} from 'lucide-react';
import { FileTreeNodeIconProps } from './types';

export const FileTreeNodeIcon: React.FC<FileTreeNodeIconProps> = ({
    isDirectory,
    isExpanded,
    hasChildren,
    isHidden,
    isLargeFolder,
    isPlaceholder
}) => {
    return (
        <>
            {isDirectory && (
                <div className="flex items-center justify-center w-4 h-4">
                    {hasChildren && !isPlaceholder && (
                        isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                        ) : (
                            <ChevronRight className="h-3 w-3" />
                        )
                    )}
                </div>
            )}

            <div className="flex items-center justify-center w-4 h-4">
                {isPlaceholder ? (
                    <Archive className="h-4 w-4 text-orange-500" />
                ) : isDirectory ? (
                    isLargeFolder ? (
                        <Archive className="h-4 w-4 text-orange-500" />
                    ) : isExpanded ? (
                        <FolderOpen className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <Folder className="h-4 w-4 text-emerald-500" />
                    )
                ) : (
                    <File className={`h-4 w-4 ${isHidden ? 'text-muted-foreground/60' : 'text-muted-foreground'}`} />
                )}
            </div>
        </>
    );
};
