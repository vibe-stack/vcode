import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  FileText,
  FilePlus,
  FileX,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useChatSnapshotStore, FileSnapshot } from "@/stores/chat-snapshots";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FileChangesProps {
  sessionId: string;
  messageId: string;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function FileChanges({
  sessionId,
  messageId,
  onAcceptAll,
  onRejectAll,
}: FileChangesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get the entire snapshots array and memoize the filtered result
  const snapshots = useChatSnapshotStore((state) => state.snapshots);

  const pendingSnapshots = useMemo(() => {
    const chat = snapshots.find((chat) => chat.sessionId === sessionId);
    return (
      chat?.snapshots.filter(
        (s) => s.messageId === messageId && s.status === "pending",
      ) || []
    );
  }, [snapshots, sessionId, messageId]);

  if (pendingSnapshots.length === 0) {
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
        return "Created";
      case "update":
        return "Modified";
      case "delete":
        return "Deleted";
      default:
        return "Changed";
    }
  };

  const getOperationColor = (operation: FileSnapshot["operation"]) => {
    switch (operation) {
      case "create":
        return "text-green-700 dark:text-green-300";
      case "update":
        return "text-blue-700 dark:text-blue-300";
      case "delete":
        return "text-red-700 dark:text-red-300";
      default:
        return "text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: FileSnapshot["status"]) => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="h-3 w-3 text-amber-600" />;
      case "accepted":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "reverted":
        return <XCircle className="h-3 w-3 text-red-600" />;
      case "failed":
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-background/80 dark:bg-background/80 mb-3 border-none p-3 shadow-none">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-accent/40 h-auto p-0"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="text-accent h-3 w-3" />
                  ) : (
                    <ChevronRight className="text-accent h-3 w-3" />
                  )}
                  <FileText className="text-accent h-4 w-4" />
                  <span className="text-foreground text-xs font-medium">
                    File Changes ({pendingSnapshots.length})
                  </span>
                </div>
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={handleAcceptAll}
                disabled={isProcessing}
                className="h-6 border-none bg-green-600 px-2 text-xs text-white shadow-none hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                {isProcessing ? "Processing..." : "Accept All"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRejectAll}
                disabled={isProcessing}
                className="h-6 border-none bg-red-600 px-2 text-xs text-white shadow-none hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
              >
                <XCircle className="mr-1 h-3 w-3" />
                {isProcessing ? "Processing..." : "Reject All"}
              </Button>
            </div>
          </div>
          <CollapsibleContent className="space-y-1">
            {pendingSnapshots.map((snapshot, index) => (
              <div
                key={`${snapshot.filePath}-${index}`}
                className="bg-accent/30 dark:bg-accent/20 flex items-center justify-between rounded p-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {getOperationIcon(snapshot.operation)}
                  <span
                    className={`text-xs font-medium ${getOperationColor(snapshot.operation)}`}
                  >
                    {getOperationText(snapshot.operation)}
                  </span>
                  <span className="text-muted-foreground truncate font-mono text-xs">
                    {snapshot.filePath}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  {getStatusIcon(snapshot.status)}
                  <span>
                    {new Date(snapshot.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </Card>
  );
}
