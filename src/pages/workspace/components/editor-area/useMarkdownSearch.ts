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

  // Add search highlight CSS
  useEffect(() => {
    const styleId = 'search-highlight-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .ProseMirror .search-highlight { 
          background: rgba(255, 235, 59, 0.6) !important;
          border-radius: 2px;
        }
        .ProseMirror .search-highlight.current { 
          background: rgba(255, 152, 0, 0.8) !important;
          color: white !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Clear all search highlights from DOM
  const clearHighlights = useCallback(() => {
    if (!editor) return;
    
    const editorElement = editor.view.dom;
    const highlights = editorElement.querySelectorAll('.search-highlight');
    
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        // Replace the highlight span with its text content
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        // Normalize the parent to merge adjacent text nodes
        parent.normalize();
      }
    });
  }, [editor]);

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

  // Add highlights to the DOM directly
  const addHighlights = useCallback((results: SearchResult[]) => {
    if (!editor || !results.length) return;
    
    results.forEach((result, index) => {
      // Create a temporary selection to get the DOM range
      editor.commands.setTextSelection({ from: result.from, to: result.to });
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        try {
          // Create highlight span
          const span = document.createElement('span');
          span.className = `search-highlight ${index === currentMatchIdx ? 'current' : ''}`;
          span.setAttribute('data-search-index', index.toString());
          
          // Extract contents and wrap in span
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
          
          // Clear selection
          selection.removeAllRanges();
        } catch (error) {
          console.warn('Failed to highlight match:', error);
        }
      }
    });
  }, [editor, currentMatchIdx]);

  // Update search results and highlights
  const updateSearchMatches = useCallback((query: string) => {
    if (!editor) return;
    
    // Clear previous highlights
    clearHighlights();
    
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentMatchIdx(0);
      return;
    }
    
    // Find new matches
    const results = findMatches(query);
    setSearchResults(results);
    setCurrentMatchIdx(0);
    
    // Add highlights
    setTimeout(() => {
      addHighlights(results);
    }, 10);
  }, [editor, clearHighlights, findMatches, addHighlights]);

  // Jump to a specific match
  const jumpToMatch = useCallback((idx: number) => {
    if (!editor || !searchResults.length || idx < 0 || idx >= searchResults.length) return;
    
    const result = searchResults[idx];
    
    // Update highlight classes
    const highlights = editor.view.dom.querySelectorAll('.search-highlight');
    highlights.forEach((highlight, index) => {
      if (index === idx) {
        highlight.classList.add('current');
      } else {
        highlight.classList.remove('current');
      }
    });
    
    // Scroll to the match
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
  const gotoPrev = () => {
    if (!searchResults.length) return;
    setCurrentMatchIdx((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  };
  
  const gotoNext = () => {
    if (!searchResults.length) return;
    setCurrentMatchIdx((prev) => (prev + 1) % searchResults.length);
  };

  // Close search and clean up
  const closeSearch = useCallback(() => {
    clearHighlights();
    setIsSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentMatchIdx(0);
  }, [clearHighlights]);

  return {
    isSearchVisible,
    setIsSearchVisible,
    searchQuery,
    setSearchQuery,
    searchMatches: searchResults,
    setSearchMatches: setSearchResults,
    currentMatchIdx,
    setCurrentMatchIdx,
    gotoPrev,
    gotoNext,
    onClose: closeSearch,
  };
}
