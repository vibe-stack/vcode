import { useCallback, useEffect } from 'react';
import { useChatEditor } from './useChatEditor';
import { useAttachments } from './useAttachments';
import { useChatSending } from './useChatSending';
import { useAutoBufferAttachments } from './useAutoBufferAttachments';
import { ChatAttachment } from '../types';

interface UseChatInputProps {
  disabled: boolean;
  isLoading: boolean;
  isNewChat: boolean;
  onSend: (content: string, attachments: ChatAttachment[]) => void;
}

export const useChatInput = ({
  disabled,
  isLoading,
  isNewChat,
  onSend,
}: UseChatInputProps) => {
  // Initialize attachments hook
  const attachmentsHook = useAttachments();
  const {
    attachments,
    attachmentsRef,
    hasUserInput,
    setHasUserInput,
    setAttachments,
    updateAttachmentsFromContent,
    removeAttachment,
    setEditor: setAttachmentsEditor,
    setIsSending: setAttachmentsIsSending,
  } = attachmentsHook;

  // Handle user input marking
  const handleUserInput = useCallback(() => {
    if (!hasUserInput) {
      setHasUserInput(true);
    }
  }, [hasUserInput, setHasUserInput]);

  // Initialize sending hook
  const sendingHook = useChatSending({
    isLoading,
    attachmentsRef,
    onSend,
    onUserInput: handleUserInput,
  });
  const { isSending, handleSend, setEditor: setSendingEditor } = sendingHook;

  // Initialize editor hook
  const editorHook = useChatEditor({
    disabled,
    isLoading,
    onSend: handleSend,
    onUpdate: updateAttachmentsFromContent,
    onUserInput: handleUserInput,
  });
  const { editor, handleKeyDown, isEmpty } = editorHook;

  // Connect editor to other hooks when it's ready
  useEffect(() => {
    if (editor) {
      setAttachmentsEditor(editor);
      setSendingEditor(editor);
    }
  }, [editor, setAttachmentsEditor, setSendingEditor]);

  // Update attachments hook with sending state
  useEffect(() => {
    setAttachmentsIsSending(isSending);
  }, [isSending, setAttachmentsIsSending]);

  // Auto-add buffer attachments for new chats
  useAutoBufferAttachments(isNewChat, setAttachments);

  return {
    // Editor
    editor,
    handleKeyDown,
    isEmpty,
    
    // Attachments
    attachments,
    removeAttachment,
    
    // Sending
    isSending,
    handleSend,
  };
};
