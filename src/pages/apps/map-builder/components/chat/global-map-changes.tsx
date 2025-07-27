import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, AlertCircle } from 'lucide-react';
import { useMapSnapshotStore } from './map-snapshot-store';

interface GlobalMapChangesProps {
  sessionId: string;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function GlobalMapChanges({ sessionId, onAcceptAll, onRejectAll }: GlobalMapChangesProps) {
  const snapshots = useMapSnapshotStore(state => state.snapshots);
  
  const pendingSnapshots = useMemo(() => 
    snapshots.filter(snapshot => 
      snapshot.sessionId === sessionId && !snapshot.accepted
    ), [snapshots, sessionId]
  );

  if (pendingSnapshots.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-muted/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRejectAll}
            className="h-7 text-xs text-destructive hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAcceptAll}
            className="h-7 text-xs text-green-600 hover:text-green-700"
          >
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
