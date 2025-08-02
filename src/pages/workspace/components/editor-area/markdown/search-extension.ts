import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Transaction } from '@tiptap/pm/state';
import './search-types';

export interface SearchOptions {
  searchTerm: string;
  caseSensitive: boolean;
  currentIndex: number;
}

export interface SearchResult {
  from: number;
  to: number;
}

interface SearchPluginState {
  decorations: DecorationSet;
  results: SearchResult[];
  searchTerm: string;
  currentIndex: number;
}

const searchPluginKey = new PluginKey<SearchPluginState>('markdownSearch');

// Helper function to find matches in the document
function findMatches(doc: any, searchTerm: string, caseSensitive: boolean): SearchResult[] {
  if (!searchTerm.trim()) return [];

  const results: SearchResult[] = [];
  const flags = caseSensitive ? 'g' : 'gi';
  const searchRegex = new RegExp(
    searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
    flags
  );

  // Get all text content with positions
  const textMap: Array<{ char: string; pos: number }> = [];
  
  doc.descendants((node: any, pos: number) => {
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
    const to = textMap[match.index + searchTerm.length - 1]?.pos + 1;

    if (from !== undefined && to !== undefined) {
      results.push({ from, to });
    }

    // Prevent infinite loop
    if (match.index === searchRegex.lastIndex) {
      searchRegex.lastIndex++;
    }
  }

  return results;
}

// Helper function to create decorations
function createDecorations(state: any, searchTerm: string, currentIndex: number, caseSensitive: boolean): { decorations: DecorationSet; results: SearchResult[] } {
  if (!searchTerm.trim()) {
    return { decorations: DecorationSet.empty, results: [] };
  }

  const results = findMatches(state.doc, searchTerm, caseSensitive);
  const decorations: Decoration[] = [];
  
  results.forEach((result: SearchResult, index: number) => {
    const className = index === currentIndex 
      ? 'bg-blue-300 dark:bg-blue-700' 
      : 'bg-yellow-200 dark:bg-yellow-800';
    
    decorations.push(
      Decoration.inline(result.from, result.to, {
        class: className,
        'data-search-result': index.toString(),
      })
    );
  });

  return { 
    decorations: DecorationSet.create(state.doc, decorations), 
    results 
  };
}

export const SearchExtension = Extension.create<SearchOptions>({
  name: 'markdownSearch',

  addOptions() {
    return {
      searchTerm: '',
      caseSensitive: false,
      currentIndex: 0,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin<SearchPluginState>({
        key: searchPluginKey,
        state: {
          init() {
            const { decorations, results } = createDecorations(
              { doc: extension.editor.state.doc }, 
              extension.options.searchTerm, 
              extension.options.currentIndex,
              extension.options.caseSensitive
            );
            return {
              decorations,
              results,
              searchTerm: extension.options.searchTerm,
              currentIndex: extension.options.currentIndex,
            };
          },
          apply(tr: Transaction, value: SearchPluginState, oldState: any, newState: any) {
            // Check for search updates
            const searchMeta = tr.getMeta(searchPluginKey);
            if (searchMeta) {
              const { decorations, results } = createDecorations(
                newState, 
                searchMeta.searchTerm, 
                searchMeta.currentIndex,
                searchMeta.caseSensitive || extension.options.caseSensitive
              );
              return {
                decorations,
                results,
                searchTerm: searchMeta.searchTerm,
                currentIndex: searchMeta.currentIndex,
              };
            }
            
            // If the document changed, recalculate decorations
            if (tr.docChanged) {
              const { decorations, results } = createDecorations(
                newState, 
                value.searchTerm, 
                value.currentIndex,
                extension.options.caseSensitive
              );
              return {
                decorations,
                results,
                searchTerm: value.searchTerm,
                currentIndex: value.currentIndex,
              };
            }
            
            // Otherwise, map the existing decorations
            return {
              ...value,
              decorations: value.decorations.map(tr.mapping, tr.doc),
            };
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations;
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setMarkdownSearchTerm: (searchTerm: string, currentIndex: number = 0) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(searchPluginKey, { 
            searchTerm, 
            currentIndex,
            caseSensitive: this.options.caseSensitive
          });
        }
        return true;
      },
      setMarkdownSearchIndex: (currentIndex: number) => ({ tr, dispatch, state }) => {
        if (dispatch) {
          const currentState = searchPluginKey.getState(state);
          tr.setMeta(searchPluginKey, { 
            searchTerm: currentState?.searchTerm || '',
            currentIndex,
            caseSensitive: this.options.caseSensitive
          });
        }
        return true;
      },
      clearMarkdownSearch: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(searchPluginKey, { 
            searchTerm: '', 
            currentIndex: 0,
            caseSensitive: this.options.caseSensitive
          });
        }
        return true;
      },
    };
  },
});

// Helper function to get search results from the plugin state
export function getSearchResults(editor: any): SearchResult[] {
  if (!editor) return [];
  
  const pluginState = searchPluginKey.getState(editor.state);
  return pluginState?.results || [];
}
