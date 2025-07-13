import React from 'react';
import { EnhancedChatInput } from './enhanced-chat-input';
import { ChatAttachment } from './types';

// Example usage of the enhanced chat input
export const ChatInputExample: React.FC = () => {
  const handleSend = (content: string, attachments: ChatAttachment[]) => {
    console.log('Message content:', content);
    console.log('Attachments:', attachments);
    
    // Example: Send to AI SDK
    // const message = {
    //   role: 'user',
    //   content,
    //   experimental_attachments: attachments.map(attachment => ({
    //     name: attachment.name,
    //     contentType: getContentType(attachment),
    //     url: attachment.url || `file://${attachment.path}`,
    //     content: attachment.content,
    //   }))
    // };
    // 
    // append(message);
  };

  const handleStop = () => {
    console.log('Stop requested');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Enhanced Chat Input Demo</h2>
      
      <div className="border rounded-lg p-4 bg-background">
        <EnhancedChatInput
          onSend={handleSend}
          onStop={handleStop}
          isLoading={false}
          placeholder="Try typing @filename to mention files..."
        />
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Features:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Type @ followed by filename to mention files</li>
          <li>Files are automatically attached with content</li>
          <li>Enter to send, Shift+Enter for new line</li>
          <li>Rich text editing with Tiptap</li>
        </ul>
      </div>
    </div>
  );
};
