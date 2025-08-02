import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBufferSyncManager } from '../hooks/useBufferSyncManager';
import { useBufferStore } from '@/stores/buffers';
import { htmlToMarkdown, markdownToHtml } from './markdownUtils';
import { HeadingNode, MarkdownEditorProps } from '../types';
import { EditorContent, useEditor } from '@tiptap/react';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { Underline } from '@tiptap/extension-underline';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Heading } from '@tiptap/extension-heading';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { mergeAttributes } from '@tiptap/core';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { HardBreak } from '@tiptap/extension-hard-break';
import { History } from '@tiptap/extension-history';
import { SearchExtension } from './search-extension';

export function useMarkdownEditor({ buffer, isFocused = false, onChange, onFocus }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [, setSelectionState] = useState(0);
  const [isOutlineVisible, setIsOutlineVisible] = useState(true);
  const [headings, setHeadings] = useState<HeadingNode[]>([]);
  const { localContent, isDirty, updateLocalContent, saveBuffer } = useBufferSyncManager(buffer);
  const updateBufferContent = useBufferStore(state => state.updateBufferContent);
  const setBufferDirty = useBufferStore(state => state.setBufferDirty);

  const markdownContent = useMemo(() => {
    if (typeof localContent === 'string') return localContent;
    if (typeof buffer.content === 'string') return buffer.content;
    if (buffer.content instanceof Uint8Array) return new TextDecoder().decode(buffer.content);
    return '';
  }, [localContent, buffer.content]);

  const updateHeadings = useCallback((editor: any) => {
    const headingNodes: HeadingNode[] = [];
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        headingNodes.push({
          id: `heading-${pos}`,
          level: node.attrs.level,
          text: node.textContent,
          position: pos,
        });
      }
    });
    setHeadings(headingNodes);
  }, []);

  useEffect(() => {
    setBufferDirty(buffer.id, isDirty);
  }, [isDirty, buffer.id, setBufferDirty]);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({ HTMLAttributes: { class: 'text-base' } }),
      Text.configure({ HTMLAttributes: { class: 'text-base' } }),
      Bold, Italic, Strike, Underline, Code,
      CodeBlock.configure({ HTMLAttributes: { class: 'bg-zinc-100 dark:bg-zinc-900 p-3 rounded border font-mono text-xs whitespace-pre overflow-x-auto' } }),
      Blockquote.configure({ HTMLAttributes: { class: 'border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic text-zinc-700 dark:text-zinc-300 my-2' } }),
      Heading.configure({ levels: [1,2,3,4,5,6], HTMLAttributes: { class: 'font-bold mt-4 mb-2' } }),
      HorizontalRule.configure({ HTMLAttributes: { class: 'border-t border-zinc-300 dark:border-zinc-700 my-6' } }),
      BulletList.configure({ HTMLAttributes: { class: 'list-disc ml-6' } }),
      OrderedList.configure({ HTMLAttributes: { class: 'list-decimal ml-6' } }),
      ListItem.configure({ HTMLAttributes: { class: 'mb-1' } }),
      TaskList.configure({ HTMLAttributes: { class: 'list-none ml-0 pl-0' } }),
      TaskItem.configure({ HTMLAttributes: { class: 'flex items-center gap-2 mb-1' }, nested: true }),
      Link.configure({ HTMLAttributes: { class: 'text-blue-600 underline hover:text-blue-800 transition-colors' }, openOnClick: false }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded' } }),
      Table.extend({
        renderHTML({ node, HTMLAttributes }) {
          return [ 'table', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ['tbody', 0] ];
        },
      }).configure({ resizable: true, HTMLAttributes: { class: 'border-collapse border border-zinc-300 dark:border-zinc-700 my-4' } }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: { class: 'border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 font-semibold p-2' } }),
      TableCell.configure({ HTMLAttributes: { class: 'border border-zinc-300 dark:border-zinc-700 p-2' } }),
      Highlight.configure({ HTMLAttributes: { class: 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded' } }),
      SearchExtension,
      Subscript, Superscript, HardBreak, History,
    ],
    content: markdownContent,
    editorProps: {
      attributes: { class: 'prose dark:prose-invert max-w-none focus:outline-none p-4' },
      handlePaste(view, event, slice) {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;
        const text = clipboardData.getData('text/plain');
        const isLikelyMarkdown = /[#*_`\-\[\]>]|\n\s*\d+\./.test(text);
        if (isLikelyMarkdown) {
          const html = markdownToHtml(text);
          const editor = view['editor'];
          if (editor && typeof editor.commands.insertContent === 'function') {
            editor.commands.insertContent(html);
            return true;
          }
        }
        return false;
      },
      handleKeyDown(view, event) {
        if (event.key === 'Tab') {
          const { state, dispatch } = view;
          const editor = view['editor'];
          if (editor) {
            if (event.shiftKey) {
              if (editor.can().sinkListItem('listItem')) {
                editor.chain().focus().liftListItem('listItem').run();
                event.preventDefault();
                return true;
              }
            } else {
              if (editor.can().sinkListItem('listItem')) {
                editor.chain().focus().sinkListItem('listItem').run();
                event.preventDefault();
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const markdown = htmlToMarkdown(content);
      updateLocalContent(markdown);
      updateBufferContent(buffer.id, markdown);
      setBufferDirty(buffer.id, markdown !== (typeof buffer.content === 'string' ? buffer.content : new TextDecoder().decode(buffer.content || new Uint8Array())));
      onChange?.(markdown);
      updateHeadings(editor);
    },
    onSelectionUpdate: () => {
      setSelectionState(s => s + 1);
    },
    onFocus: () => {
      onFocus?.();
    },
  });

  useEffect(() => {
    if (editor && markdownContent) {
      const currentMarkdown = htmlToMarkdown(editor.getHTML());
      if (markdownContent !== currentMarkdown) {
        const html = markdownToHtml(markdownContent);
        editor.commands.setContent(html, { emitUpdate: false });
        updateHeadings(editor);
      }
    }
  }, [markdownContent, editor, updateHeadings]);

  useEffect(() => {
    if (isFocused && editor) {
      editor.commands.focus();
    }
  }, [isFocused, editor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveBuffer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveBuffer]);

  const jumpToHeading = useCallback((heading: HeadingNode) => {
    if (editor) {
      editor.commands.setTextSelection(heading.position);
      editor.commands.scrollIntoView();
    }
  }, [editor]);

  return {
    editorRef,
    editor,
    isOutlineVisible,
    setIsOutlineVisible,
    headings,
    jumpToHeading,
  };
}
