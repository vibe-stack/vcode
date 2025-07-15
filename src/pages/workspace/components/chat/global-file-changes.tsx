import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, FileText, FilePlus, FileX, ChevronDown, ChevronRight, AlertTriangle, History, ChevronLeft, ChevronRight as ChevronRightIcon, Undo, Redo } from 'lucide-react';
import { useChatSnapshotStore, FileSnapshot } from '@/stores/chat-snapshots';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GlobalFileChangesProps {
  sessionId: string;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function GlobalFileChanges({ sessionId, onAcceptAll, onRejectAll }: GlobalFileChangesProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const snapshots = useChatSnapshotStore(state => state.snapshots);
  
  const sessionData = useMemo(() => {
    const chat = snapshots.find(chat => chat.sessionId === sessionId);
    if (!chat) return { pendingSnapshots: [], allSnapshots: [], snapshotGroups: [] };
    
    const pendingSnapshots = chat.snapshots.filter(s => s.status === 'pending');
    
    // Group snapshots by messageId to create timeline
    const snapshotGroups = chat.snapshots.reduce((groups: any[], snapshot) => {
      const existingGroup = groups.find(g => g.messageId === snapshot.messageId);
      if (existingGroup) {
        existingGroup.snapshots.push(snapshot);
      } else {
        groups.push({
          messageId: snapshot.messageId,
          snapshots: [snapshot],
          timestamp: snapshot.timestamp
        });
      }
      return groups;
    }, []).sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      pendingSnapshots,
      allSnapshots: chat.snapshots,
      snapshotGroups
    };
  }, [snapshots, sessionId]);

  // Initialize to the latest snapshot
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(() => 
    Math.max(0, sessionData.snapshotGroups.length - 1)
  );

  // Update current snapshot index when data changes
  React.useEffect(() => {
    setCurrentSnapshotIndex(Math.max(0, sessionData.snapshotGroups.length - 1));
  }, [sessionData.snapshotGroups.length]);

  if (sessionData.pendingSnapshots.length === 0 && sessionData.snapshotGroups.length === 0) {
    return null;
  }

  const handleAcceptAll = async () => {
    setIsProcessing(true);
    try {
      await onAcceptAll();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAll = async () => {
    setIsProcessing(true);
    try {
      await onRejectAll();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToSnapshot = (index: number) => {
    setCurrentSnapshotIndex(index);
  };

  const handleRestoreToState = async (messageId: string, targetState: 'before' | 'after') => {
    setIsProcessing(true);
    try {
      const snapshotStore = useChatSnapshotStore.getState();
      await snapshotStore.restoreToState(sessionId, messageId, targetState);
    } finally {
      setIsProcessing(false);
    }
  };

  const getOperationIcon = (operation: FileSnapshot['operation']) => {
    switch (operation) {
      case 'create':
        return <FilePlus className="h-3 w-3 text-green-600" />;
      case 'update':
        return <FileText className="h-3 w-3 text-blue-600" />;
      case 'delete':
        return <FileX className="h-3 w-3 text-red-600" />;
      default:
        return <FileText className="h-3 w-3 text-gray-600" />;
    }
  };

  const getOperationText = (operation: FileSnapshot['operation']) => {
    switch (operation) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Modified';
      case 'delete':
        return 'Deleted';
      default:
        return 'Changed';
    }
  };

  const getOperationColor = (operation: FileSnapshot['operation']) => {
    switch (operation) {
      case 'create':
        return 'text-green-700 dark:text-green-300';
      case 'update':
        return 'text-blue-700 dark:text-blue-300';
      case 'delete':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: FileSnapshot['status']) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-3 w-3 text-amber-600" />;
      case 'accepted':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'reverted':
        return <XCircle className="h-3 w-3 text-red-600" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const currentGroup = sessionData.snapshotGroups[currentSnapshotIndex];

  return (
    <Card className="mb-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-amber-600" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-amber-600" />
                  )}
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    File Changes ({sessionData.pendingSnapshots.length} pending)
                  </span>
                </div>
              </Button>
            </CollapsibleTrigger>
            
            {sessionData.pendingSnapshots.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptAll}
                  disabled={isProcessing}
                  className="h-6 px-2 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20 disabled:opacity-50"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accept All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  disabled={isProcessing}
                  className="h-6 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject All
                </Button>
              </div>
            )}
          </div>

          <CollapsibleContent>
            {/* Timeline Navigation */}
            {sessionData.snapshotGroups.length > 0 && (
              <div className="mb-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <History className="h-3 w-3 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Snapshot Timeline
                    </span>
                  </div>
                  {sessionData.snapshotGroups.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGoToSnapshot(Math.max(0, currentSnapshotIndex - 1))}
                        disabled={currentSnapshotIndex === 0}
                        className="h-5 w-5 p-0 text-xs"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        {currentSnapshotIndex + 1} / {sessionData.snapshotGroups.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGoToSnapshot(Math.min(sessionData.snapshotGroups.length - 1, currentSnapshotIndex + 1))}
                        disabled={currentSnapshotIndex === sessionData.snapshotGroups.length - 1}
                        className="h-5 w-5 p-0 text-xs"
                      >
                        <ChevronRightIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {currentGroup && (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {new Date(currentGroup.timestamp).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {currentGroup.snapshots.length} file{currentGroup.snapshots.length !== 1 ? 's' : ''} changed
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreToState(currentGroup.messageId, 'before')}
                          disabled={isProcessing}
                          className="h-5 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20 disabled:opacity-50"
                        >
                          <Undo className="h-3 w-3 mr-1" />
                          Before
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreToState(currentGroup.messageId, 'after')}
                          disabled={isProcessing}
                          className="h-5 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20 disabled:opacity-50"
                        >
                          <Redo className="h-3 w-3 mr-1" />
                          After
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Restore files to state before or after this change
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-muted-foreground mb-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-medium mb-1">How restore works:</div>
              <div className="space-y-1">
                <div>• <span className="font-medium text-orange-600">Before:</span> Restore files to their state before this change was made</div>
                <div>• <span className="font-medium text-blue-600">After:</span> Restore files to their state after this change was applied</div>
                <div>• Status shows whether changes were accepted, reverted, or are still pending</div>
              </div>
            </div>

            {/* Current Pending Files */}
            {sessionData.pendingSnapshots.length > 0 && (
              <div className="space-y-1 mb-3">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pending Changes:
                </div>
                {sessionData.pendingSnapshots.map((snapshot, index) => (
                  <div
                    key={`${snapshot.filePath}-${index}`}
                    className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getOperationIcon(snapshot.operation)}
                      <span className={`text-xs font-medium ${getOperationColor(snapshot.operation)}`}>
                        {getOperationText(snapshot.operation)}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground truncate">
                        {snapshot.filePath}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getStatusIcon(snapshot.status)}
                      <span>{new Date(snapshot.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Files in Current Snapshot */}
            {currentGroup && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Files in Current Snapshot:
                </div>
                {currentGroup.snapshots.map((snapshot: FileSnapshot, index: number) => (
                  <div
                    key={`${snapshot.filePath}-${index}`}
                    className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getOperationIcon(snapshot.operation)}
                      <span className={`text-xs font-medium ${getOperationColor(snapshot.operation)}`}>
                        {getOperationText(snapshot.operation)}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground truncate">
                        {snapshot.filePath}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getStatusIcon(snapshot.status)}
                      <span className="capitalize">{snapshot.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </Card>
  );
}
