import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Comment {
  id: string;
  fileId: string; // unique file path
  text: string;
  status: 'open' | 'resolved';
  startPos: number;
  endPos: number;
  selectedText: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentsState {
  comments: Record<string, Comment[]>; // fileId -> comments[]
  addComment: (fileId: string, comment: Omit<Comment, 'id' | 'fileId' | 'createdAt' | 'updatedAt'>) => string;
  updateComment: (commentId: string, updates: Partial<Pick<Comment, 'text' | 'status'>>) => void;
  deleteComment: (commentId: string) => void;
  getCommentsForFile: (fileId: string) => Comment[];
  getCommentById: (commentId: string) => Comment | undefined;
  resolveComment: (commentId: string) => void;
  reopenComment: (commentId: string) => void;
}

export const useCommentsStore = create<CommentsState>()(
  persist(
    (set, get) => ({
      comments: {},
      
      addComment: (fileId, commentData) => {
        const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const comment: Comment = {
          ...commentData,
          id,
          fileId,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          comments: {
            ...state.comments,
            [fileId]: [...(state.comments[fileId] || []), comment],
          },
        }));
        
        return id; // Return the generated ID
      },
      
      updateComment: (commentId, updates) => {
        set((state) => {
          const newComments = { ...state.comments };
          for (const fileId in newComments) {
            const fileComments = newComments[fileId];
            const commentIndex = fileComments.findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
              newComments[fileId] = [
                ...fileComments.slice(0, commentIndex),
                {
                  ...fileComments[commentIndex],
                  ...updates,
                  updatedAt: new Date(),
                },
                ...fileComments.slice(commentIndex + 1),
              ];
              break;
            }
          }
          return { comments: newComments };
        });
      },
      
      deleteComment: (commentId) => {
        set((state) => {
          const newComments = { ...state.comments };
          for (const fileId in newComments) {
            newComments[fileId] = newComments[fileId].filter(c => c.id !== commentId);
            if (newComments[fileId].length === 0) {
              delete newComments[fileId];
            }
          }
          return { comments: newComments };
        });
      },
      
      getCommentsForFile: (fileId) => {
        return get().comments[fileId] || [];
      },
      
      getCommentById: (commentId) => {
        const { comments } = get();
        for (const fileId in comments) {
          const comment = comments[fileId].find(c => c.id === commentId);
          if (comment) return comment;
        }
        return undefined;
      },
      
      resolveComment: (commentId) => {
        get().updateComment(commentId, { status: 'resolved' });
      },
      
      reopenComment: (commentId) => {
        get().updateComment(commentId, { status: 'open' });
      },
    }),
    {
      name: 'comments-store',
      version: 1,
      partialize: (state) => ({
        comments: Object.fromEntries(
          Object.entries(state.comments).map(([fileId, comments]) => [
            fileId,
            comments.map(comment => ({
              ...comment,
              createdAt: comment.createdAt.toISOString(),
              updatedAt: comment.updatedAt.toISOString(),
            }))
          ])
        )
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.comments) {
          Object.keys(state.comments).forEach(fileId => {
            state.comments[fileId] = state.comments[fileId].map(comment => ({
              ...comment,
              createdAt: new Date(comment.createdAt),
              updatedAt: new Date(comment.updatedAt),
            }));
          });
        }
      },
    }
  )
);
