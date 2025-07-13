import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Mention } from '@tiptap/extension-mention';
import { Button } from '@/components/ui/button';
import { ArrowUp, Square, Paperclip } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { mentionProvider } from './mention-provider';
import { chatSerializationService } from './chat-serialization';
import { ChatAttachment } from './types';
import tippy from 'tippy.js';
import { MentionSuggestionRenderer } from './mention-renderer';

interface ChatInputProps {
  onSend: (content: string, attachments: ChatAttachment[]) => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isLoading,
  placeholder = "Ask me anything about your project... (Shift+Enter to send)",
  disabled = false,
}) => {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  // Custom extension to intercept Shift+Enter
  const ShiftEnterSend = Extension.create({
    name: 'shiftEnterSend',
    addKeyboardShortcuts() {
      return {
        'Shift-Enter': () => {
          handleSend().catch(console.error);
          return true;
        },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          char: '@',
          items: ({ query }) => {
            if (query.length < 1) {
              return [];
            }
            // Use synchronous search for Tiptap compatibility
            const result = mentionProvider.searchMentionsSync(query, 'file');
            return result;
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new MentionSuggestionRenderer(props);
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate: (props: any) => {
                component.updateProps(props);
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }
                // Only handle keys if there are actual suggestions
                if (props.items && props.items.length > 0) {
                  return component.onKeyDown(props);
                }
                return false;
              },
              onExit: () => {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
      ShiftEnterSend,
    ],
    content: '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Update attachments when mentions change
      updateAttachmentsFromContent().catch(console.error);
    },
  });

  const updateAttachmentsFromContent = useCallback(async () => {
    if (!editor) return;

    const content = editor.getJSON();

    const mentions = chatSerializationService.extractMentions(content);

    const newAttachments = await chatSerializationService.mentionsToAttachments(mentions);

    setAttachments(newAttachments);
  }, [editor]);

  const handleSend = async () => {
    if (!editor || isLoading) return;

    const content = chatSerializationService.tiptapToPlainText(editor.getJSON());
    if (!content.trim()) return;

    // Get fresh attachments from current editor content
    const editorContent = editor.getJSON();
    const mentions = chatSerializationService.extractMentions(editorContent);
    const currentAttachments = await chatSerializationService.mentionsToAttachments(mentions);

    // ...existing code...

    onSend(content, currentAttachments);
    editor.commands.clearContent();
    setAttachments([]);
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // If mention suggestion handled the event, don't send
    if (event.defaultPrevented) return;
    // Shift+Enter sends the message, Enter alone creates new line
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      handleSend().catch(console.error);
    }
  }

  const isEmpty = !editor?.getText().trim();

  useEffect(() => {
    if (editor && !isLoading) {
      editor.commands.focus();
    }
  }, [editor, isLoading]);

  // Preload file cache for mentions
  useEffect(() => {
    // Trigger initial cache load
    mentionProvider.preloadCache().catch(console.error);
  }, []);

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

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="border-t p-2 bg-muted/50">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-1 px-2 py-1 bg-background rounded-md text-xs"
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{attachment.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Send button */}
      <div className="absolute bottom-2 right-2 flex items-end">
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

