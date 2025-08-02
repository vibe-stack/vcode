import React from 'react';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
} from 'lucide-react';
import { FileTreeNodeIconProps } from './types';

export const FileTreeNodeIcon: React.FC<FileTreeNodeIconProps> = ({
    isDirectory,
    isExpanded,
    hasChildren
}) => {
    return (
        <>
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
        </>
    );
};
