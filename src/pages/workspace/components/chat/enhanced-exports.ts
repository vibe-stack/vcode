// Enhanced Chat Input System Exports
export { EnhancedChatInput } from './enhanced-chat-input';
export { MentionSuggestion } from './mention-suggestion';
export { AttachmentDisplay } from './attachment-display';
export { mentionProvider } from './mention-provider';
export { chatSerializationService } from './chat-serialization';
export { ChatInputExample } from './chat-input-example';

// Types
export type {
  MentionItem,
  ChatAttachment,
  EnhancedChatMessage,
  TiptapContent,
  SerializedChatData,
} from './types';

// Re-export the main chat panel with enhanced features
export { ChatPanel } from './index';
