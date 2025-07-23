import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageIcon, Smile, MapPin, Calendar } from 'lucide-react';

interface TimelinePostInputProps {
  onPost: (content: string) => Promise<void>;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  posting?: boolean;
}

export default function TimelinePostInput({ onPost, user, posting = false }: TimelinePostInputProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePost = async () => {
    if (!content.trim()) return;
    
    setError(null);
    try {
      await onPost(content);
      setContent('');
    } catch (e: any) {
      setError(e.message || 'Failed to post');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <div className="px-4 py-4 border-b border-border/30 bg-muted/5">
      <div className="flex gap-3 items-start">
        <Avatar className="h-10 w-10 mt-0.5">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            className="w-full min-h-[80px] max-h-32 resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="What's happening?"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={posting}
          />
          {error && (
            <div className="text-xs text-red-500 mt-2 px-1">{error}</div>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                disabled={posting}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                disabled={posting}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                disabled={posting}
              >
                <MapPin className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                disabled={posting}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                {content.length}/280
              </div>
              <Button
                size="sm"
                className="px-4 h-8"
                onClick={handlePost}
                disabled={posting || !content.trim() || content.length > 280}
              >
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
          
          {content.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2 px-1">
              Press Cmd+Enter to post
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
