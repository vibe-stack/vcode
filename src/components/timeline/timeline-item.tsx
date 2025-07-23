import React, { useState } from 'react';import { Button } from '@/components/ui/button';import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';import {  Heart,  MessageCircle,  Repeat2,  Bookmark,  Share,  MoreHorizontal,  Clock,  Verified,  ChevronDown,  ChevronUp} from 'lucide-react';import { formatDistanceToNow } from 'date-fns';import CommentInput from './comment-input';import CommentItem, { Comment } from './comment-item';export interface TimelinePost {  id: string;  content: string;  user: {    id: number;    name: string;    username: string;    avatar: string;    verified?: boolean;  };  createdAt: string;  stats: {    likes: number;    comments: number;    reposts: number;    bookmarks: number;  };  userInteractions: {    liked: boolean;    bookmarked: boolean;    reposted: boolean;  };  parentPost?: TimelinePost;  isRepost?: boolean;  repostUser?: {    name: string;    username: string;  };  comments?: Comment[];}interface TimelineItemProps {  post: TimelinePost;  onLike: (postId: string) => void;  onUnlike: (postId: string) => void;  onBookmark: (postId: string) => void;  onUnbookmark: (postId: string) => void;  onComment: (postId: string, content: string, parentId?: string) => Promise<void>;  onLikeComment: (commentId: string) => void;  onUnlikeComment: (commentId: string) => void;  onRepost: (postId: string) => void;  onShare: (postId: string) => void;  onUserClick: (username: string) => void;  onPostClick: (postId: string) => void;  currentUser: {    id: number;    name: string;    username: string;    avatar: string;  };}export default function TimelineItem({  post,  onLike,  onUnlike,  onBookmark,  onUnbookmark,  onComment,  onLikeComment,  onUnlikeComment,  onRepost,  onShare,  onUserClick,  onPostClick,  currentUser}: TimelineItemProps) {  const [localStats, setLocalStats] = useState(post.stats);  const [localInteractions, setLocalInteractions] = useState(post.userInteractions);  const [actionLoading, setActionLoading] = useState<string | null>(null);  const [showComments, setShowComments] = useState(false);  const [showCommentInput, setShowCommentInput] = useState(false);  const handleLike = async () => {    if (actionLoading) return;    setActionLoading('like');        try {      if (localInteractions.liked) {        await onUnlike(post.id);        setLocalStats(prev => ({ ...prev, likes: prev.likes - 1 }));        setLocalInteractions(prev => ({ ...prev, liked: false }));      } else {        await onLike(post.id);        setLocalStats(prev => ({ ...prev, likes: prev.likes + 1 }));        setLocalInteractions(prev => ({ ...prev, liked: true }));      }    } catch (error) {      console.error('Failed to like/unlike post:', error);    } finally {      setActionLoading(null);    }  };  const handleBookmark = async () => {    if (actionLoading) return;    setActionLoading('bookmark');        try {      if (localInteractions.bookmarked) {        await onUnbookmark(post.id);        setLocalStats(prev => ({ ...prev, bookmarks: prev.bookmarks - 1 }));        setLocalInteractions(prev => ({ ...prev, bookmarked: false }));      } else {        await onBookmark(post.id);        setLocalStats(prev => ({ ...prev, bookmarks: prev.bookmarks + 1 }));        setLocalInteractions(prev => ({ ...prev, bookmarked: true }));      }    } catch (error) {      console.error('Failed to bookmark/unbookmark post:', error);    } finally {      setActionLoading(null);    }  };  const handleComment = async (content: string, parentId?: string) => {    await onComment(post.id, content, parentId);    setShowCommentInput(false);    setLocalStats(prev => ({ ...prev, comments: prev.comments + 1 }));  };  const handleCommentClick = () => {    setShowCommentInput(true);    setShowComments(true);  };  const formatTimeAgo = (dateString: string) => {    try {      return formatDistanceToNow(new Date(dateString), { addSuffix: true });    } catch {      return 'some time ago';    }  };  const renderPost = (postData: TimelinePost, isParent = false) => (    <div className={`${isParent ? 'border border-border/30 rounded-lg p-3 mb-3' : ''}`}>      <div className="flex gap-3">        <Avatar           className={`${isParent ? 'h-8 w-8' : 'h-10 w-10'} mt-0.5 cursor-pointer hover:opacity-80 transition-opacity`}          onClick={() => onUserClick(postData.user.username)}        >          <AvatarImage src={postData.user.avatar} />          <AvatarFallback>{postData.user.name.charAt(0)}</AvatarFallback>        </Avatar>                <div className="flex-1 min-w-0">          <div className="flex items-center gap-1 flex-wrap">            <span               className={`font-medium ${isParent ? 'text-sm' : 'text-sm'} text-foreground hover:underline cursor-pointer flex items-center gap-1`}              onClick={() => onUserClick(postData.user.username)}            >              {postData.user.name}              {postData.user.verified && (                <Verified className="h-3 w-3 text-blue-500 fill-current" />              )}            </span>            <span className={`text-muted-foreground ${isParent ? 'text-xs' : 'text-xs'}`}>              @{postData.user.username}            </span>            <span className="text-muted-foreground text-xs">·</span>            <span               className={`text-muted-foreground ${isParent ? 'text-xs' : 'text-xs'} hover:underline cursor-pointer flex items-center gap-1`}              onClick={() => onPostClick(postData.id)}            >              <Clock className="h-3 w-3" />              {formatTimeAgo(postData.createdAt)}            </span>            {!isParent && (              <div className="ml-auto">                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted/40 rounded-full">                  <MoreHorizontal className="h-3 w-3 text-muted-foreground" />                </Button>              </div>            )}          </div>                    <div             className={`${isParent ? 'text-sm' : 'text-sm'} mt-1 leading-relaxed text-foreground cursor-pointer`}            onClick={() => onPostClick(postData.id)}          >            {postData.content}          </div>                    {!isParent && (            <div className="flex items-center justify-between mt-3 max-w-md">              <Button                 variant="ghost"                 size="sm"                 className="h-8 px-2 hover:bg-blue-50/50 hover:text-blue-600 rounded-full group transition-colors"                onClick={handleCommentClick}              >                <MessageCircle className="h-4 w-4 mr-1.5" />                <span className="text-xs">{localStats.comments || 0}</span>              </Button>                            <Button                 variant="ghost"                 size="sm"                 className="h-8 px-2 hover:bg-green-50/50 hover:text-green-600 rounded-full group transition-colors"                onClick={() => onRepost(postData.id)}                disabled={actionLoading === 'repost'}              >                <Repeat2 className="h-4 w-4 mr-1.5" />                <span className="text-xs">{localStats.reposts || 0}</span>              </Button>                            <Button                 variant="ghost"                 size="sm"                 className={`h-8 px-2 rounded-full group transition-colors ${                  localInteractions.liked                     ? 'text-red-600 hover:bg-red-50/50'                     : 'hover:bg-red-50/50 hover:text-red-600'                }`}                onClick={handleLike}                disabled={actionLoading === 'like'}              >                <Heart className={`h-4 w-4 mr-1.5 ${localInteractions.liked ? 'fill-current' : ''}`} />                <span className="text-xs">{localStats.likes || 0}</span>              </Button>                            <Button                 variant="ghost"                 size="sm"                 className={`h-8 px-2 rounded-full group transition-colors ${                  localInteractions.bookmarked                     ? 'text-yellow-600 hover:bg-yellow-50/50'                     : 'hover:bg-yellow-50/50 hover:text-yellow-600'                }`}                onClick={handleBookmark}                disabled={actionLoading === 'bookmark'}              >                <Bookmark className={`h-4 w-4 ${localInteractions.bookmarked ? 'fill-current' : ''}`} />              </Button>                            <Button                 variant="ghost"                 size="sm"                 className="h-8 px-2 hover:bg-blue-50/50 hover:text-blue-600 rounded-full group transition-colors"                onClick={() => onShare(postData.id)}              >                <Share className="h-4 w-4" />              </Button>            </div>          )}        </div>      </div>    </div>  );  return (
    <div className="px-4 py-3 border-b border-border/20 hover:bg-muted/20 transition-colors">
      {post.isRepost && post.repostUser && (
        <div className="flex items-center gap-2 mb-2 ml-7">
          <Repeat2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            <span 
              className="font-medium hover:underline cursor-pointer"
              onClick={() => onUserClick(post.repostUser!.username)}
            >
              {post.repostUser.name}
            </span> reposted
          </span>
        </div>
      )}
      
      {post.parentPost && renderPost(post.parentPost, true)}
      {renderPost(post)}
      
      {/* Comments Section */}
      {(showComments || showCommentInput) && (
        <div className="mt-4 pl-7">
          {/* Comment Input */}
          {showCommentInput && (
            <div className="mb-4">
              <CommentInput
                postId={post.id}
                onComment={handleComment}
                onCancel={() => setShowCommentInput(false)}
                user={currentUser}
              />
            </div>
          )}
          
          {/* Comments List */}
          {post.comments && post.comments.length > 0 && (
            <Collapsible open={showComments} onOpenChange={setShowComments}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 mb-2">
                  {showComments ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide comments
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show {post.comments.length} comments
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0">
                {post.comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    onLike={onLikeComment}
                    onUnlike={onUnlikeComment}
                    onReply={handleComment}
                    currentUser={currentUser}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
}
