/**
 * Enhanced Monaco Editor Hook for Buffer Integration
 */
import { useEffect, useRef, useState } from 'react';
import { monacoEditorRegistry, type MonacoTypes } from '@/services/monaco';
import { BufferContent } from '@/stores/buffers';
import { getLanguageFromExtension } from '@/stores/buffers/utils';

interface UseEnhancedMonacoEditorOptions {
    buffer: BufferContent;
    onContentChange?: (content: string) => void;
    onCursorPositionChange?: (position: MonacoTypes.Position) => void;
    onScrollPositionChange?: (position: { top: number; left: number }) => void;
    theme?: string;
    options?: MonacoTypes.editor.IStandaloneEditorConstructionOptions;
}

interface UseEnhancedMonacoEditorReturn {
    containerRef: React.RefObject<HTMLDivElement>;
    isReady: boolean;
    editor: MonacoTypes.editor.IStandaloneCodeEditor | null;
    error: string | null;
    // Utility methods
    getValue: () => string | null;
    setValue: (value: string) => void;
    focus: () => void;
    getLanguage: () => string;
    setLanguage: (language: string) => void;
    isDirty: () => boolean;
    save: () => Promise<void>;
}

/**
 * Enhanced Monaco Editor Hook with VSCode API integration
 */
export function useEnhancedMonacoEditor({
    buffer,
    onContentChange,
    onCursorPositionChange,
    onScrollPositionChange,
    theme = 'vs-dark',
    options = {},
}: UseEnhancedMonacoEditorOptions): UseEnhancedMonacoEditorReturn {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize editor
    useEffect(() => {
        if (!containerRef.current) return;

        const initializeEditor = async () => {
            try {
                setError(null);
                setIsReady(false);

                const language = getLanguageFromExtension(buffer.extension || '');
                const content = typeof buffer.content === 'string' 
                    ? buffer.content 
                    : (buffer.content ? new TextDecoder().decode(buffer.content) : '');

                // Create a virtual file path for VSCode integration
                const filePath = buffer.filePath || `/virtual/${buffer.id}${buffer.extension || '.txt'}`;

                // Create editor with VSCode API integration
                const editor = await monacoEditorRegistry.createEditor(
                    buffer.id,
                    containerRef.current!,
                    {
                        theme,
                        ...options,
                    },
                    content,
                    language,
                    filePath
                );

                editorRef.current = editor;

                // Set up event listeners
                const onContentChangeDisposable = editor.onDidChangeModelContent(() => {
                    const newContent = editor.getValue();
                    onContentChange?.(newContent);
                });

                const onCursorChangeDisposable = editor.onDidChangeCursorPosition((e) => {
                    onCursorPositionChange?.(e.position);
                });

                const onScrollChangeDisposable = editor.onDidScrollChange((e) => {
                    onScrollPositionChange?.({ top: e.scrollTop, left: e.scrollLeft });
                });

                // Focus editor
                editor.focus();
                setIsReady(true);

                return () => {
                    onContentChangeDisposable.dispose();
                    onCursorChangeDisposable.dispose();
                    onScrollChangeDisposable.dispose();
                    monacoEditorRegistry.disposeEditor(buffer.id);
                    editorRef.current = null;
                    setIsReady(false);
                };
            } catch (err) {
                console.error('Failed to initialize Monaco editor:', err);
                setError(err instanceof Error ? err.message : 'Failed to initialize editor');
                setIsReady(false);
            }
        };

        let cleanup: (() => void) | undefined;
        
        initializeEditor().then((cleanupFn) => {
            cleanup = cleanupFn;
        });

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [buffer.id, theme]);

    // Update content when buffer content changes
    useEffect(() => {
        if (editorRef.current && isReady && buffer.content !== undefined) {
            const content = typeof buffer.content === 'string' 
                ? buffer.content 
                : new TextDecoder().decode(buffer.content);
            
            const currentContent = editorRef.current.getValue();
            if (currentContent !== content) {
                editorRef.current.setValue(content);
            }
        }
    }, [buffer.content, isReady]);

    // Restore cursor position
    useEffect(() => {
        if (editorRef.current && isReady && buffer.cursorPosition) {
            monacoEditorRegistry.restoreCursorPosition(
                buffer.id,
                buffer.cursorPosition.line,
                buffer.cursorPosition.column
            );
        }
    }, [buffer.cursorPosition, isReady]);

    // Restore scroll position
    useEffect(() => {
        if (editorRef.current && isReady && buffer.scrollPosition) {
            monacoEditorRegistry.setEditorScrollPosition(
                buffer.id,
                buffer.scrollPosition.top,
                buffer.scrollPosition.left
            );
        }
    }, [buffer.scrollPosition, isReady]);

    // Utility methods
    const getValue = () => {
        return monacoEditorRegistry.getEditorValue(buffer.id);
    };

    const setValue = (value: string) => {
        monacoEditorRegistry.setEditorValue(buffer.id, value);
    };

    const focus = () => {
        monacoEditorRegistry.focusEditor(buffer.id);
    };

    const getLanguage = () => {
        return getLanguageFromExtension(buffer.extension || '');
    };

    const setLanguage = (language: string) => {
        if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                monacoEditorRegistry.updateEditorModel(buffer.id, model.getValue(), language);
            }
        }
    };

    const isDirty = () => {
        return monacoEditorRegistry.isFileDirty(buffer.id);
    };

    const save = async () => {
        await monacoEditorRegistry.saveFile(buffer.id);
    };

    return {
        containerRef,
        isReady,
        editor: editorRef.current,
        error,
        getValue,
        setValue,
        focus,
        getLanguage,
        setLanguage,
        isDirty,
        save,
    };
}

/**
 * Simple Monaco Editor Hook for basic usage
 */
export function useSimpleMonacoEditor(
    bufferId: string,
    content: string = '',
    language: string = 'plaintext',
    options: MonacoTypes.editor.IStandaloneEditorConstructionOptions = {}
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const initializeEditor = async () => {
            try {
                const editor = await monacoEditorRegistry.createEditor(
                    bufferId,
                    containerRef.current!,
                    {
                        theme: 'vs-dark',
                        ...options,
                    },
                    content,
                    language
                );

                editorRef.current = editor;
                setIsReady(true);

                return () => {
                    monacoEditorRegistry.disposeEditor(bufferId);
                    editorRef.current = null;
                    setIsReady(false);
                };
            } catch (error) {
                console.error('Failed to initialize simple Monaco editor:', error);
            }
        };

        let cleanup: (() => void) | undefined;
        
        initializeEditor().then((cleanupFn) => {
            cleanup = cleanupFn;
        });

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [bufferId]);

    return {
        containerRef,
        isReady,
        editor: editorRef.current,
        getValue: () => monacoEditorRegistry.getEditorValue(bufferId),
        setValue: (value: string) => monacoEditorRegistry.setEditorValue(bufferId, value),
        focus: () => monacoEditorRegistry.focusEditor(bufferId),
    };
}
