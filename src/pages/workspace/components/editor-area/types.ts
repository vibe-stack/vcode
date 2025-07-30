export interface EditorPaneProps {
  paneId: string;
  className?: string;
}

// Props for MarkdownEditor
export interface MarkdownEditorProps {
  /** The buffer to edit */
  buffer: import('@/stores/buffers').BufferContent;
  /** Whether this editor is focused/active */
  isFocused?: boolean;
  /** Called when content changes */
  onChange?: (content: string) => void;
  /** Called when editor gains focus */
  onFocus?: () => void;
}

// Heading node for outline
export interface HeadingNode {
  id: string;
  level: number;
  text: string;
  position: number;
}

