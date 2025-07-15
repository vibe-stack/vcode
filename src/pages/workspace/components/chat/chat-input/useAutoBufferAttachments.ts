import { useEffect } from 'react';
import { ChatAttachment } from '../types';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';

export const useAutoBufferAttachments = (
  isNewChat: boolean,
  setAttachments: (updater: (prev: ChatAttachment[]) => ChatAttachment[]) => void
) => {
  const buffers = useBufferStore(state => state.buffers);
  const tabOrder = useBufferStore(state => state.tabOrder);
  const getAllPanes = useEditorSplitStore(state => state.getAllPanes);

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
  }, [isNewChat, buffers, tabOrder, getAllPanes, setAttachments]);
};
