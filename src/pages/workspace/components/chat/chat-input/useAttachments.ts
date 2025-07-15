import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatAttachment } from '../types';
import { chatSerializationService } from '../chat-serialization';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { Editor } from '@tiptap/react';

export const useAttachments = () => {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const attachmentsRef = useRef<ChatAttachment[]>([]);
  const [hasUserInput, setHasUserInput] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const isSendingRef = useRef(false);

  // Store references
  const buffers = useBufferStore(state => state.buffers);
  const tabOrder = useBufferStore(state => state.tabOrder);
  const getAllPanes = useEditorSplitStore(state => state.getAllPanes);

  // Always keep ref in sync
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  // Helper to compute buffer attachments from current buffers and panes
  const computeAutoBufferAttachments = useCallback(() => {
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
  }, [buffers, tabOrder, getAllPanes]);

  const updateAttachmentsFromContent = useCallback(async () => {
    if (!editorRef.current || isSendingRef.current) return;
    
    const content = editorRef.current.getJSON();
    const mentions = chatSerializationService.extractMentions(content);
    const mentionAttachments = await chatSerializationService.mentionsToAttachments(mentions);

    // Always recompute buffer attachments for UI
    const autoBufferAttachments = computeAutoBufferAttachments().filter(att =>
      !mentionAttachments.some(ma => ma.id === att.id)
    );

    setAttachments([...autoBufferAttachments, ...mentionAttachments]);
  }, [computeAutoBufferAttachments]);

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));

    // If user removes an attachment, mark as having user input to prevent re-adding
    if (!hasUserInput) {
      setHasUserInput(true);
    }
  }, [hasUserInput]);

  const setEditor = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  const setIsSending = useCallback((isSending: boolean) => {
    isSendingRef.current = isSending;
  }, []);

  return {
    attachments,
    attachmentsRef,
    hasUserInput,
    setHasUserInput,
    setAttachments,
    updateAttachmentsFromContent,
    removeAttachment,
    computeAutoBufferAttachments,
    setEditor,
    setIsSending,
  };
};
