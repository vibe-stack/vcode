import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Check,
  X,
  FileText,
  FilePlus,
  FileX,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ArrowLeft,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChatSnapshotStore, FileSnapshot } from "@/stores/chat-snapshots";
import { useEditorSplitStore } from "@/stores/editor-splits";
import * as motion from "motion/react-client";

interface GlobalFileChangesProps {
  sessionId: string;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function GlobalFileChanges({
  sessionId,
  onAcceptAll,
  onRejectAll,
}: GlobalFileChangesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const openFile = useEditorSplitStore((s) => s.openFile);

  const snapshots = useChatSnapshotStore((state) => state.snapshots);

  const sessionData = useMemo(() => {
    const chat = snapshots.find((chat) => chat.sessionId === sessionId);
    if (!chat)
      return { pendingSnapshots: [], allSnapshots: [], snapshotGroups: [] };

    const pendingSnapshots = chat.snapshots.filter(
      (s) => s.status === "pending",
    );

    // Group snapshots by messageId to create timeline
    const snapshotGroups = chat.snapshots
      .reduce((groups: any[], snapshot) => {
        const existingGroup = groups.find(
          (g) => g.messageId === snapshot.messageId,
        );
        if (existingGroup) {
          existingGroup.snapshots.push(snapshot);
        } else {
          groups.push({
            messageId: snapshot.messageId,
            snapshots: [snapshot],
            timestamp: snapshot.timestamp,
          });
        }
        return groups;
      }, [])
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      pendingSnapshots,
      allSnapshots: chat.snapshots,
      snapshotGroups,
    };
  }, [snapshots, sessionId]);

  // Initialize to the latest snapshot
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(() =>
    Math.max(0, sessionData.snapshotGroups.length - 1),
  );

  // Update current snapshot index when data changes
  React.useEffect(() => {
    setCurrentSnapshotIndex(Math.max(0, sessionData.snapshotGroups.length - 1));
  }, [sessionData.snapshotGroups.length]);

