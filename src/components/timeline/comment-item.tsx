import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Reply,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentInput from './comment-input';

export interface Comment {
  id: string;
  content: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  createdAt: string;
  stats: {
    likes: number;
    replies: number;
  };
  userInteractions: {
    liked: boolean;
  };
  parentId?: string;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onLike: (commentId: string) => void;
  onUnlike: (commentId: string) => void;
  onReply: (postId: string, content: string, parentId: string) => Promise<void>;
  currentUser: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  depth?: number;
  maxDepth?: number;
}

export default function CommentItem({
  comment,
  postId,
  onLike,
  onUnlike,
  onReply,
  currentUser,
  depth = 0,
  maxDepth = 3
}: CommentItemProps) {
  const [localStats, setLocalStats] = useState(comment.stats);
  const [localInteractions, setLocalInteractions] = useState(comment.userInteractions);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleLike = async () => {
    if (actionLoading) return;
    setActionLoading('like');
    
    try {
      if (localInteractions.liked) {
        await onUnlike(comment.id);
        setLocalStats(prev => ({ ...prev, likes: prev.likes - 1 }));
        setLocalInteractions(prev => ({ ...prev, liked: false }));
      } else {
        await onLike(comment.id);
        setLocalStats(prev => ({ ...prev, likes: prev.likes + 1 }));
        setLocalInteractions(prev => ({ ...prev, liked: true }));
      }
    } catch (error) {
      console.error('Failed to like/unlike comment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReply = async (content: string) => {
    await onReply(postId, content, comment.id);
    setShowReplyInput(false);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-3 border-l border-border/30' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarImage src={comment.user.avatar} />
          <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-medium text-sm text-foreground hover:underline cursor-pointer">
              {comment.user.name}
            </span>
            <span className="text-muted-foreground text-xs">
              @{comment.user.username}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs hover:underline cursor-pointer flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(comment.createdAt)}
            </span>
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted/40 rounded-full">
                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <div className="text-sm mt-1 leading-relaxed text-foreground">
            {comment.content}
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-2 rounded-full group transition-colors ${
                localInteractions.liked 
                  ? 'text-red-600 hover:bg-red-50/50' 
                  : 'hover:bg-red-50/50 hover:text-red-600'
              }`}
              onClick={handleLike}
              disabled={actionLoading === 'like'}
            >
              <Heart className={`h-3 w-3 mr-1 ${localInteractions.liked ? 'fill-current' : ''}`} />
              <span className="text-xs">{localStats.likes || 0}</span>
            </Button>
            
            {depth < maxDepth && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 hover:bg-blue-50/50 hover:text-blue-600 rounded-full group transition-colors"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                <Reply className="h-3 w-3 mr-1" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
            
            {comment.replies && comment.replies.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 hover:bg-muted/40 rounded-full group transition-colors"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                <span className="text-xs">{comment.replies.length} replies</span>
              </Button>
            )}
          </div>
          
          {showReplyInput && (
            <div className="mt-3">
              <CommentInput
                postId={postId}
                onComment={handleReply}
                onCancel={() => setShowReplyInput(false)}
                user={currentUser}
                parentId={comment.id}
                placeholder={`Reply to ${comment.user.name}...`}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onLike={onLike}
              onUnlike={onUnlike}
              onReply={onReply}
              currentUser={currentUser}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}
