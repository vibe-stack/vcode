import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useChatSnapshotStore } from '@/stores/chat-snapshots';

interface PendingChangesIndicatorProps {
  sessionId: string;
}

export function PendingChangesIndicator({ sessionId }: PendingChangesIndicatorProps) {
  // Get the entire snapshots array and memoize the calculation
  const snapshots = useChatSnapshotStore(state => state.snapshots);
  
  const pendingData = useMemo(() => {
    const chat = snapshots.find(chat => chat.sessionId === sessionId);
    if (!chat) return { count: 0, messagesCount: 0 };
    
    const pendingSnapshots = chat.snapshots.filter(s => s.status === 'pending');
    const pendingMessagesCount = new Set(pendingSnapshots.map(s => s.messageId)).size;
    
    return {
      count: pendingSnapshots.length,
      messagesCount: pendingMessagesCount
    };
  }, [snapshots, sessionId]);
  
  if (pendingData.count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
      <AlertTriangle className="h-3 w-3" />
      <span>
        {pendingData.count} pending file change{pendingData.count !== 1 ? 's' : ''} 
        {pendingData.messagesCount > 1 && ` across ${pendingData.messagesCount} messages`}
      </span>
    </div>
  );
}
