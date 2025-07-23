import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';

interface CommentInputProps {
  postId: string;
  onComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  onCancel: () => void;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  parentId?: string;
  placeholder?: string;
  submitting?: boolean;
}

export default function CommentInput({
  postId,
  onComment,
  onCancel,
  user,
  parentId,
  placeholder = "Write a comment...",
  submitting = false
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setError(null);
    try {
      await onComment(postId, content, parentId);
      setContent('');
      onCancel();
    } catch (e: any) {
      setError(e.message || 'Failed to post comment');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="border border-border/30 rounded-lg p-3 bg-background/50 backdrop-blur-sm">
      <div className="flex gap-3 items-start">
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={placeholder}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={submitting}
            className="min-h-[60px] max-h-32 resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          
          {error && (
            <div className="text-xs text-red-500 mt-2">{error}</div>
          )}
          
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
            <div className="text-xs text-muted-foreground">
              {content.length}/280 • Press Cmd+Enter to post, Esc to cancel
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={submitting}
                className="h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !content.trim() || content.length > 280}
                className="h-7 px-3"
              >
                {submitting ? (
                  'Posting...'
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
