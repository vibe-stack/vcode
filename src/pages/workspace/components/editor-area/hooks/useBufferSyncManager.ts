import { useState, useEffect, useCallback, useRef } from 'react';
import { BufferContent, useBufferStore } from '@/stores/buffers';

interface UseBufferSyncManagerReturn {
  /** Local content that's being edited */
  localContent: string | null;
  /** Whether there are unsaved local changes */
  isDirty: boolean;
  /** Update local content (high frequency, not synced to store) */
  updateLocalContent: (content: string) => void;
  /** Force sync local content to store */
  syncToStore: () => void;
  /** Save buffer to disk */
  saveBuffer: () => Promise<boolean>;
}

/**
 * High-performance buffer sync manager that debounces store updates
 * to prevent Monaco editor slowdown while keeping external changes in sync
 */
export function useBufferSyncManager(buffer: BufferContent): UseBufferSyncManagerReturn {
  const [localContent, setLocalContent] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const updateBufferContent = useBufferStore(state => state.updateBufferContent);
  const saveBufferAction = useBufferStore(state => state.saveBuffer);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedContentRef = useRef<string>('');
  
  // Initialize local content from buffer
  useEffect(() => {
    const content = typeof buffer.content === 'string' 
      ? buffer.content 
      : buffer.content ? new TextDecoder().decode(buffer.content) : '';
    
    setLocalContent(content);
    lastSyncedContentRef.current = content;
    setIsDirty(false);
  }, [buffer.id]); // Only reset when buffer changes
  
  // Sync external changes to local content (when other sources modify the buffer)
  useEffect(() => {
    const content = typeof buffer.content === 'string' 
      ? buffer.content 
      : buffer.content ? new TextDecoder().decode(buffer.content) : '';
    
    // Only update local content if it's different from what we last synced
    // This prevents overwriting user's local edits
    if (content !== lastSyncedContentRef.current && localContent !== content) {
      setLocalContent(content);
      lastSyncedContentRef.current = content;
      setIsDirty(false);
    }
  }, [buffer.content, buffer.lastModified]);
  
  const updateLocalContent = useCallback((content: string) => {
    setLocalContent(content);
    setIsDirty(content !== lastSyncedContentRef.current);
    
    // Debounce sync to store (500ms delay)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      updateBufferContent(buffer.id, content);
      lastSyncedContentRef.current = content;
      setIsDirty(false);
    }, 500);
  }, [buffer.id, updateBufferContent]);
  
  const syncToStore = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    
    if (localContent && localContent !== lastSyncedContentRef.current) {
      updateBufferContent(buffer.id, localContent);
      lastSyncedContentRef.current = localContent;
      setIsDirty(false);
    }
  }, [buffer.id, localContent, updateBufferContent]);
  
  const saveBuffer = useCallback(async () => {
    // Sync any pending changes first
    syncToStore();
    
    // Wait a bit for the sync to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return saveBufferAction(buffer.id);
  }, [buffer.id, saveBufferAction, syncToStore]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    localContent,
    isDirty,
    updateLocalContent,
    syncToStore,
    saveBuffer
  };
}
