import { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { ChatAttachment } from '../types';
import { chatSerializationService } from '../chat-serialization';

interface UseChatSendingProps {
  isLoading: boolean;
  attachmentsRef: React.RefObject<ChatAttachment[]>;
  onSend: (content: string, attachments: ChatAttachment[]) => void;
  onUserInput: () => void;
}

export const useChatSending = ({ 
  isLoading, 
  attachmentsRef, 
  onSend, 
  onUserInput 
}: UseChatSendingProps) => {
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false); // Ref to track sending state
  const editorRef = useRef<Editor | null>(null);

  const handleSend = useCallback(async () => {
    if (!editorRef.current || isLoading || isSending || sendingRef.current) return;
    
    sendingRef.current = true; // Set sending state to prevent re-entrance

    const content = chatSerializationService.tiptapToPlainText(editorRef.current.getJSON());
    if (!content.trim()) {
      sendingRef.current = false;
      return;
    }

    setIsSending(true);

    // Always use the latest attachments from ref
    const currentAttachments = attachmentsRef.current || [];

    editorRef.current.commands.clearContent();
    onUserInput();

    onSend(content, currentAttachments);

    setIsSending(false);
    sendingRef.current = false; // Reset sending state
  }, [isLoading, isSending, attachmentsRef, onSend, onUserInput]);

  const setEditor = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  return {
    isSending,
    sendingRef,
    handleSend,
    setEditor,
  };
};
