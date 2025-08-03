import React from 'react';
import { cn } from '@/utils/tailwind';
import "./styles/tiptap.css";
import { MarkdownEditorToolbar } from './markdown/markdown-editor-toolbar';
import { MarkdownEditorOutline } from './markdown/markdown-editor-outline';
import { useMarkdownEditor } from './markdown/useMarkdownEditor';
import { MarkdownEditorProps } from './types';
import { EditorContent, useEditor } from '@tiptap/react';
import { MarkdownSearch } from './markdown/markdown-search';
import { useMarkdownSearch } from './markdown/useMarkdownSearch';
import { Button } from '@/components/ui/button';
import { TableOfContentsIcon } from 'lucide-react';

export function MarkdownEditor(props: MarkdownEditorProps) {
  const {
    editorRef,
    editor,
    isOutlineVisible,
    setIsOutlineVisible,
    headings,
    jumpToHeading,
  } = useMarkdownEditor(props);

  // --- Search State ---
  const {
    isSearchVisible,
    setIsSearchVisible,
    searchQuery,
    setSearchQuery,
    searchMatches,
    setSearchMatches,
    currentMatchIdx,
    setCurrentMatchIdx,
    gotoPrev,
    gotoNext,
    onClose,
  } = useMarkdownSearch(editor);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading markdown editor...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Search Bar */}
      <MarkdownSearch
        key="markdown-search"
        isVisible={isSearchVisible}
        query={searchQuery}
        setQuery={setSearchQuery}
        matches={searchMatches}
        currentIdx={currentMatchIdx}
        gotoPrev={gotoPrev}
        gotoNext={gotoNext}
        onClose={onClose}
      />

      {/* Toolbar and header */}
      <div className="border-b border-border bg-background/50 p-2 flex flex-col sticky top-0 z-20">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm text-muted-foreground">Markdown Editor</div>
        </div>
        <MarkdownEditorToolbar editor={editor} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-auto bg-background py-2 px-3">
          <EditorContent
            ref={editorRef}
            editor={editor}
            className="h-full min-h-full"
            tabIndex={0}
          />
        </div>
        <MarkdownEditorOutline
          headings={headings}
          isVisible={isOutlineVisible}
          onJump={jumpToHeading}
          onHide={() => setIsOutlineVisible(false)}
          editor={editor}
          fileId={props.buffer.filePath || props.buffer.id}
        />
      </div>

      {/* Outline toggle button when hidden */}
      {!isOutlineVisible && !isSearchVisible && (
        <Button
          variant="ghost"
          onClick={() => setIsOutlineVisible(true)}
          className="absolute top-2 right-4 z-50 text-xs"
        >
          <TableOfContentsIcon size={16} className="text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
