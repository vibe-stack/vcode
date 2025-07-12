import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BufferContent } from '@/stores/buffers';
import { getLanguageFromExtension } from '@/stores/buffers/utils';
import { monacoEditorRegistry, monaco, type MonacoTypes } from '@/services/monaco';

export interface EditorProps {
    buffer: BufferContent;
    onChange: (content: string) => void;
}

export function Editor({ buffer, onChange }: EditorProps) {
    const [content, setContent] = useState(buffer.content || '');
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);

    useEffect(() => {
        setContent(buffer.content || '');
    }, [buffer.content]);

    // Initialize Monaco Editor
    useEffect(() => {
        if (!containerRef.current) return;

        const initializeEditor = async () => {
            try {
                const language = getLanguageFromExtension(buffer.extension || '');
                const value = typeof content === 'string' 
                    ? content 
                    : (content ? new TextDecoder().decode(content) : '');

                // Create a virtual file path for VSCode integration if not provided
                const filePath = buffer.filePath || `/virtual/${buffer.id}${buffer.extension || '.txt'}`;

                // Create editor instance with VSCode API
                const editor = await monacoEditorRegistry.createEditor(
                    buffer.id,
                    containerRef.current!,
                    {
                        language: language,
                        theme: 'vs-dark',
                    },
                    value,
                    language,
                    filePath // Use file path for better VSCode integration
                );

                editorRef.current = editor;
                setIsEditorReady(true);

                // Listen to content changes
                const onContentChange = editor.onDidChangeModelContent(() => {
                    const newContent = editor.getValue();
                    setContent(newContent);
                    onChange(newContent);
                });

                // Listen to cursor position changes
                const onCursorChange = editor.onDidChangeCursorPosition((e: MonacoTypes.editor.ICursorPositionChangedEvent) => {
                    // Save cursor position to buffer state if needed
                    // You can emit this to the buffer store to save cursor position
                    // For example: updateBufferCursorPosition(buffer.id, e.position);
                });

                // Listen to scroll position changes
                const onScrollChange = editor.onDidScrollChange((e) => {
                    // Save scroll position to buffer state if needed
                    // You can emit this to the buffer store to save scroll position
                    // For example: updateBufferScrollPosition(buffer.id, { top: e.scrollTop, left: e.scrollLeft });
                });

                // Focus the editor if this buffer becomes active
                editor.focus();

                // Store disposables for cleanup
                return () => {
                    onContentChange.dispose();
                    onCursorChange.dispose();
                    onScrollChange.dispose();
                    monacoEditorRegistry.disposeEditor(buffer.id);
                    editorRef.current = null;
                    setIsEditorReady(false);
                };
            } catch (error) {
                console.error('Failed to initialize Monaco editor:', error);
                setIsEditorReady(false);
            }
        };

        let cleanup: (() => void) | undefined;
        
        initializeEditor().then((cleanupFn) => {
            cleanup = cleanupFn;
        });

        // Cleanup on unmount
        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [buffer.id]); // Only re-create when buffer ID changes

    // Update editor content when buffer content changes
    useEffect(() => {
        if (editorRef.current && isEditorReady && buffer.content !== undefined && buffer.content !== null) {
            const value = typeof buffer.content === 'string' 
                ? buffer.content 
                : new TextDecoder().decode(buffer.content);
            const currentValue = editorRef.current.getValue();
            
            if (currentValue !== value) {
                editorRef.current.setValue(value);
            }
        }
    }, [buffer.content, isEditorReady]);

    // Update editor language when extension changes
    useEffect(() => {
        if (editorRef.current && isEditorReady && buffer.extension) {
            const language = getLanguageFromExtension(buffer.extension);
            const model = editorRef.current.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [buffer.extension, isEditorReady]);

    // Restore cursor position
    useEffect(() => {
        if (editorRef.current && isEditorReady && buffer.cursorPosition) {
            monacoEditorRegistry.restoreCursorPosition(
                buffer.id,
                buffer.cursorPosition.line,
                buffer.cursorPosition.column
            );
        }
    }, [buffer.cursorPosition, buffer.id, isEditorReady]);

    // Restore scroll position
    useEffect(() => {
        if (editorRef.current && isEditorReady && buffer.scrollPosition) {
            monacoEditorRegistry.setEditorScrollPosition(
                buffer.id,
                buffer.scrollPosition.top,
                buffer.scrollPosition.left
            );
        }
    }, [buffer.scrollPosition, buffer.id, isEditorReady]);

    if (buffer.isLoading || !isEditorReady) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                    {buffer.isLoading ? 'Loading...' : 'Initializing editor...'}
                </p>
            </div>
        );
    }

    if (buffer.error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive text-sm mb-2">Error loading file</p>
                    <p className="text-xs text-muted-foreground">{buffer.error}</p>
                </div>
            </div>
        );
    }

    if (!buffer.isEditable) {
        return (
            <div className="h-full flex items-center justify-center">
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
        <div className="h-full flex flex-col">
            <div ref={containerRef} className="h-full w-full" />
        </div>
    );
}
