import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

interface SearchResult {
  from: number;
  to: number;
}

export function useMarkdownSearch(editor: Editor | null) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Find matches in the document
  const findMatches = useCallback((query: string): SearchResult[] => {
    if (!editor || !query.trim()) return [];
    
    const results: SearchResult[] = [];
    const { doc } = editor.state;
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    
    // Get all text content with positions
    let textPos = 0;
    const textMap: Array<{ char: string; pos: number }> = [];
    
    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        for (let i = 0; i < node.text.length; i++) {
          textMap.push({ char: node.text[i], pos: pos + i });
        }
      }
    });
    
    const fullText = textMap.map(item => item.char).join('');
    let match;
    
    while ((match = searchRegex.exec(fullText)) !== null) {
      const from = textMap[match.index]?.pos;
      const to = textMap[match.index + query.length - 1]?.pos + 1;
      
      if (from !== undefined && to !== undefined) {
        results.push({ from, to });
      }
      
      // Prevent infinite loop
      if (match.index === searchRegex.lastIndex) {
        searchRegex.lastIndex++;
      }
    }
    
    return results;
  }, [editor]);

  // Update search results only
  const updateSearchMatches = useCallback((query: string) => {
    if (!editor) return;

    if (!query.trim()) {
      setSearchResults([]);
      setCurrentMatchIdx(0);
      return;
    }

    // Find new matches
    const results = findMatches(query);
    setSearchResults(results);
    setCurrentMatchIdx(0);
  }, [editor, findMatches]);

  // Jump to a specific match (just select and scroll)
  const jumpToMatch = useCallback((idx: number) => {
    if (!editor || !searchResults.length || idx < 0 || idx >= searchResults.length) return;
    const result = searchResults[idx];
    editor.commands.setTextSelection({ from: result.from, to: result.to });
    editor.commands.scrollIntoView();
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
    setIsSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentMatchIdx(0);
  }, []);

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
