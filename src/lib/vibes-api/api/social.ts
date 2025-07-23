import { fetchApi } from "./fetchApi";
import type {
  CreatePostBody,
  CreateCommentBody,
  LikePostBody,
  LikeCommentBody,
  BookmarkPostBody,
  BookmarkCommentBody,
} from "./social.types";

export const socialApi = {
  getTimeline: (limit = 20) =>
    fetchApi(`api/v1/social/timeline?limit=${limit}`, {
      method: "GET",
    }),
  follow: (followingId: number) =>
    fetchApi("api/v1/social/follow", {
      method: "POST",
      body: JSON.stringify({ followingId }),
    }),
  unfollow: (followingId: number) =>
    fetchApi("api/v1/social/unfollow", {
      method: "POST",
      body: JSON.stringify({ followingId }),
    }),
  createPost: (content: string) =>
    fetchApi("api/v1/social/post", {
      method: "POST",
      body: JSON.stringify({ content } as CreatePostBody),
    }),
  likePost: (postId: number) =>
    fetchApi("api/v1/social/like", {
      method: "POST",
      body: JSON.stringify({ postId } as LikePostBody),
    }),
  unlikePost: (postId: number) =>
    fetchApi("api/v1/social/unlike", {
      method: "POST",
      body: JSON.stringify({ postId } as LikePostBody),
    }),
  bookmarkPost: (postId: number) =>
    fetchApi("api/v1/social/bookmark", {
      method: "POST",
      body: JSON.stringify({ postId } as BookmarkPostBody),
    }),
  unbookmarkPost: (postId: number) =>
    fetchApi("api/v1/social/unbookmark", {
      method: "POST",
      body: JSON.stringify({ postId } as BookmarkPostBody),
    }),
  createComment: (postId: number, content: string, parentId?: number) =>
    fetchApi("api/v1/social/comment", {
      method: "POST",
      body: JSON.stringify({ postId, content, parentId } as CreateCommentBody),
    }),
  likeComment: (commentId: number) =>
    fetchApi("api/v1/social/like-comment", {
      method: "POST",
      body: JSON.stringify({ commentId } as LikeCommentBody),
    }),
  unlikeComment: (commentId: number) =>
    fetchApi("api/v1/social/unlike-comment", {
      method: "POST",
      body: JSON.stringify({ commentId } as LikeCommentBody),
    }),
  bookmarkComment: (commentId: number) =>
    fetchApi("api/v1/social/bookmark-comment", {
      method: "POST",
      body: JSON.stringify({ commentId } as BookmarkCommentBody),
    }),
  unbookmarkComment: (commentId: number) =>
    fetchApi("api/v1/social/unbookmark-comment", {
      method: "POST",
      body: JSON.stringify({ commentId } as BookmarkCommentBody),
    }),
};
