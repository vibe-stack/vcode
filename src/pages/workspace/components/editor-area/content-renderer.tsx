import React from 'react';
import { BufferContent } from '@/stores/buffers';
import { CodeEditor } from './code-editor';
import { ContentViewer } from './content-viewer';
import { MarkdownEditor } from './markdown-editor';

export interface ContentRendererProps {
  /** The buffer to render */
  buffer: BufferContent;
  /** Whether this renderer is focused/active */
  isFocused?: boolean;
  /** Called when content changes (only for code editors) */
  onChange?: (content: string) => void;
  /** Called when renderer gains focus */
  onFocus?: () => void;
}

/**
 * Unified content renderer that chooses between code editor and content viewer
 * based on the buffer type
 */
export function ContentRenderer({ buffer, isFocused = false, onChange, onFocus }: ContentRendererProps) {
  // Use markdown editor for markdown files
  if (buffer.isEditable && buffer.type === 'text' && 
      (buffer.extension === 'md' || buffer.extension === 'markdown')) {
    return (
      <MarkdownEditor
        buffer={buffer}
        isFocused={isFocused}
        onChange={onChange}
        onFocus={onFocus}
      />
    );
  }

  // Use code editor for other text files
  if (buffer.isEditable && buffer.type === 'text') {
    return (
      <CodeEditor
        buffer={buffer}
        isFocused={isFocused}
        onChange={onChange}
        onFocus={onFocus}
      />
    );
  }

  return (
    <ContentViewer
      buffer={buffer}
      isFocused={isFocused}
      onFocus={onFocus}
    />
  );
}
