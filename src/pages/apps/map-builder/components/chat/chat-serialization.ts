import { projectApi } from '@/services/project-api';
import { ChatAttachment, EnhancedChatMessage, TiptapContent, SerializedChatData } from './types';

export class ChatSerializationService {
  private static instance: ChatSerializationService;

  static getInstance(): ChatSerializationService {
    if (!ChatSerializationService.instance) {
      ChatSerializationService.instance = new ChatSerializationService();
    }
    return ChatSerializationService.instance;
  }

  /**
   * Convert Tiptap content to plain text for AI SDK
   */
  tiptapToPlainText(content: TiptapContent): string {
    if (!content) return '';

    if (content.type === 'text') {
      return content.text || '';
    }

    if (content.type === 'mention') {
      const attrs = content.attrs || {};
      return `@${attrs.label || attrs.id}`;
    }

    if (content.content) {
      return content.content.map(child => this.tiptapToPlainText(child)).join('');
    }

    return '';
  }

  /**
   * Extract mentions from Tiptap content
   */
  extractMentions(content: TiptapContent): Array<{ id: string; label: string; type: string }> {
    const mentions: Array<{ id: string; label: string; type: string }> = [];

    const traverse = (node: TiptapContent) => {
      if (node.type === 'mention' && node.attrs) {
        mentions.push({
          id: node.attrs.id,
          label: node.attrs.label,
          type: node.attrs.type || 'file',
        });
      }

      if (node.content) {
        node.content.forEach(traverse);
      }
    };

    traverse(content);
    return mentions;
  }

  /**
   * Convert mentions to attachments
   */
  async mentionsToAttachments(mentions: Array<{ id: string; label: string; type: string }>): Promise<ChatAttachment[]> {
    const attachments: ChatAttachment[] = [];

    for (const mention of mentions) {
      if (mention.type === 'file' && mention.id.startsWith('file-')) {
        const filePath = mention.id.replace('file-', '');
        
        try {
          // Get file content
          const fileResult = await projectApi.openFile(filePath);
          const fileStats = await projectApi.getFileStats(filePath);

          attachments.push({
            id: mention.id,
            type: 'file',
            name: mention.label,
            path: filePath,
            content: fileResult.content,
            size: fileStats.size,
            lastModified: fileStats.lastModified,
          });
        } catch (error) {
          console.error(`Failed to load file ${filePath}:`, error);
          // Still add the attachment reference even if we can't load the content
          attachments.push({
            id: mention.id,
            type: 'file',
            name: mention.label,
            path: filePath,
          });
        }
      } else if (mention.type === 'url') {
        attachments.push({
          id: mention.id,
          type: 'url',
          name: mention.label,
          url: mention.label,
        });
      }
    }

    return attachments;
  }

  /**
   * Convert enhanced message to AI SDK format
   */
  toAISDKMessage(message: EnhancedChatMessage): any {
    const aiMessage: any = {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.timestamp,
    };

    // Add attachments if present
    if (message.attachments && message.attachments.length > 0) {
      aiMessage.experimental_attachments = message.attachments.map(attachment => ({
        name: attachment.name,
        contentType: this.getContentType(attachment),
        url: attachment.url || `file://${attachment.path}`,
        ...(attachment.content && { content: attachment.content }),
      }));
    }

    return aiMessage;
  }

  /**
   * Convert AI SDK message to enhanced format
   */
  fromAISDKMessage(aiMessage: any): EnhancedChatMessage {
    const message: EnhancedChatMessage = {
      id: aiMessage.id,
      role: aiMessage.role,
      content: aiMessage.content,
      timestamp: aiMessage.createdAt || new Date(),
    };

    // Convert attachments if present
    if (aiMessage.experimental_attachments) {
      message.attachments = aiMessage.experimental_attachments.map((attachment: any) => ({
        id: `attachment-${attachment.name}`,
        type: attachment.url?.startsWith('file://') ? 'file' : 'url',
        name: attachment.name,
        url: attachment.url,
        path: attachment.url?.startsWith('file://') ? attachment.url.replace('file://', '') : undefined,
        content: attachment.content,
      }));
    }

    return message;
  }

  /**
   * Serialize chat data for storage
   */
  serialize(messages: EnhancedChatMessage[]): SerializedChatData {
    return {
      messages,
      version: '1.0',
    };
  }

  /**
   * Deserialize chat data from storage
   */
  deserialize(data: SerializedChatData): EnhancedChatMessage[] {
    return data.messages.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }));
  }

  private getContentType(attachment: ChatAttachment): string {
    if (attachment.type === 'url') {
      return 'text/html';
    }

    if (attachment.path) {
      const extension = attachment.path.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        'js': 'application/javascript',
        'jsx': 'application/javascript',
        'ts': 'application/typescript',
        'tsx': 'application/typescript',
        'css': 'text/css',
        'html': 'text/html',
        'json': 'application/json',
        'md': 'text/markdown',
        'txt': 'text/plain',
        'py': 'text/x-python',
        'java': 'text/x-java',
        'cpp': 'text/x-c++',
        'c': 'text/x-c',
        'php': 'text/x-php',
        'rb': 'text/x-ruby',
        'go': 'text/x-go',
        'rs': 'text/x-rust',
        'swift': 'text/x-swift',
        'kt': 'text/x-kotlin',
      };

      return contentTypes[extension || ''] || 'text/plain';
    }

    return 'text/plain';
  }
}

export const chatSerializationService = ChatSerializationService.getInstance();