  if (
    sessionData.pendingSnapshots.length === 0 &&
    sessionData.snapshotGroups.length === 0
  ) {
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

  const handleRestoreToState = async (
    messageId: string,
    targetState: "before" | "after",
  ) => {
    setIsProcessing(true);
    try {
      const snapshotStore = useChatSnapshotStore.getState();
      await snapshotStore.restoreToState(sessionId, messageId, targetState);
    } finally {
      setIsProcessing(false);
    }
  };

  const getOperationIcon = (operation: FileSnapshot["operation"]) => {
    switch (operation) {
      case "create":
        return <FilePlus className="h-3 w-3 text-green-600" />;
      case "update":
        return <FileText className="h-3 w-3 text-blue-600" />;
      case "delete":
        return <FileX className="h-3 w-3 text-red-600" />;
      default:
        return <FileText className="h-3 w-3 text-gray-600" />;
    }
  };

  const getOperationText = (operation: FileSnapshot["operation"]) => {
    switch (operation) {
      case "create":
        return "A"; // Added
      case "update":
        return "M"; // Modified
      case "delete":
        return "D"; // Deleted
      default:
        return "?";
    }
  };

  // Helper to get filename and relative path
  const getFileDisplay = (filePath: string) => {
    // Try to get relative path from project root
    const projectRoot = "/Users/fairhat/Repositories/grok-ide/";
    let relPath = filePath.startsWith(projectRoot)
      ? filePath.slice(projectRoot.length)
      : "";
    const parts = filePath.split("/");
    const filename = parts[parts.length - 1];
    return { filename, relPath };
  };

  const getStatusIcon = (status: FileSnapshot["status"]) => {
    switch (status) {
      case "accepted":
        return <Check className="h-3 w-3 text-green-600" />;
      case "reverted":
      case "failed":
        return <X className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const currentGroup = sessionData.snapshotGroups[currentSnapshotIndex];

  const showPending = sessionData.pendingSnapshots.length > 0;
  return (
    <Card className="bg-background/80 dark:bg-background/80 mb-0.5 gap-2 border-none py-0 shadow-none">
      {/* Tiny bar always visible */}
      <div
        className="bg-accent/40 dark:bg-accent/30 flex min-h-[28px] cursor-default items-center gap-2 rounded-t px-2 py-1 select-none"
        style={{ userSelect: "none" }}
        onClick={() => setIsExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronDown className="text-accent h-3 w-3" />
        ) : (
          <ChevronRight className="text-accent h-3 w-3" />
        )}
        <FileText className="text-accent h-4 w-4" />
        <span className="text-foreground text-xs font-medium">
          File Changes
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-accent/40 h-5 w-5 p-0"
            >
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="text-muted-foreground bg-background w-72 border-none p-3 text-xs shadow-lg">
            <div className="space-y-1">
              <div>
                • <span className="text-accent font-medium">Revert:</span>{" "}
                Restore files to their state before this change was made
              </div>
              <div>
                • <span className="text-accent font-medium">Restore:</span>{" "}
                Restore files to their state after this change was applied
              </div>
              <div>
                • Status shows whether changes were accepted, reverted, or are
                still pending
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1" />
        {sessionData.snapshotGroups.length > 1 && (
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex items-center gap-1"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleGoToSnapshot(Math.max(0, currentSnapshotIndex - 1));
              }}
              disabled={currentSnapshotIndex === 0}
              className="h-5 w-5 p-0 text-xs"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-muted-foreground px-2 text-xs">
              {currentSnapshotIndex + 1}{" "}
              <span className="text-muted-foreground/50">
                / {sessionData.snapshotGroups.length}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleGoToSnapshot(
                  Math.min(
                    sessionData.snapshotGroups.length - 1,
                    currentSnapshotIndex + 1,
                  ),
                );
              }}
              disabled={
                currentSnapshotIndex === sessionData.snapshotGroups.length - 1
              }
              className="h-5 w-5 p-0 text-xs"
            >
              <ChevronRightIcon className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      {/* Collapsible content with smooth height animation */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{
          height: { type: "spring", duration: 0.35 },
          opacity: { duration: 0.2 },
        }}
        style={{ overflow: "hidden", display: "block" }}
        aria-hidden={!isExpanded}
      >
        {isExpanded && (
          <div className="p-3">
            {/* Timestamp */}
            {currentGroup && (
              <div className="text-muted-foreground mb-2 text-xs">
                {new Date(currentGroup.timestamp).toLocaleString()}
              </div>
            )}
            {/* Pending Files */}
            {showPending && sessionData.pendingSnapshots.length > 0 && (
              <div className="space-y-1">
                {sessionData.pendingSnapshots.map((snapshot, index) => {
                  const { filename, relPath } = getFileDisplay(
                    snapshot.filePath,
                  );
                  return (
                    <div
                      key={`${snapshot.filePath}-${index}`}
                      className="bg-accent/30 dark:bg-accent/20 flex items-center justify-between rounded p-2"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="text-xs font-bold text-white dark:text-white/90">
                          {filename}
                        </span>
                        {relPath && (
                          <span className="text-muted-foreground truncate font-mono text-xs">
                            {relPath}
                          </span>
                        )}
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {getOperationText(snapshot.operation)}
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span>
                          {new Date(snapshot.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Files in Current Snapshot */}
            {!showPending && currentGroup && (
              <div className="mb-3 flex max-h-[150px] flex-col gap-0.5 overflow-y-auto">
                {currentGroup.snapshots.map(
                  (snapshot: FileSnapshot, index: number) => {
                    const { filename, relPath } = getFileDisplay(
                      snapshot.filePath,
                    );
                    return (
                      <div
                        key={`${snapshot.filePath}-${index}`}
                        onClick={() => openFile(snapshot.filePath)}
                        className="bg-accent/30 hover:bg-accent/40 dark:bg-accent/20 flex items-center justify-between rounded p-2"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {getOperationText(snapshot.operation)}
                          </span>
                          <span className="font-regular text-xs text-white dark:text-white/90">
                            {filename}
                          </span>
                          {relPath && (
                            <span className="text-muted-foreground truncate font-mono text-xs">
                              {relPath}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                          {getStatusIcon(snapshot.status)}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
            {/* Action Buttons at Bottom */}
            <div className="mt-4 flex items-center gap-2 justify-self-end">
              {showPending ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAcceptAll}
                    disabled={isProcessing}
                    className="h-6 border-none bg-green-600 px-2 text-xs text-white shadow-none hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    Accept All
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRejectAll}
                    disabled={isProcessing}
                    className="h-6 border-none bg-red-600 px-2 text-xs text-white shadow-none hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
                  >
                    Reject All
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleRestoreToState(currentGroup.messageId, "before")
                    }
                    disabled={isProcessing}
                    className="text-muted-foreground h-6 px-2 text-xs"
                  >
                    Revert
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      handleRestoreToState(currentGroup.messageId, "after")
                    }
                    disabled={isProcessing}
                    className="bg-muted text-foreground hover:bg-accent/60 dark:bg-muted dark:hover:bg-accent/40 h-6 border-none px-2 text-xs shadow-none"
                  >
                    Restore
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </Card>
  );
}
