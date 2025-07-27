import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { History, Trash2 } from 'lucide-react';
import { mapBuilderChatPersistenceService } from './map-builder-chat-persistence';
import type { ChatSession } from './types';

interface SimpleChatHistoryProps {
  onLoadSession: (sessionId: string) => void;
  onClearHistory: () => void;
  currentSessionId?: string;
}

export function SimpleChatHistory({ onLoadSession, onClearHistory, currentSessionId }: SimpleChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const recentSessions = await mapBuilderChatPersistenceService.getRecentSessions(20);
      setSessions(recentSessions);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          title="Chat History"
        >
          <History className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {isLoading ? (
          <DropdownMenuItem disabled>
            Loading history...
          </DropdownMenuItem>
        ) : sessions.length === 0 ? (
          <DropdownMenuItem disabled>
            No chat history
          </DropdownMenuItem>
        ) : (
          <>
            {sessions.map((session) => (
              <DropdownMenuItem
                key={session.id}
                onClick={() => onLoadSession(session.id)}
                className={`flex flex-col items-start gap-1 h-auto py-2 ${
                  session.id === currentSessionId ? 'bg-accent' : ''
                }`}
              >
                <div className="font-medium text-sm truncate w-full">
                  {session.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(session.lastModified)}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onClearHistory}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Clear History
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
