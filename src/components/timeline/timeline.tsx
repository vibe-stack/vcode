import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { 
  useTimeline, 
  useCreatePost, 
  useLikePost, 
  useUnlikePost, 
  useBookmarkPost, 
  useUnbookmarkPost,
  useCreateComment,
  useLikeComment,
  useUnlikeComment,
  TimelinePostData 
} from '@/hooks/useSocial';
import TimelinePostInput from './timeline-post-input';
import TimelineItem, { TimelinePost } from './timeline-item';

interface TimelineProps {
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  className?: string;
}

// Transform API data to component interface
const transformPost = (apiPost: TimelinePostData): TimelinePost => ({
  id: apiPost.id.toString(),
  content: apiPost.content,
  user: {
    id: parseInt(apiPost.author.id),
    name: apiPost.author.name,
    username: apiPost.author.name.toLowerCase().replace(/\s+/g, ''), // Generate username from name
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiPost.author.name}`,
    verified: false
  },
  createdAt: new Date(apiPost.createdAt).toISOString(),
  stats: {
    likes: 0, // API doesn't include counts yet
    comments: 0, // API doesn't include counts yet
    reposts: 0, // API doesn't include counts yet
    bookmarks: 0 // API doesn't include counts yet
  },
  userInteractions: {
    liked: false,
    bookmarked: false,
    reposted: false
  }
});

export default function Timeline({ user, className = '' }: TimelineProps) {
  const { data, isLoading, error, refetch, isRefetching } = useTimeline();
  const createPostMutation = useCreatePost();
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const unbookmarkPostMutation = useUnbookmarkPost();
  const createCommentMutation = useCreateComment();
  const likeCommentMutation = useLikeComment();
  const unlikeCommentMutation = useUnlikeComment();

  const posts: TimelinePost[] = data?.timeline?.map(transformPost) || [];

  // Create a new post
  const handleCreatePost = async (content: string) => {
    try {
      await createPostMutation.mutateAsync(content);
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  // Refresh timeline
  const handleRefresh = () => {
    refetch();
  };

  // Post interactions
  const handleLike = async (postId: string) => {
    try {
      await likePostMutation.mutateAsync(parseInt(postId));
    } catch (err) {
      console.error('Error liking post:', err);
      throw err;
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      await unlikePostMutation.mutateAsync(parseInt(postId));
    } catch (err) {
      console.error('Error unliking post:', err);
      throw err;
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      await bookmarkPostMutation.mutateAsync(parseInt(postId));
    } catch (err) {
      console.error('Error bookmarking post:', err);
      throw err;
    }
  };

  const handleUnbookmark = async (postId: string) => {
    try {
      await unbookmarkPostMutation.mutateAsync(parseInt(postId));
    } catch (err) {
      console.error('Error unbookmarking post:', err);
      throw err;
    }
  };

  const handleComment = async (postId: string, content: string, parentId?: string) => {
    try {
      await createCommentMutation.mutateAsync({
        postId: parseInt(postId),
        content,
        parentId: parentId ? parseInt(parentId) : undefined
      });
    } catch (err) {
      console.error('Error creating comment:', err);
      throw err;
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await likeCommentMutation.mutateAsync(parseInt(commentId));
    } catch (err) {
      console.error('Error liking comment:', err);
      throw err;
    }
  };

  const handleUnlikeComment = async (commentId: string) => {
    try {
      await unlikeCommentMutation.mutateAsync(parseInt(commentId));
    } catch (err) {
      console.error('Error unliking comment:', err);
      throw err;
    }
  };

  const handleRepost = async (postId: string) => {
    try {
      // TODO: Implement repost API endpoint
      console.log('Repost:', postId);
    } catch (err) {
      console.error('Error reposting:', err);
      throw err;
    }
  };

  const handleShare = async (postId: string) => {
    try {
      // Copy post URL to clipboard
      const postUrl = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      console.log('Post URL copied to clipboard');
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleUserClick = (username: string) => {
    console.log('Navigate to user:', username);
  };

  const handlePostClick = (postId: string) => {
    console.log('Navigate to post:', postId);
  };

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Timeline</h2>
            <p className="text-sm text-muted-foreground">Stay connected with your network</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Post Input */}
        <TimelinePostInput
          onPost={handleCreatePost}
          user={user}
          posting={createPostMutation.isPending}
        />

        {/* Error State */}
        {error && (
          <div className="px-6 py-4 text-center">
            <p className="text-sm text-red-500 mb-3">
              {error instanceof Error ? error.message : 'Failed to load timeline'}
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="px-6 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading timeline...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && !error && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">No posts yet</p>
            <p className="text-xs text-muted-foreground">Be the first to share something!</p>
          </div>
        )}

        {/* Posts */}
        {posts.map((post) => (
          <TimelineItem
            key={post.id}
            post={post}
            onLike={handleLike}
            onUnlike={handleUnlike}
            onBookmark={handleBookmark}
            onUnbookmark={handleUnbookmark}
            onComment={handleComment}
            onLikeComment={handleLikeComment}
            onUnlikeComment={handleUnlikeComment}
            onRepost={handleRepost}
            onShare={handleShare}
            onUserClick={handleUserClick}
            onPostClick={handlePostClick}
            currentUser={user}
          />
        ))}
      </ScrollArea>
    </div>
  );
}
