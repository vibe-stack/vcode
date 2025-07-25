import React from 'react';
import { BufferContent } from '@/stores/buffers';
import { CodeEditor } from './code-editor';
import { ContentViewer } from './content-viewer';

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
  // Use code editor for text files, content viewer for everything else
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
