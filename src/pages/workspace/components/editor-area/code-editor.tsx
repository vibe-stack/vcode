import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { BufferContent } from '@/stores/buffers';
import { getLanguageFromExtension } from '@/stores/buffers/utils';
import { Editor as MonacoEditor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { registerDarkMatrixTheme } from '@/themes/dark-matrix-monaco';
import { registerVibesLightTheme } from '@/themes/vibes-light-monaco';
import { registerDuneTheme } from '@/themes/dune-monaco';
import { getMonacoEditorOptions } from '@/config/monaco-config';
import { enhanceMonacoLanguages, registerCustomLanguages } from '@/config/monaco-languages';
import { setupMonacoEnvironment } from '@/config/monaco-environment';
import { useProjectStore } from '@/stores/project';
import { useThemeStore } from '@/stores/theme';
import { typescriptLSPClient } from '@/services/typescript-lsp';
import { useBufferSyncManager } from './hooks/useBufferSyncManager';
import { registerDarkSummerNightTheme } from '@/themes/dark-summer-night-monaco';

setupMonacoEnvironment();

loader.config({ monaco });

// Initialize Monaco configurations
loader.init().then(async (monacoInstance) => {
  registerDarkMatrixTheme();
  registerVibesLightTheme();
  registerDuneTheme();
  registerDarkSummerNightTheme();
  enhanceMonacoLanguages();
  registerCustomLanguages();
});

export interface CodeEditorProps {
  /** The buffer to edit */
  buffer: BufferContent;
  /** Whether this editor is focused/active */
  isFocused?: boolean;
  /** Called when content changes */
  onChange?: (content: string) => void;
  /** Called when editor gains focus */
  onFocus?: () => void;
}

/**
 * High-performance Monaco code editor with debounced buffer sync
 */
export function CodeEditor({ buffer, isFocused = false, onChange, onFocus }: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const currentProject = useProjectStore((s) => s.currentProject);
  const { currentTheme, getTheme } = useThemeStore();
  
  // Get the current theme's Monaco theme
  const currentThemeData = getTheme(currentTheme);
  const monacoTheme = currentThemeData?.monacoTheme || 'dark-matrix';

  // Use the buffer sync manager for high-performance sync
  const { 
    localContent, 
    isDirty, 
    updateLocalContent, 
    saveBuffer 
  } = useBufferSyncManager(buffer);

  // Memoize language detection
  const language = useMemo(() => {
    const detectedLang = getLanguageFromExtension(buffer.extension ?? 'plaintext');
    return buffer.extension === 'ts' ? 'typescript' :
           buffer.extension === 'tsx' ? 'typescriptreact' :
           buffer.extension === 'js' ? 'javascript' :
           buffer.extension === 'jsx' ? 'javascriptreact' :
           detectedLang;
  }, [buffer.extension]);

  // Memoize editor options
  const editorOptions = useMemo(() => getMonacoEditorOptions({
    fontSize: 14,
    minimap: buffer.fileSize && buffer.fileSize > 50000 ? false : true,
  }), [buffer.fileSize]);

  // Handle TypeScript/JavaScript files with LSP
  useEffect(() => {
    if (buffer.filePath && currentProject && 
        (buffer.extension === 'ts' || buffer.extension === 'tsx' || 
         buffer.extension === 'js' || buffer.extension === 'jsx')) {
      
      const content = typeof buffer.content === 'string'
        ? buffer.content
        : new TextDecoder().decode(buffer.content!);
      
      const languageId = buffer.extension === 'ts' ? 'typescript' :
                        buffer.extension === 'tsx' ? 'typescriptreact' :
                        buffer.extension === 'js' ? 'javascript' :
                        buffer.extension === 'jsx' ? 'javascriptreact' :
                        'typescript';
      
      const uri = `file://${buffer.filePath}`;
      
      if (!typescriptLSPClient.isDocumentOpen(uri)) {
        typescriptLSPClient.openDocument(uri, languageId, content);
      }
    }
  }, [buffer.filePath, buffer.content, buffer.extension, currentProject]);

  // Update Monaco theme when theme store changes
  useEffect(() => {
    if (editorRef.current && monacoTheme) {
      try {
        monaco.editor.setTheme(monacoTheme);
      } catch (error) {
        console.warn('Failed to set Monaco theme:', error);
      }
    }
  }, [monacoTheme]);

  // Focus the editor when pane becomes active
  useEffect(() => {
    if (isFocused && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isFocused]);

  const handleEditorDidMount = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    
    // Focus the editor if this pane is active
    if (isFocused) {
      editor.focus();
    }
    
    // Set up LSP integration for TypeScript/JavaScript files
    if (buffer.filePath && 
        (buffer.extension === 'ts' || buffer.extension === 'tsx' || 
         buffer.extension === 'js' || buffer.extension === 'jsx')) {
      
      const model = editor.getModel();
      if (model) {
        const uri = `file://${buffer.filePath}`;
        
        // Listen for model changes to sync with LSP
        model.onDidChangeContent((e) => {
          const content = model.getValue();
          const changes = e.changes.map(change => ({
            range: {
              start: {
                line: change.range.startLineNumber - 1,
                character: change.range.startColumn - 1
              },
              end: {
                line: change.range.endLineNumber - 1,
                character: change.range.endColumn - 1
              }
            },
            text: change.text
          }));
          
          typescriptLSPClient.updateDocument(uri, changes);
        });
        
        // Clean up when model is disposed
        model.onWillDispose(() => {
          typescriptLSPClient.closeDocument(uri);
        });
      }
    }
    
    // Add keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveBuffer();
    });
    
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // Call onFocus when editor gains focus
    editor.onDidFocusEditorWidget(() => {
      onFocus?.();
    });
  }, [buffer.filePath, buffer.extension, isFocused, saveBuffer, onFocus]);

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      updateLocalContent(value);
      onChange?.(value);
    }
  }, [updateLocalContent, onChange]);

  // Convert buffer content to string
  const value = useMemo(() => {
    if (typeof localContent === 'string') {
      return localContent;
    }
    if (typeof buffer.content === 'string') {
      return buffer.content;
    }
    return buffer.content ? new TextDecoder().decode(buffer.content) : '';
  }, [localContent, buffer.content]);

  // Show loading state
  if (buffer.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  // Show error state
  if (buffer.error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive text-sm mb-2">Error loading file</p>
          <p className="text-xs text-muted-foreground">{buffer.error}</p>
        </div>
      </div>
    );
  }

  // Show readonly overlay for non-editable files
  if (!buffer.isEditable) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2">
            Cannot edit {buffer.type} file
          </p>
          <p className="text-xs text-muted-foreground">
            File size: {buffer.fileSize ? `${Math.round(buffer.fileSize / 1024)}KB` : 'Unknown'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Dirty indicator */}
      {isDirty && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-yellow-500/20 text-yellow-600 text-xs rounded">
          Unsaved changes
        </div>
      )}
      
      <MonacoEditor
        theme={monacoTheme}
        language={language}
        value={value}
        options={editorOptions}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        path={buffer.filePath || undefined}
      />
    </div>
  );
}
