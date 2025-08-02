import { useCallback, useState } from 'react';

interface UseDragAndDropProps {
    isDirectory: boolean;
    isExpanded: boolean;
    isInlineEditing: boolean;
    nodePath: string;
    onToggleFolder: (path: string) => void;
    onFileDragStart: (filePath: string, event: React.DragEvent) => void;
    onDragEnterFolder?: (folderPath: string) => void;
    onDragLeaveFolder?: (folderPath: string) => void;
    onDragEnd?: () => void;
    onFileDrop?: (draggedFilePath: string, targetFolderPath: string) => Promise<void>;
    dragOverFolder?: string | null;
}

export const useDragAndDrop = ({
    isDirectory,
    isExpanded,
    isInlineEditing,
    nodePath,
    onToggleFolder,
    onFileDragStart,
    onDragEnterFolder,
    onDragLeaveFolder,
    onDragEnd,
    onFileDrop,
    dragOverFolder
}: UseDragAndDropProps) => {
    const [dragHoverTimer, setDragHoverTimer] = useState<NodeJS.Timeout | null>(null);
    const isDraggedOver = dragOverFolder === nodePath;

    const handleDragStart = useCallback((event: React.DragEvent) => {
        if (!isDirectory && !isInlineEditing) {
            onFileDragStart(nodePath, event);
        }
    }, [isDirectory, nodePath, onFileDragStart, isInlineEditing]);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        // If this node is a directory, or if it is a file and its parent is a directory, treat the parent as drop target
        if (isDirectory) {
            if (onDragEnterFolder && !isDraggedOver) {
                onDragEnterFolder(nodePath);
            } else if (!onDragEnterFolder && !isExpanded && !dragHoverTimer) {
                // Fallback to old behavior if new system not available
                const timer = setTimeout(() => {
                    onToggleFolder(nodePath);
                    setDragHoverTimer(null);
                }, 1000);
                setDragHoverTimer(timer);
            }
        } else if (onDragEnterFolder && nodePath && nodePath.includes("/")) {
            // For files, treat their parent folder as the drop target
            const parentPath = nodePath.substring(0, nodePath.lastIndexOf("/"));
            if (parentPath) {
                onDragEnterFolder(parentPath);
            }
        }
    }, [isDirectory, isExpanded, dragHoverTimer, onToggleFolder, nodePath, onDragEnterFolder, isDraggedOver]);

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        // Only trigger leave if we're actually leaving this element (not entering a child)
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            if (dragHoverTimer) {
                clearTimeout(dragHoverTimer);
                setDragHoverTimer(null);
            }
            
            if (onDragLeaveFolder) {
                onDragLeaveFolder(nodePath);
            }
        }
    }, [dragHoverTimer, onDragLeaveFolder, nodePath]);

    const handleDrop = useCallback(async (event: React.DragEvent) => {
        event.preventDefault();
        if (dragHoverTimer) {
            clearTimeout(dragHoverTimer);
            setDragHoverTimer(null);
        }
        const draggedFilePath = event.dataTransfer.getData('text/plain');
        // If dropping on a directory, use its path. If dropping on a file, use its parent folder as the drop target.
        let targetFolderPath = nodePath;
        if (!isDirectory && nodePath && nodePath.includes("/")) {
            targetFolderPath = nodePath.substring(0, nodePath.lastIndexOf("/"));
        }
        if (onFileDrop && draggedFilePath && draggedFilePath !== targetFolderPath) {
            await onFileDrop(draggedFilePath, targetFolderPath);
        }
        // Clear drag state
        if (onDragEnd) {
            onDragEnd();
        }
    }, [dragHoverTimer, isDirectory, onFileDrop, nodePath, onDragEnd]);

    return {
        isDraggedOver,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop
    };
};
