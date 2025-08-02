import React, { useRef, useEffect, useCallback } from 'react';
import { File, Folder } from 'lucide-react';
import { InlineEditingItem } from './types';
import { Input } from '@/components/ui/input';

interface NewItemCreatorProps {
    inlineEditingItem: InlineEditingItem;
    level: number;
    onInlineEditSubmit?: (newName: string, originalPath: string, type: 'file' | 'folder', isNew: boolean) => Promise<void>;
    onInlineEditCancel?: () => void;
}

export const NewItemCreator: React.FC<NewItemCreatorProps> = ({
    inlineEditingItem,
    level,
    onInlineEditSubmit,
    onInlineEditCancel
}) => {
    const newItemInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const value = (event.target as HTMLInputElement).value.trim();
            if (value && onInlineEditSubmit) {
                onInlineEditSubmit(value, inlineEditingItem.path, inlineEditingItem.type, true);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            if (onInlineEditCancel) {
                onInlineEditCancel();
            }
        }
    }, [inlineEditingItem, onInlineEditSubmit, onInlineEditCancel]);

    const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        // Prevent blur if the related target is within our component tree
        const relatedTarget = event.relatedTarget as HTMLElement;
        if (relatedTarget && (
            relatedTarget.closest('.file-tree-node-container') ||
            relatedTarget.closest('[role="menu"]') ||
            relatedTarget.closest('[data-radix-collection-item]')
        )) {
            return;
        }
        
        const value = event.target.value.trim();
        if (value && onInlineEditSubmit) {
            onInlineEditSubmit(value, inlineEditingItem.path, inlineEditingItem.type, true);
        } else if (onInlineEditCancel) {
            onInlineEditCancel();
        }
    }, [inlineEditingItem, onInlineEditSubmit, onInlineEditCancel]);

    useEffect(() => {
        if (newItemInputRef.current) {
            console.log("applying focus to new item input");
            // Use a longer delay to wait for TabsContent focus management
            setTimeout(() => {
                if (newItemInputRef.current) {
                    newItemInputRef.current.focus();
                    newItemInputRef.current.select();
                    // Check focus state after another small delay
                    setTimeout(() => {
                        if (newItemInputRef.current) {
                            console.log("focused:", newItemInputRef.current.matches(':focus'));
                        }
                    }, 10);
                }
            }, 500);
        }
    }, [])

    console.log("rerendering and showing isfocused", newItemInputRef.current?.matches(':focus'));

    return (
        <div
            className="file-tree-node-container flex items-center gap-1 px-2 py-1 rounded-sm text-sm relative"
            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
        >
            <div className="flex items-center justify-center w-4 h-4">
                {inlineEditingItem.type === 'folder' ? (
                    <Folder className="h-4 w-4 text-emerald-500" />
                ) : (
                    <File className="h-4 w-4 text-muted-foreground" />
                )}
            </div>
            <Input
                ref={newItemInputRef}
                type="text"
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-background/90 border border-ring rounded px-1 text-sm outline-none focus:ring-0 asdf"
                placeholder={inlineEditingItem.type === 'folder' ? 'folder name' : 'file name'}
            />
        </div>
    );
};
