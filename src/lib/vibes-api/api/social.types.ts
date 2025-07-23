export interface CreatePostBody {
  content: string;
}

export interface CreateCommentBody {
  postId: number;
  content: string;
  parentId?: number;
}

export interface LikePostBody {
  postId: number;
}

export interface LikeCommentBody {
  commentId: number;
}

export interface BookmarkPostBody {
  postId: number;
}

export interface BookmarkCommentBody {
  commentId: number;
}
