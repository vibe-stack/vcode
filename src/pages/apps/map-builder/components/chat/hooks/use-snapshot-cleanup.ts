import { useEffect, useRef } from 'react';
import { useChatSnapshotStore } from '@/stores/chat-snapshots';

export function useSnapshotCleanup() {
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    // Clean up snapshots older than 7 days on component mount
    const cleanupOldSnapshots = () => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const state = useChatSnapshotStore.getState();
      
      const updatedSnapshots = state.snapshots.map(chat => ({
        ...chat,
        snapshots: chat.snapshots.filter(snapshot => snapshot.timestamp > sevenDaysAgo)
      })).filter(chat => chat.snapshots.length > 0);
      
      if (updatedSnapshots.length !== state.snapshots.length) {
        useChatSnapshotStore.setState({ snapshots: updatedSnapshots });
      }
    };

    cleanupOldSnapshots();
    
    // Set up periodic cleanup (every hour)
    const interval = setInterval(cleanupOldSnapshots, 60 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      hasInitialized.current = false;
    };
  }, []);
}

export function useSnapshotStatistics(sessionId: string | null) {
  const stats = useChatSnapshotStore(state => {
    if (!sessionId) {
      return {
        totalSnapshots: 0,
        pendingSnapshots: 0,
        acceptedSnapshots: 0,
        revertedSnapshots: 0,
      };
    }
    
    const chat = state.snapshots.find(chat => chat.sessionId === sessionId);
    if (!chat) {
      return {
        totalSnapshots: 0,
        pendingSnapshots: 0,
        acceptedSnapshots: 0,
        revertedSnapshots: 0,
      };
    }
    
    const snapshots = chat.snapshots;
    return {
      totalSnapshots: snapshots.length,
      pendingSnapshots: snapshots.filter(s => s.status === 'pending').length,
      acceptedSnapshots: snapshots.filter(s => s.status === 'accepted').length,
      revertedSnapshots: snapshots.filter(s => s.status === 'reverted').length,
    };
  });
  
  return stats;
}
