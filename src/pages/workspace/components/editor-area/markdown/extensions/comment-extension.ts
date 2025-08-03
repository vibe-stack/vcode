import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, any>;
  onCommentClick?: (commentId: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Set a comment mark
       */
      setComment: (commentId: string) => ReturnType;
      /**
       * Toggle a comment mark
       */
      toggleComment: (commentId: string) => ReturnType;
      /**
       * Unset a comment mark
       */
      unsetComment: () => ReturnType;
    };
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
      onCommentClick: undefined,
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {};
          }
          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'comment-mark bg-yellow-100/20 border-b border-dashed border-yellow-400/30 dark:bg-yellow-900/15 dark:border-yellow-600/30',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId });
        },
      toggleComment:
        (commentId: string) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, { commentId });
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('commentClickHandler'),
        props: {
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            const commentElement = target.closest('[data-comment-id]');
            
            if (commentElement && this.options.onCommentClick) {
              const commentId = commentElement.getAttribute('data-comment-id');
              if (commentId) {
                this.options.onCommentClick(commentId);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
