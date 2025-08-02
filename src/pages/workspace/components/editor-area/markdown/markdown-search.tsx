import React, { useEffect, useRef, useCallback } from 'react';

interface MarkdownSearchProps {
  isVisible: boolean;
  query: string;
  setQuery: (q: string) => void;
  matches: any[]; // Changed to accept SearchResult[] but keeping flexible
  currentIdx: number;
  gotoPrev: () => void;
  gotoNext: () => void;
  onClose: () => void;
}

export const MarkdownSearch: React.FC<MarkdownSearchProps> = ({
  isVisible,
  query,
  setQuery,
  matches,
  currentIdx,
  gotoPrev,
  gotoNext,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Stable event handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, [setQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); gotoNext(); }
    else if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); gotoNext(); }
    else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) { e.preventDefault(); gotoPrev(); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }, [gotoNext, gotoPrev, onClose]);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isVisible]);
  
  if (!isVisible) return null;

  return (
    <div className="absolute top-2 right-2 z-30 flex items-center gap-2 bg-background border border-border rounded-md px-2 py-1 shadow-lg animate-in fade-in">
      <input
        ref={inputRef}
        type="text"
        className="search-input px-2 py-1 text-sm bg-transparent outline-none min-w-[120px]"
        placeholder="Search..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <span className="text-xs text-muted-foreground select-none">
        {matches.length > 0 ? `${currentIdx + 1} / ${matches.length}` : 'No matches'}
      </span>
      <button
        className="px-1 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        onClick={gotoPrev}
        aria-label="Previous match"
        disabled={!matches.length}
      >&#8593;</button>
      <button
        className="px-1 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        onClick={gotoNext}
        aria-label="Next match"
        disabled={!matches.length}
      >&#8595;</button>
      <button
        className="ml-1 px-1 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        onClick={onClose}
        aria-label="Close search"
      >&#10005;</button>
    </div>
  );
};
