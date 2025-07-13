import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Mention } from '@tiptap/extension-mention';
import { Button } from '@/components/ui/button';
import { ArrowUp, Square, Paperclip } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { MentionSuggestion } from './mention-suggestion';
import { mentionProvider } from './mention-provider';
import { chatSerializationService } from './chat-serialization';
import { MentionItem, ChatAttachment } from './types';
import tippy from 'tippy.js';

interface EnhancedChatInputProps {
  onSend: (content: string, attachments: ChatAttachment[]) => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  onSend,
  onStop,
  isLoading,
  placeholder = "Ask me anything about your project...",
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<MentionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

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
          items: ({ query }) => {
            if (query.length < 2) {
              return [];
            }
            return mentionProvider.searchMentions(query, 'file');
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
                return component.onKeyDown(props);
              },
              onExit: () => {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Update attachments when mentions change
      updateAttachmentsFromContent();
    },
  });

  const updateAttachmentsFromContent = useCallback(async () => {
    if (!editor) return;

    const content = editor.getJSON();
    const mentions = chatSerializationService.extractMentions(content);
    const newAttachments = await chatSerializationService.mentionsToAttachments(mentions);
    setAttachments(newAttachments);
  }, [editor]);

  const handleSend = useCallback(() => {
    if (!editor || isLoading) return;

    const content = chatSerializationService.tiptapToPlainText(editor.getJSON());
    if (!content.trim()) return;

    onSend(content, attachments);
    editor.commands.clearContent();
    setAttachments([]);
  }, [editor, isLoading, attachments, onSend]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const isEmpty = !editor?.getText().trim();

  useEffect(() => {
    if (editor && !isLoading) {
      editor.commands.focus();
    }
  }, [editor, isLoading]);

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
            "min-h-[80px] max-h-[200px] overflow-y-auto p-3 text-xs",
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
            onClick={handleSend}
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

// Helper class for mention suggestions
class MentionSuggestionRenderer {
  element: HTMLElement;
  props: any;
  selectedIndex: number = 0;

  constructor(props: any) {
    this.props = props;
    this.element = document.createElement('div');
    this.update();
  }

  update() {
    const items = this.props.items || [];
    
    this.element.innerHTML = '';
    this.element.className = 'mention-suggestions bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto';

    if (items.length === 0) {
      this.element.style.display = 'none';
      return;
    }

    this.element.style.display = 'block';

    items.forEach((item: MentionItem, index: number) => {
      const button = document.createElement('button');
      button.className = `w-full text-left p-2 hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
        index === this.selectedIndex ? 'bg-accent text-accent-foreground' : ''
      }`;
      
      button.innerHTML = `
        <div class="flex-1">
          <div class="font-medium text-sm">${item.label}</div>
          ${item.description ? `<div class="text-xs text-muted-foreground">${item.description}</div>` : ''}
          ${item.path ? `<div class="text-xs text-muted-foreground truncate">${item.path}</div>` : ''}
        </div>
      `;
      
      button.addEventListener('click', () => {
        this.selectItem(index);
      });
      
      this.element.appendChild(button);
    });
  }

  updateProps(props: any) {
    this.props = props;
    this.update();
  }

  onKeyDown({ event }: any) {
    const items = this.props.items || [];
    
    if (event.key === 'ArrowUp') {
      this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
      this.update();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.selectedIndex = (this.selectedIndex + 1) % items.length;
      this.update();
      return true;
    }

    if (event.key === 'Enter') {
      this.selectItem(this.selectedIndex);
      return true;
    }

    return false;
  }

  selectItem(index: number) {
    const items = this.props.items || [];
    const item = items[index];
    
    if (item) {
      this.props.command({
        id: item.id,
        label: item.label,
        type: item.type,
        path: item.path,
      });
    }
  }

  destroy() {
    this.element.remove();
  }
}
