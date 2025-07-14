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
  role: 'user' | 'assistant';
  parts: any[]; // Keep it flexible to accommodate AI SDK's various part types
  timestamp: Date;
  createdAt?: Date;
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

export interface ChatSession {
  id: string;
  title: string;
  messages: EnhancedChatMessage[];
  projectPath: string;
  createdAt: Date;
  lastModified: Date;
}
