// Types for enhanced chat input with mentions and attachments

export interface MentionItem {
  id: string;
  label: string;
  type: 'file' | 'url' | 'reference';
  path?: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ChatAttachment {
  id: string;
  type: 'file' | 'url' | 'reference';
  name: string;
  path?: string;
  url?: string;
  content?: string;
  size?: number;
  lastModified?: Date;
}

export interface EnhancedChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  attachments?: ChatAttachment[];
  // Tiptap editor content for editing
  editorContent?: any;
  timestamp: Date;
}

export interface TiptapContent {
  type: string;
  content?: TiptapContent[];
  attrs?: Record<string, any>;
  text?: string;
}

export interface SerializedChatData {
  messages: EnhancedChatMessage[];
  version: string;
}
