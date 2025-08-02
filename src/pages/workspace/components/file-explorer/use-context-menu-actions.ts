import { useCallback } from 'react';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { projectApi } from '@/services/project-api';

interface UseContextMenuActionsProps {
    nodePath: string;
    nodeName: string;
    isDirectory: boolean;
    onFileClick: (filePath: string) => void;
    onNodeDeleted?: (path: string) => void;
    onCreateInlineItem?: (parentPath: string, type: 'file' | 'folder') => void;
    onRenameItem?: (itemPath: string, type: 'file' | 'folder') => void;
}

export const useContextMenuActions = ({
    nodePath,
    nodeName,
    isDirectory,
    onFileClick,
    onNodeDeleted,
    onCreateInlineItem,
    onRenameItem
}: UseContextMenuActionsProps) => {
    const { openFile: openFileInSplit } = useEditorSplitStore();

    const handleOpen = useCallback(() => {
        if (!isDirectory) {
            onFileClick(nodePath);
        }
    }, [isDirectory, nodePath, onFileClick]);

    const handleOpenInSplit = useCallback(async () => {
        if (!isDirectory) {
            await openFileInSplit(nodePath);
        }
    }, [isDirectory, nodePath, openFileInSplit]);

    const handleRevealInFinder = useCallback(() => {
        window.shellApi?.showItemInFolder(nodePath);
    }, [nodePath]);

    const handleCopyPath = useCallback(() => {
        navigator.clipboard.writeText(nodePath);
    }, [nodePath]);

    const handleCopyRelativePath = useCallback(async () => {
        try {
            const projectRoot = await projectApi.getCurrentProject();
            if (projectRoot) {
                const relativePath = nodePath.replace(projectRoot, '').replace(/^\//, '');
                navigator.clipboard.writeText(relativePath);
            } else {
                navigator.clipboard.writeText(nodePath);
            }
        } catch (error) {
            navigator.clipboard.writeText(nodePath);
        }
    }, [nodePath]);

    const handleRename = useCallback(() => {
        if (onRenameItem) {
            onRenameItem(nodePath, isDirectory ? 'folder' : 'file');
        }
    }, [nodePath, isDirectory, onRenameItem]);

    const handleCreateFile = useCallback(() => {
        if (onCreateInlineItem) {
            onCreateInlineItem(nodePath, 'file');
        }
    }, [nodePath, onCreateInlineItem]);

    const handleCreateFolder = useCallback(() => {
        if (onCreateInlineItem) {
            onCreateInlineItem(nodePath, 'folder');
        }
    }, [nodePath, onCreateInlineItem]);

    const handleDelete = useCallback(async () => {
        if (confirm(`Are you sure you want to delete "${nodeName}"?`)) {
            try {
                if (isDirectory) {
                    await projectApi.deleteFolder(nodePath);
                } else {
                    await projectApi.deleteFile(nodePath);
                }
                onNodeDeleted?.(nodePath);
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        }
    }, [nodePath, nodeName, isDirectory, onNodeDeleted]);

    return {
        handleOpen,
        handleOpenInSplit,
        handleRevealInFinder,
        handleCopyPath,
        handleCopyRelativePath,
        handleRename,
        handleCreateFile,
        handleCreateFolder,
        handleDelete
    };
};
