import '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    markdownSearch: {
      /**
       * Set the search term and optionally the current index
       */
      setMarkdownSearchTerm: (searchTerm: string, currentIndex?: number) => ReturnType;
      /**
       * Set the current search result index
       */
      setMarkdownSearchIndex: (currentIndex: number) => ReturnType;
      /**
       * Clear the search
       */
      clearMarkdownSearch: () => ReturnType;
    };
  }
}
