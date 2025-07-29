import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { HardBreak } from '@tiptap/extension-hard-break';
import { History } from '@tiptap/extension-history';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
import { BufferContent } from '@/stores/buffers';
import { cn } from '@/utils/tailwind';
// import { MarkdownToolbar } from './markdown-toolbar';
// import { MarkdownOutline } from './markdown-outline';
import { useBufferSyncManager } from './hooks/useBufferSyncManager';
import "./styles/tiptap.css"

export interface MarkdownEditorProps {
  /** The buffer to edit */
  buffer: BufferContent;
  /** Whether this editor is focused/active */
  isFocused?: boolean;
  /** Called when content changes */
  onChange?: (content: string) => void;
  /** Called when editor gains focus */
  onFocus?: () => void;
}

interface HeadingNode {
  id: string;
  level: number;
  text: string;
  position: number;
}

// Initialize markdown parser and HTML-to-markdown converter
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

/**
 * Comprehensive markdown editor using TipTap with outline viewer
 */
export function MarkdownEditor({ buffer, isFocused = false, onChange, onFocus }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isOutlineVisible, setIsOutlineVisible] = useState(true);
  const [headings, setHeadings] = useState<HeadingNode[]>([]);

  // Use the buffer sync manager for high-performance sync
  const { 
    localContent, 
    isDirty, 
    updateLocalContent, 
    saveBuffer 
  } = useBufferSyncManager(buffer);

  // Convert buffer content to string
  const markdownContent = useMemo(() => {
    if (typeof localContent === 'string') {
      return localContent;
    }
    if (typeof buffer.content === 'string') {
      return buffer.content;
    }
    if (buffer.content instanceof Uint8Array) {
      return new TextDecoder().decode(buffer.content);
    }
    return '';
  }, [localContent, buffer.content]);

  // Update headings for outline
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

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
            class: "text-base"
        }
      }),
      Text.configure({
        HTMLAttributes: {
            class: "text-base"
        }
      }),
      Bold,
      Italic,
      Strike,
      Underline,
      Code,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-zinc-100 dark:bg-zinc-900 p-3 rounded border font-mono text-xs whitespace-pre overflow-x-auto',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic text-zinc-700 dark:text-zinc-300 my-2',
        },
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {
          class: 'font-bold mt-4 mb-2',
        },
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'border-t border-zinc-300 dark:border-zinc-700 my-6',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc ml-6',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal ml-6',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'mb-1',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none ml-0 pl-0',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-center gap-2 mb-1',
        },
        nested: true,
      }),
      Link.configure({
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 transition-colors',
        },
        openOnClick: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-zinc-300 dark:border-zinc-700 my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 font-semibold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-zinc-300 dark:border-zinc-700 p-2',
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded',
        },
      }),
      Subscript,
      Superscript,
      HardBreak,
      History,
    ],
    content: markdownContent,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const markdown = htmlToMarkdown(content);
      updateLocalContent(markdown);
      onChange?.(markdown);
      updateHeadings(editor);
    },
    onFocus: () => {
      onFocus?.();
    },
  });

  // Update editor content when buffer changes externally
  useEffect(() => {
    if (editor && markdownContent) {
      // Get current content as markdown for comparison
      const currentMarkdown = htmlToMarkdown(editor.getHTML());
      if (markdownContent !== currentMarkdown) {
        const html = markdownToHtml(markdownContent);
        editor.commands.setContent(html, { emitUpdate: false });
        updateHeadings(editor);
      }
    }
  }, [markdownContent, editor, updateHeadings]);

  // Focus the editor when pane becomes active
  useEffect(() => {
    if (isFocused && editor) {
      editor.commands.focus();
    }
  }, [isFocused, editor]);

  // Jump to heading
  const jumpToHeading = useCallback((heading: HeadingNode) => {
    if (editor) {
      editor.commands.setTextSelection(heading.position);
      editor.commands.scrollIntoView();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading markdown editor...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">

      {/* Toolbar placeholder */}
      <div className="border-b border-border bg-background/50 p-2 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Markdown Editor</div>
        <div className="text-xs text-muted-foreground">
          {headings.length} headings
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-auto">
          <EditorContent
            ref={editorRef}
            editor={editor}
            className="h-full"
          />
        </div>

        {/* Outline Sidebar - Simple version */}
        {isOutlineVisible && headings.length > 0 && (
          <div className="w-64 border-l border-border bg-background/50 overflow-auto">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Outline</span>
                <button
                  onClick={() => setIsOutlineVisible(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => jumpToHeading(heading)}
                  className={cn(
                    "w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors",
                    `pl-${2 + heading.level * 2}`
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">H{heading.level}</span>
                    <span className="truncate">{heading.text || `Heading ${heading.level}`}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Outline toggle button when hidden */}
      {!isOutlineVisible && (
        <button
          onClick={() => setIsOutlineVisible(true)}
          className="absolute top-2 right-2 z-10 px-3 py-1 bg-background border border-border rounded-md text-sm hover:bg-muted transition-colors"
        >
          Show Outline
        </button>
      )}
    </div>
  );
}

// Utility functions for markdown conversion
function markdownToHtml(markdown: string): string {
  return md.render(markdown);
}

function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}
