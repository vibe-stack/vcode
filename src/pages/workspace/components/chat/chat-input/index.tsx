import React from "react";
import { EditorContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square, Paperclip, X } from "lucide-react";
import { cn } from "@/utils/tailwind";
import { ChatAttachment } from "../types";
import { useChatInput } from "./useChatInput";

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
        <div className="bg-muted h-20 min-h-0 flex-1 animate-pulse resize-none rounded-md border p-3">
          <div className="text-muted-foreground text-xs">Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Attachments preview - moved to top */}
      {attachments.length > 0 && (
        <div className="bg-muted/50 mb-2 rounded-md border p-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="bg-background group flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
              >
                <Paperclip className="h-3 w-3" />
                <span className="max-w-[200px] truncate">
                  {attachment.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-destructive hover:text-destructive-foreground h-3 w-3 p-0 opacity-0 transition-opacity group-hover:opacity-100"
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

      <div className="focus-within:ring-ring relative rounded-md border focus-within:ring-2 focus-within:ring-offset-2">
        <EditorContent
          editor={editor}
          className={cn(
            "max-h-[200px] min-h-[80px] overflow-y-auto p-0 text-xs",
            "prose prose-sm dark:prose-invert max-w-none",
            "[&_.mention]:bg-accent [&_.mention]:text-accent-foreground [&_.mention]:rounded [&_.mention]:px-1 [&_.mention]:py-0.5 [&_.mention]:text-xs",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onKeyDown={handleKeyDown}
        />

        {/* Placeholder */}
        {isEmpty && !isLoading && (
          <div className="text-muted-foreground pointer-events-none absolute top-3 left-3 text-xs">
            {placeholder}
          </div>
        )}
      </div>

      {/* Send button */}
      <div className="absolute right-2 bottom-2 flex items-end">
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
