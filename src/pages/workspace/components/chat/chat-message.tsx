import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, User, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { Message } from 'ai';

interface MessageProps {
  message: Message;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
}


export function MessageComponent({ message, onCopy, onDelete }: MessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy(message.content);
  }, [message.content, onCopy]);

  const handleDelete = useCallback(() => {
    onDelete(message.id);
  }, [message.id, onDelete]);

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg",
        message.role === 'user' ? "bg-primary/10 ml-8" : "bg-muted/50 mr-8"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-shrink-0">
        {message.role === 'user' ? (
          <User className="h-5 w-5 text-primary" />
        ) : (
          <Bot className="h-5 w-5 text-blue-500" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}
          </span>
          
          {isHovered && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}