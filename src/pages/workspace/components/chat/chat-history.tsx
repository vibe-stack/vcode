import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, MessageSquare, Trash2, Clock } from "lucide-react";
import { chatPersistenceService } from "./chat-persistence";
import { ChatSession } from "./types";

interface ChatHistoryProps {
  onLoadSession: (sessionId: string) => Promise<void>;
  onClearHistory: () => void;
  currentSessionId?: string;
}

export function ChatHistory({
  onLoadSession,
  onClearHistory,
  currentSessionId,
}: ChatHistoryProps) {
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load recent sessions when popover opens
  useEffect(() => {
    if (isOpen) {
      loadRecentSessions();
    }
  }, [isOpen]);

  const loadRecentSessions = async () => {
    try {
      setIsLoading(true);
      const sessions = await chatPersistenceService.getRecentSessions(10);
      setRecentSessions(sessions);
    } catch (error) {
      console.error("Failed to load recent sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      await onLoadSession(sessionId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const handleDeleteSession = async (
    sessionId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    try {
      await chatPersistenceService.deleteSession(sessionId);
      setRecentSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleClearHistory = () => {
    onClearHistory();
    setIsOpen(false);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <History className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Chat History</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleClearHistory}
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="text-muted-foreground mb-2 h-8 w-8" />
              <div className="text-muted-foreground text-sm">
                No chat history
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                Start a conversation to see your history
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-2">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${
                      currentSessionId === session.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleLoadSession(session.id)}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <MessageSquare className="text-muted-foreground h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 truncate text-sm font-medium">
                        {session.title}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        {formatDate(session.lastModified)}
                        <span>•</span>
                        <span>{session.messages.length} messages</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {recentSessions.length > 0 && (
          <div className="border-t p-3">
            <div className="text-muted-foreground text-center text-xs">
              Showing {recentSessions.length} of your most recent chats
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
