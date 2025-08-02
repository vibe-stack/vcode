import { DirectoryNode } from '@/services/project-api';

export interface FileTreeNodeProps {
    node: DirectoryNode;
    level: number;
    onFileClick: (filePath: string) => void;
    onFileDragStart: (filePath: string, event: React.DragEvent) => void;
    expandedFolders: Set<string>;
    onToggleFolder: (path: string) => void;
    onNodeRenamed?: (oldPath: string, newPath: string) => void;
    onNodeDeleted?: (path: string) => void;
    selectedItems?: Set<string>;
    onItemSelect?: (path: string, isSelected: boolean, event?: React.MouseEvent) => void;
    onCreateInlineItem?: (parentPath: string, type: 'file' | 'folder') => void;
    onRenameItem?: (itemPath: string, type: 'file' | 'folder') => void;
    inlineEditingItem?: InlineEditingItem | null;
    onInlineEditSubmit?: (newName: string, originalPath: string, type: 'file' | 'folder', isNew: boolean) => Promise<void>;
    onInlineEditCancel?: () => void;
    onDragEnterFolder?: (folderPath: string) => void;
    onDragLeaveFolder?: (folderPath: string) => void;
    onDragEnd?: () => void;
    onFileDrop?: (draggedFilePath: string, targetFolderPath: string) => Promise<void>;
    dragOverFolder?: string | null;
}

export interface InlineEditingItem {
    path: string;
    type: 'file' | 'folder';
    isNew: boolean;
    parentPath?: string;
}

export interface NodeContextMenuProps {
    node: DirectoryNode;
    isDirectory: boolean;
    disabled?: boolean;
    onOpen: () => void;
    onOpenInSplit: () => void;
    onRevealInFinder: () => void;
    onCopyPath: () => void;
    onCopyRelativePath: () => void;
    onRename: () => void;
    onCreateFile: () => void;
    onCreateFolder: () => void;
    onDelete: () => void;
    children: React.ReactNode;
}

export interface FileTreeNodeIconProps {
    isDirectory: boolean;
    isExpanded: boolean;
    hasChildren: boolean;
    isHidden?: boolean;
    isLargeFolder?: boolean;
    isPlaceholder?: boolean;
}

export interface GitStatusIndicatorProps {
    gitIcon: string;
    gitColor: string;
    gitTooltip: string;
    isInlineEditing: boolean;
}

export interface InlineEditorProps {
    inputRef: React.RefObject<HTMLInputElement | null>;
    defaultValue: string;
    placeholder: string;
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
}
