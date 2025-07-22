import { fetchApi } from "./fetchApi";

export const socialApi = {
  follow: (followerId: number, followingId: number) =>
    fetchApi("api/v1/social/follow", {
      method: "POST",
      body: JSON.stringify({ followerId, followingId }),
    }),
  unfollow: (followerId: number, followingId: number) =>
    fetchApi("api/v1/social/unfollow", {
      method: "POST",
      body: JSON.stringify({ followerId, followingId }),
    }),
  createPost: (authorId: number, content: string) =>
    fetchApi("api/v1/social/post", {
      method: "POST",
      body: JSON.stringify({ authorId, content }),
    }),
  likePost: (userId: number, postId: number) =>
    fetchApi("api/v1/social/like", {
      method: "POST",
      body: JSON.stringify({ userId, postId }),
    }),
  unlikePost: (userId: number, postId: number) =>
    fetchApi("api/v1/social/unlike", {
      method: "POST",
      body: JSON.stringify({ userId, postId }),
    }),
  bookmarkPost: (userId: number, postId: number) =>
    fetchApi("api/v1/social/bookmark", {
      method: "POST",
      body: JSON.stringify({ userId, postId }),
    }),
  unbookmarkPost: (userId: number, postId: number) =>
    fetchApi("api/v1/social/unbookmark", {
      method: "POST",
      body: JSON.stringify({ userId, postId }),
    }),
  createComment: (authorId: number, postId: number, content: string, parentId?: number) =>
    fetchApi("api/v1/social/comment", {
      method: "POST",
      body: JSON.stringify({ authorId, postId, content, parentId }),
    }),
  likeComment: (userId: number, commentId: number) =>
    fetchApi("api/v1/social/like-comment", {
      method: "POST",
      body: JSON.stringify({ userId, commentId }),
    }),
  unlikeComment: (userId: number, commentId: number) =>
    fetchApi("api/v1/social/unlike-comment", {
      method: "POST",
      body: JSON.stringify({ userId, commentId }),
    }),
  bookmarkComment: (userId: number, commentId: number) =>
    fetchApi("api/v1/social/bookmark-comment", {
      method: "POST",
      body: JSON.stringify({ userId, commentId }),
    }),
  unbookmarkComment: (userId: number, commentId: number) =>
    fetchApi("api/v1/social/unbookmark-comment", {
      method: "POST",
      body: JSON.stringify({ userId, commentId }),
    }),
};
