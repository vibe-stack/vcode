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
          <div className="text-xs text-muted-foreground">{headings.length} headings</div>
        </div>
        <MarkdownEditorToolbar editor={editor} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-auto">
          <EditorContent
            ref={editorRef}
            editor={editor}
            className="h-full"
            tabIndex={0}
          />
        </div>
        <MarkdownEditorOutline
          headings={headings}
          isVisible={isOutlineVisible}
          onJump={jumpToHeading}
          onHide={() => setIsOutlineVisible(false)}
        />
      </div>

      {/* Outline toggle button when hidden */}
      {!isOutlineVisible && !isSearchVisible && (
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
