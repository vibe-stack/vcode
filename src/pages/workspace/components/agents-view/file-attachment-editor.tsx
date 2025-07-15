import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Mention } from '@tiptap/extension-mention';
import { cn } from '@/utils/tailwind';
import { FileAttachmentItem, convertFileToAttachment } from './file-attachment';
import { TaskAttachment } from '@/stores/kanban/types';
import { FileMentionSuggestion } from './file-mention-suggestion';
import { mentionProvider } from '@/pages/workspace/components/chat/mention-provider';
import { MentionItem } from '@/pages/workspace/components/chat/types';
import tippy from 'tippy.js';

interface FileAttachmentEditorProps {
  value: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

class FileMentionSuggestionRenderer {
  public element: HTMLDivElement;
  private component: FileMentionSuggestion;

  constructor(props: any) {
    this.element = document.createElement('div');
    this.component = new FileMentionSuggestion(props);
    this.element.appendChild(this.component.element);
  }

  updateProps(props: any) {
    this.component.updateProps(props);
  }

  onKeyDown(props: any) {
    return this.component.onKeyDown(props);
  }

  destroy() {
    this.component.destroy();
    this.element.remove();
  }
}

export const FileAttachmentEditor: React.FC<FileAttachmentEditorProps> = ({
  value,
  onChange,
  placeholder = "Type @ to mention files...",
  disabled = false,
}) => {
  const [attachments, setAttachments] = useState<TaskAttachment[]>(value || []);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs',
        },          suggestion: {
            items: ({ query }: { query: string }) => {
              if (query.length < 2) {
                return [];
              }
              return mentionProvider.searchMentionsSync(query, 'file');
            },            render: () => {
              let component: FileMentionSuggestionRenderer;
              let popup: any;

              return {
                onStart: (props: any) => {
                  component = new FileMentionSuggestionRenderer(props);
                  popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                    zIndex: 9999,
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
      updateAttachmentsFromContent();
    },
  });

  const updateAttachmentsFromContent = useCallback(async () => {
    if (!editor) return;

    const content = editor.getJSON();
    const mentions = extractMentions(content);
    const newAttachments = await mentionsToAttachments(mentions);
    setAttachments(newAttachments);
    onChange(newAttachments);
  }, [editor, onChange]);

  const extractMentions = (content: any): MentionItem[] => {
    const mentions: MentionItem[] = [];
    
    const traverse = (node: any) => {
      if (node.type === 'mention') {
        mentions.push(node.attrs);
      }
      if (node.content) {
        node.content.forEach(traverse);
      }
    };
    
    if (content && content.content) {
      content.content.forEach(traverse);
    }
    
    return mentions;
  };

  const mentionsToAttachments = async (mentions: MentionItem[]): Promise<TaskAttachment[]> => {
    const attachments: TaskAttachment[] = [];
    
    for (const mention of mentions) {
      if (mention.id && mention.label) {
        const fileItem: FileAttachmentItem = {
          id: mention.id,
          label: mention.label,
          type: 'file',
          path: mention.path || mention.id,
          description: mention.description,
        };
        
        attachments.push(convertFileToAttachment(fileItem));
      }
    }
    
    return attachments;
  };

  useEffect(() => {
    if (editor && !disabled) {
      editor.commands.focus();
    }
  }, [editor, disabled]);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== attachments) {
      setAttachments(value || []);
      // Optionally update editor content based on attachments
    }
  }, [value, editor, attachments]);

  if (!editor) {
    return (
      <div className="relative w-full">
        <div className="flex-1 resize-none min-h-0 h-16 border rounded-md p-2 bg-muted animate-pulse">
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
            "min-h-[60px] max-h-[120px] overflow-y-auto p-2 text-sm",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              editor.commands.insertContent('<br>');
            }
          }}
        />
        {!editor.getText().trim() && (
          <div className="absolute top-2 left-2 text-muted-foreground text-sm pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
      
      {attachments.length > 0 && (
        <div className="mt-2 space-y-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm"
            >
              <div className="flex-1">
                <div className="font-medium">{attachment.name}</div>
                <div className="text-xs text-muted-foreground">{attachment.path}</div>
              </div>
              <button
                onClick={() => {
                  const newAttachments = attachments.filter(a => a.id !== attachment.id);
                  setAttachments(newAttachments);
                  onChange(newAttachments);
                }}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
