import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Mention } from '@tiptap/extension-mention';
import { Button } from '@/components/ui/button';
import { ArrowUp, Square, Paperclip, X, Hash, AtSign, Image, Slash } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { mentionProvider } from './mention-provider';
import { chatSerializationService } from './chat-serialization';
import { ChatAttachment } from './types';
import tippy from 'tippy.js';
import { MentionSuggestionRenderer } from './mention-renderer';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { slashCommandProvider } from './slash-commands';
import { SlashCommandSuggestionRenderer } from './slash-command-renderer';
import { useSettingsStore } from '@/stores/settings';
import { getAccentGlowStyle } from '@/utils/accent-colors';

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
  placeholder = "Ask me anything about your project...",
  disabled = false,
  isNewChat = false,
}) => {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const attachmentsRef = React.useRef<ChatAttachment[]>([]);
  // Always keep ref in sync
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  const [hasUserInput, setHasUserInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const sendingRef = React.useRef(false); // Ref to track sending state

  // Store references
  const buffers = useBufferStore(state => state.buffers);
  const tabOrder = useBufferStore(state => state.tabOrder);
  const { settings } = useSettingsStore();
  const accentColor = settings.appearance?.accentColor || 'blue';
  const useGradient = settings.appearance?.accentGradient ?? true;
  const getAllPanes = useEditorSplitStore(state => state.getAllPanes);

  // Custom extension to intercept Enter for send
  const EnterSend = Extension.create({
    name: 'enterSend',
    addKeyboardShortcuts() {
      return {
        'Enter': ({ editor }) => {
          // Check if shift is pressed - if so, let default behavior happen (new line)
          const event = editor.view.dom.ownerDocument.defaultView?.event;
          if (event && 'shiftKey' in event && event.shiftKey) {
            return false; // Let default behavior happen
          }
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
            // Show all files when @ is typed with no query
            // Use synchronous search for Tiptap compatibility
            const result = mentionProvider.searchMentionsSync(query || '', 'file');
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
      Mention.extend({
        name: 'slashCommand',
      }).configure({
        HTMLAttributes: {
          class: 'slash-command',
        },
        suggestion: {
          char: '/',
          items: ({ query }) => {
            return slashCommandProvider.searchCommands(query);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new SlashCommandSuggestionRenderer(props);
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
          command: ({ editor, range, props }) => {
            const commandText = slashCommandProvider.executeCommand(props.id);
            
            // Delete the slash command mention
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent(commandText)
              .run();
          },
        },
      }),
      EnterSend,
    ],
    content: '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Update attachments when mentions change (but don't mark as user input yet)
      updateAttachmentsFromContent().catch(console.error);
    },
    onFocus: () => {
      setIsFocused(true);
    },
    onBlur: () => {
      setIsFocused(false);
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file);
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Helper to compute buffer attachments from current buffers and panes
  const computeAutoBufferAttachments = () => {
    let bufferAttachmentMap = new Map();
    const allPanes = getAllPanes();
    for (const pane of allPanes) {
      if (pane.activeBufferId) {
        const buffer = buffers.get(pane.activeBufferId);
        if (buffer && buffer.filePath && typeof buffer.content === 'string') {
          bufferAttachmentMap.set(buffer.filePath, {
            id: `buffer-${buffer.id}`,
            type: 'file',
            name: buffer.name,
            path: buffer.filePath,
            content: buffer.content,
            size: buffer.fileSize,
            lastModified: buffer.lastModified,
          });
        }
      } else if (pane.bufferIds.length > 0) {
        const lastBufferId = pane.bufferIds[pane.bufferIds.length - 1];
        const buffer = buffers.get(lastBufferId);
        if (buffer && buffer.filePath && typeof buffer.content === 'string') {
          bufferAttachmentMap.set(buffer.filePath, {
            id: `buffer-${buffer.id}`,
            type: 'file',
            name: buffer.name,
            path: buffer.filePath,
            content: buffer.content,
            size: buffer.fileSize,
            lastModified: buffer.lastModified,
          });
        }
      }
    }
    // Add up to 2 recent buffers from tabOrder if not already present
    if (bufferAttachmentMap.size < 2 && tabOrder.length > 0) {
      for (const bufferId of tabOrder.slice(-2)) {
        const buffer = buffers.get(bufferId);
        if (buffer && buffer.filePath && typeof buffer.content === 'string') {
          if (!bufferAttachmentMap.has(buffer.filePath)) {
            bufferAttachmentMap.set(buffer.filePath, {
              id: `buffer-${buffer.id}`,
              type: 'file',
              name: buffer.name,
              path: buffer.filePath,
              content: buffer.content,
              size: buffer.fileSize,
              lastModified: buffer.lastModified,
            });
          }
        }
      }
    }
    return Array.from(bufferAttachmentMap.values());
  };

  const updateAttachmentsFromContent = async () => {
    if (!editor || isSending || sendingRef.current) return;
    const content = editor.getJSON();
    const mentions = chatSerializationService.extractMentions(content);
    const mentionAttachments = await chatSerializationService.mentionsToAttachments(mentions);

    // Always recompute buffer attachments for UI
    const autoBufferAttachments = computeAutoBufferAttachments().filter(att =>
      !mentionAttachments.some(ma => ma.id === att.id)
    );

    setAttachments([...autoBufferAttachments, ...mentionAttachments]);
  }

  const handleSend = async () => {
    if (!editor || isLoading || isSending || sendingRef.current) return;
    sendingRef.current = true; // Set sending state to prevent re-entrance

    const content = chatSerializationService.tiptapToPlainText(editor.getJSON());
    if (!content.trim()) return;

    setIsSending(true);

    // Always use the latest attachments from ref
    const currentAttachments = attachmentsRef.current;

    editor.commands.clearContent();
    setHasUserInput(true);

    onSend(content, currentAttachments);

    setIsSending(false);
    sendingRef.current = false; // Reset sending state
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // If mention suggestion handled the event, don't send
    if (event.defaultPrevented) return;

    // Mark user input on first real keystroke (not just focus)
    if (!hasUserInput && event.key.length === 1) {
      setHasUserInput(true);
    }

    // Enter sends the message, Shift+Enter creates new line
    if (event.key === 'Enter' && !event.shiftKey) {
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

  // Auto-add active buffer as attachment for new chats
  useEffect(() => {
    if (!isNewChat) {
      return;
    }

    const addActiveBuffersAsAttachments = async () => {
      // Add a small delay to ensure panes are properly initialized
      await new Promise(resolve => setTimeout(resolve, 100));

      const allPanes = getAllPanes();

      const activeBuffers: ChatAttachment[] = [];

      // Strategy 1: Get buffers from panes that have active buffers
      for (const pane of allPanes) {
        if (pane.activeBufferId) {
          const buffer = buffers.get(pane.activeBufferId);
          if (buffer && buffer.filePath && typeof buffer.content === 'string') {
            // Check if we already have this buffer to avoid duplicates
            const existingAttachment = activeBuffers.find(att => att.path === buffer.filePath);
            if (!existingAttachment) {
              const attachment: ChatAttachment = {
                id: `buffer-${buffer.id}`,
                type: 'file',
                name: buffer.name,
                path: buffer.filePath,
                content: buffer.content,
                size: buffer.fileSize,
                lastModified: buffer.lastModified,
              };
              activeBuffers.push(attachment);
            }
          }
        } else {
          // Strategy 2: If pane has no active buffer but has buffers, take the last one
          if (pane.bufferIds.length > 0) {
            const lastBufferId = pane.bufferIds[pane.bufferIds.length - 1];
            const buffer = buffers.get(lastBufferId);
            if (buffer && buffer.filePath && typeof buffer.content === 'string') {
              const existingAttachment = activeBuffers.find(att => att.path === buffer.filePath);
              if (!existingAttachment) {
                const attachment: ChatAttachment = {
                  id: `buffer-${buffer.id}`,
                  type: 'file',
                  name: buffer.name,
                  path: buffer.filePath,
                  content: buffer.content,
                  size: buffer.fileSize,
                  lastModified: buffer.lastModified,
                };
                activeBuffers.push(attachment);
              }
            }
          }
        }
      }

      // Strategy 3: If we still don't have enough attachments, get recent buffers from global store
      if (activeBuffers.length < 2 && tabOrder.length > 0) {
        for (const bufferId of tabOrder.slice(-2)) { // Get last 2 buffers
          const buffer = buffers.get(bufferId);
          if (buffer && buffer.filePath && typeof buffer.content === 'string') {
            const existingAttachment = activeBuffers.find(att => att.path === buffer.filePath);
            if (!existingAttachment) {
              const attachment: ChatAttachment = {
                id: `buffer-${buffer.id}`,
                type: 'file',
                name: buffer.name,
                path: buffer.filePath,
                content: buffer.content,
                size: buffer.fileSize,
                lastModified: buffer.lastModified,
              };
              activeBuffers.push(attachment);
            }
          }
        }
      }

      if (activeBuffers.length > 0) {
        setAttachments(prev => {
          // Only add if we don't already have buffer attachments
          const existingBufferAttachments = prev.filter(att => att.id.startsWith('buffer-'));
          if (existingBufferAttachments.length === 0) {
            return [...prev, ...activeBuffers];
          }
          return prev;
        });
      }
    };

    addActiveBuffersAsAttachments().catch(console.error);
  }, [isNewChat, buffers, tabOrder, getAllPanes]);

  // Function to remove an attachment
  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));

    // If user removes an attachment, mark as having user input to prevent re-adding
    if (!hasUserInput) {
      setHasUserInput(true);
    }
  }, [hasUserInput]);

  const handleImageUpload = async (file: File) => {
    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        // Create image attachment
        const imageAttachment: ChatAttachment = {
          id: `image-${Date.now()}`,
          type: 'image',
          name: file.name,
          content: dataUrl,
          size: file.size,
          lastModified: file.lastModified,
        };
        
        // Add to attachments
        setAttachments(prev => [...prev, imageAttachment]);
        
        // Focus back to editor
        editor?.commands.focus();
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

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
                {attachment.type === 'image' ? (
                  <>
                    <Image className="h-3 w-3" />
                    <img 
                      src={attachment.content as string} 
                      alt={attachment.name} 
                      className="h-12 w-12 object-cover rounded"
                    />
                  </>
                ) : (
                  <Paperclip className="h-3 w-3" />
                )}
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

      <div 
        className="relative border border-border rounded-md transition-all duration-300 [&:focus-within]:ring-0 [&:focus-within]:ring-offset-0 [&:focus-within]:outline-none [&:focus-within]:border-transparent"
        style={{
          ...(isFocused ? getAccentGlowStyle(accentColor, useGradient) : {}),
          '--tw-ring-color': 'transparent',
          '--tw-ring-offset-color': 'transparent'
        }}
      >
        <EditorContent
          editor={editor}
          className={cn(
            "min-h-[80px] max-h-[200px] overflow-y-auto p-0 text-xs",
            "prose prose-sm max-w-none dark:prose-invert",
            "[&_.mention]:bg-accent [&_.mention]:text-accent-foreground [&_.mention]:px-1 [&_.mention]:py-0.5 [&_.mention]:rounded [&_.mention]:text-xs",
            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none",
            "[&_.ProseMirror-focused]:outline-none",
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

        {/* Toolbar buttons */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              // Trigger @ mention
              editor?.chain().focus().insertContent('@').run();
            }}
            disabled={disabled || isLoading}
            tabIndex={-1}
            title="Mention file"
          >
            <AtSign className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              // Create file input and trigger click
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  await handleImageUpload(file);
                }
              };
              input.click();
            }}
            disabled={disabled || isLoading}
            tabIndex={-1}
            title="Add image"
          >
            <Image className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              // Trigger slash command
              editor?.chain().focus().insertContent('/').run();
            }}
            disabled={disabled || isLoading}
            tabIndex={-1}
            title="Use command"
          >
            <Slash className="h-3.5 w-3.5" />
          </Button>
        </div>
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

