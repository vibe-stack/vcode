import React from 'react';
import { InlineEditorProps } from './types';

export const InlineEditor: React.FC<InlineEditorProps> = ({
    inputRef,
    defaultValue,
    placeholder,
    onKeyDown,
    onBlur
}) => {
    return (
        <input
            ref={inputRef}
            type="text"
            defaultValue={defaultValue}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-background/90 border border-ring rounded px-1 text-sm outline-none 123123"
            placeholder={placeholder}
        />
    );
};
