import { useCallback, useEffect, useRef } from 'react';
import { InlineEditingItem } from './types';

interface UseInlineEditingProps {
    isInlineEditing: boolean;
    inlineEditingItem: InlineEditingItem | null | undefined;
    onInlineEditSubmit?: (newName: string, originalPath: string, type: 'file' | 'folder', isNew: boolean) => Promise<void>;
    onInlineEditCancel?: () => void;
}

export const useInlineEditing = ({
    isInlineEditing,
    inlineEditingItem,
    onInlineEditSubmit,
    onInlineEditCancel
}: UseInlineEditingProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInlineInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const inputValue = (event.target as HTMLInputElement).value.trim();
            if (inputValue && onInlineEditSubmit && inlineEditingItem) {
                onInlineEditSubmit(inputValue, inlineEditingItem.path, inlineEditingItem.type, inlineEditingItem.isNew);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            if (onInlineEditCancel) {
                onInlineEditCancel();
            }
        }
    }, [onInlineEditSubmit, onInlineEditCancel, inlineEditingItem]);

    const handleInlineInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        // Prevent blur if the related target is within our component tree
        const relatedTarget = event.relatedTarget as HTMLElement;
        if (relatedTarget && (
            relatedTarget.closest('.file-tree-node-container') ||
            relatedTarget.closest('[role="menu"]') ||
            relatedTarget.closest('[data-radix-collection-item]')
        )) {
            return;
        }
        
        const inputValue = event.target.value.trim();
        if (inputValue && onInlineEditSubmit && inlineEditingItem) {
            onInlineEditSubmit(inputValue, inlineEditingItem.path, inlineEditingItem.type, inlineEditingItem.isNew);
        } else if (onInlineEditCancel) {
            onInlineEditCancel();
        }
    }, [onInlineEditSubmit, onInlineEditCancel, inlineEditingItem]);

    return {
        inputRef,
        handleInlineInputKeyDown,
        handleInlineInputBlur
    };
};
