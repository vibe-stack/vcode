import { useEditor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Mention } from '@tiptap/extension-mention';
import { mentionProvider } from '../mention-provider';
import { mentionSuggestion } from '../mention-suggestion';
import { useEffect } from 'react';

interface UseChatEditorProps {
  disabled: boolean;
  isLoading: boolean;
  onSend: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onUserInput: () => void;
}

export const useChatEditor = ({ 
  disabled, 
  isLoading, 
  onSend, 
  onUpdate, 
  onUserInput 
}: UseChatEditorProps) => {
  // Custom extension to intercept Shift+Enter
  const ShiftEnterSend = Extension.create({
    name: 'shiftEnterSend',
    addKeyboardShortcuts() {
      return {
        'Shift-Enter': () => {
          onSend().catch(console.error);
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
        suggestion: mentionSuggestion,
      }),
      ShiftEnterSend,
    ],
    content: '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Update attachments when mentions change (but don't mark as user input yet)
      onUpdate().catch(console.error);
    },
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // If mention suggestion handled the event, don't send
    if (event.defaultPrevented) return;

    // Mark user input on first real keystroke (not just focus)
    // Note: This does not track deletions, backspace, etc.
    // It's a simple way to detect when the user has started typing.
    if (event.key.length === 1) {
      onUserInput();
    }

    // Shift+Enter is handled by the `ShiftEnterSend` extension now.
    // The Tiptap extension has better priority handling for events.
  };

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

  return {
    editor,
    handleKeyDown,
    isEmpty,
  };
};
