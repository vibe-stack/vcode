import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { getSearchResults } from './search-extension';

interface SearchResult {
  from: number;
  to: number;
}

export function useMarkdownSearch(editor: Editor | null) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Find matches using the search extension
  const findMatches = useCallback((query: string): SearchResult[] => {
    if (!editor || !query.trim()) return [];
    
    // Use the search extension to get results
    return getSearchResults(editor);
  }, [editor]);

  // Update search results and highlighting
  const updateSearchMatches = useCallback((query: string) => {
    if (!editor) return;

    if (!query.trim()) {
      // Clear search highlighting
      editor.commands.clearMarkdownSearch();
      setSearchResults([]);
      setCurrentMatchIdx(0);
      return;
    }

    // Update search term in the extension (this will trigger highlighting)
    editor.commands.setMarkdownSearchTerm(query, 0);
    
    // Get the results after a short delay to allow the extension to update
    setTimeout(() => {
      const results = getSearchResults(editor);
      setSearchResults(results);
      setCurrentMatchIdx(0);
    }, 10);
  }, [editor]);

  // Jump to a specific match with proper highlighting
  const jumpToMatch = useCallback((idx: number) => {
    if (!editor || !searchResults.length || idx < 0 || idx >= searchResults.length) return;
    
    const result = searchResults[idx];
    
    // Update the current index in the search extension (this will update highlighting)
    editor.commands.setMarkdownSearchIndex(idx);
    
    // Set selection WITHOUT focusing or using scrollIntoView
    editor.commands.setTextSelection({ from: result.from, to: result.to });
    
    // Custom scroll implementation using ProseMirror's coordsAtPos
    try {
      const coords = editor.view.coordsAtPos(result.from);
      const editorDom = editor.view.dom;
      
      // Find the scrollable container (could be the editor itself or a parent)
      let scrollContainer = editorDom;
      while (scrollContainer && scrollContainer.parentElement) {
        const style = window.getComputedStyle(scrollContainer);
        if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
          break;
        }
        scrollContainer = scrollContainer.parentElement;
      }
      
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const scrollTop = scrollContainer.scrollTop;
        const targetY = coords.top - containerRect.top + scrollTop;
        
        // Center the target in the container
        const centerOffset = containerRect.height / 2;
        const scrollTo = targetY - centerOffset;
        
        scrollContainer.scrollTo({
          top: Math.max(0, scrollTo),
          behavior: 'instant'
        });
      }
    } catch (error) {
      // Fallback: try to find the DOM element and scroll it into view
      try {
        const domPos = editor.view.domAtPos(result.from);
        if (domPos.node && domPos.node.nodeType === Node.TEXT_NODE && domPos.node.parentElement) {
          domPos.node.parentElement.scrollIntoView({
            behavior: 'instant',
            block: 'center'
          });
        }
      } catch (fallbackError) {
        console.warn('Could not scroll to search result:', error, fallbackError);
      }
    }
  }, [editor, searchResults]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only handle shortcuts if search is not focused
      const activeElement = document.activeElement;
      const isSearchFocused = activeElement?.closest('.search-input');
      
      const isMac = navigator.platform.toLowerCase().includes('mac');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'f' && !isSearchFocused) {
        e.preventDefault();
        setIsSearchVisible(true);
      } else if (e.key === 'Escape' && isSearchVisible) {
        e.preventDefault();
        closeSearch();
      }
    };
    
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isSearchVisible]);

  // Update matches when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateSearchMatches(searchQuery);
    }, 100); // Debounce search
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, updateSearchMatches]);

  // Jump to current match when index changes
  useEffect(() => {
    if (searchResults.length > 0) {
      jumpToMatch(currentMatchIdx);
    }
  }, [currentMatchIdx, jumpToMatch]);

  // Arrow navigation
  const gotoPrev = useCallback(() => {
    if (!searchResults.length) return;
    setCurrentMatchIdx((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  }, [searchResults.length]);
  
  const gotoNext = useCallback(() => {
    if (!searchResults.length) return;
    setCurrentMatchIdx((prev) => (prev + 1) % searchResults.length);
  }, [searchResults.length]);

  // Close search and clean up
  const closeSearch = useCallback(() => {
    if (editor) {
      editor.commands.clearMarkdownSearch();
    }
    setIsSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentMatchIdx(0);
  }, [editor]);

  // Memoize setSearchQuery to prevent unnecessary re-renders
  const setSearchQueryMemo = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    isSearchVisible,
    setIsSearchVisible,
    searchQuery,
    setSearchQuery: setSearchQueryMemo,
    searchMatches: searchResults,
    setSearchMatches: setSearchResults,
    currentMatchIdx,
    setCurrentMatchIdx,
    gotoPrev,
    gotoNext,
    onClose: closeSearch,
  };
}
