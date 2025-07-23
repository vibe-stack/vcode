import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vibesApi } from '@/lib/vibes-api';

// Types based on the actual API response
export interface TimelineAuthor {
  id: string;
  name: string;
}

export interface TimelinePostData {
  id: number;
  authorId: string;
  content: string;
  createdAt: number;
  author: TimelineAuthor;
}

export interface TimelineResponse {
  timeline: TimelinePostData[];
}

// Query keys
export const socialKeys = {
  all: ['social'] as const,
  timeline: () => [...socialKeys.all, 'timeline'] as const,
  post: (id: number) => [...socialKeys.all, 'post', id] as const,
};

// Timeline query
export function useTimeline(limit = 20) {
  return useQuery({
    queryKey: [...socialKeys.timeline(), limit],
    queryFn: async (): Promise<TimelineResponse> => {
      const response = await vibesApi.social.getTimeline(limit);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Create post mutation
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await vibesApi.social.createPost(content);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch timeline
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });
}

// Like post mutation
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await vibesApi.social.likePost(postId);
      if (!response.ok) {
        throw new Error('Failed to like post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}

// Unlike post mutation
export function useUnlikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await vibesApi.social.unlikePost(postId);
      if (!response.ok) {
        throw new Error('Failed to unlike post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}

// Bookmark post mutation
export function useBookmarkPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await vibesApi.social.bookmarkPost(postId);
      if (!response.ok) {
        throw new Error('Failed to bookmark post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}

// Unbookmark post mutation
export function useUnbookmarkPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      const response = await vibesApi.social.unbookmarkPost(postId);
      if (!response.ok) {
        throw new Error('Failed to unbookmark post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}

// Create comment mutation
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { 
      postId: number; 
      content: string; 
      parentId?: number;
    }) => {
      const response = await vibesApi.social.createComment(postId, content, parentId);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}

// Like comment mutation
export function useLikeComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const response = await vibesApi.social.likeComment(commentId);
      if (!response.ok) {
        throw new Error('Failed to like comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}

// Unlike comment mutation
export function useUnlikeComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const response = await vibesApi.social.unlikeComment(commentId);
      if (!response.ok) {
        throw new Error('Failed to unlike comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}

// Follow user mutation
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await vibesApi.social.follow(userId);
      if (!response.ok) {
        throw new Error('Failed to follow user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}

// Unfollow user mutation
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await vibesApi.social.unfollow(userId);
      if (!response.ok) {
        throw new Error('Failed to unfollow user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.timeline() });
    },
  });
}
