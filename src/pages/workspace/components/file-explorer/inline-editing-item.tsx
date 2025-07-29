import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/utils/tailwind';
import { File, Folder } from 'lucide-react';

interface InlineEditingItemProps {
    level: number;
    type: 'file' | 'folder';
    onSubmit: (value: string) => Promise<void>;
    onCancel: () => void;
}

export function InlineEditingItem({ level, type, onSubmit, onCancel }: InlineEditingItemProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const value = (event.target as HTMLInputElement).value.trim();
            if (value) {
                onSubmit(value);
            } else {
                onCancel();
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
        }
    }, [onSubmit, onCancel]);

    const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        const value = event.target.value.trim();
        if (value) {
            onSubmit(value);
        } else {
            onCancel();
        }
    }, [onSubmit, onCancel]);

    return (
        <div
            className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-sm",
                "text-sm relative"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
            <div className="flex items-center justify-center w-4 h-4">
                {type === 'folder' ? (
                    <Folder className="h-4 w-4 text-emerald-500" />
                ) : (
                    <File className="h-4 w-4 text-muted-foreground" />
                )}
            </div>

            <input
                ref={inputRef}
                type="text"
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="flex-1 bg-background/90 border border-ring rounded px-1 text-sm outline-none"
                placeholder={type === 'folder' ? 'folder name' : 'file name'}
            />
        </div>
    );
}
