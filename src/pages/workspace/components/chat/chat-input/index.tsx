import React from 'react';
import { EditorContent } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Square, Paperclip, X } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { ChatAttachment } from '../types';
import { useChatInput } from './useChatInput';

interface ChatInputProps {
  onSend: (content: string, attachments: ChatAttachment[]) => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  isNewChat?: boolean; // Flag to indicate if this is a new chat with no input yet
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isLoading,
  placeholder = "Ask me anything about your project... (Shift+Enter to send)",
  disabled = false,
  isNewChat = false,
}) => {
  const {
    editor,
    handleKeyDown,
    isEmpty,
    attachments,
    removeAttachment,
    isSending,
    handleSend,
  } = useChatInput({
    disabled,
    isLoading,
    isNewChat,
    onSend,
  });

  if (!editor) {
    return (
      <div className="relative w-full">
        <div className="flex-1 resize-none min-h-0 h-20 border rounded-md p-3 bg-muted animate-pulse">
          <div className="text-muted-foreground text-xs">Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Attachments preview - moved to top */}
      {attachments.length > 0 && (
        <div className="mb-2 p-2 bg-muted/50 rounded-md border">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-1 px-2 py-1 bg-background rounded-md text-xs border group"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{attachment.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeAttachment(attachment.id)}
                  title="Remove attachment"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <EditorContent
          editor={editor}
          className={cn(
            "min-h-[80px] max-h-[200px] overflow-y-auto p-0 text-xs",
            "prose prose-sm max-w-none dark:prose-invert",
            "[&_.mention]:bg-accent [&_.mention]:text-accent-foreground [&_.mention]:px-1 [&_.mention]:py-0.5 [&_.mention]:rounded [&_.mention]:text-xs",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onKeyDown={handleKeyDown}
        />

        {/* Placeholder */}
        {isEmpty && !isLoading && (
          <div className="absolute top-3 left-3 text-muted-foreground text-xs pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Send button */}
      <div className="absolute bottom-2 right-2 flex items-end gap-1">
        <span className="text-xs text-muted-foreground/60 select-none pointer-events-none">{isLoading ? 'Sending...' : 'Shift+Enter to send'}</span>
        {isLoading ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onStop}
            tabIndex={-1}
            aria-label="Stop"
          >
            <Square className="h-4 w-4 text-red-500" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleSend().catch(console.error)}
            disabled={isEmpty || disabled}
            tabIndex={-1}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

