import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { BufferContent } from '@/stores/buffers';
import { getLanguageFromExtension } from '@/stores/buffers/utils';
import { monacoEditorRegistry, type MonacoTypes } from '@/services/monaco';

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
    useLayoutEffect(() => {
        if (!containerRef.current) {
            console.warn('Monaco Editor containerRef.current is null, cannot initialize editor');
            return;
        }

        let disposed = false;
        let cleanup: (() => void) | undefined;

        (async () => {
            try {
                console.log('Initializing Monaco editor for buffer:', buffer.id);
                // Always use the latest buffer values to avoid stale closure
                const language = getLanguageFromExtension(buffer.extension || '');
                const value = typeof buffer.content === 'string' 
                    ? buffer.content 
                    : (buffer.content ? new TextDecoder().decode(buffer.content) : '');

                // Create a virtual file path for VSCode integration if not provided
                const filePath = buffer.filePath || `/virtual/${buffer.id}${buffer.extension || '.txt'}`;

                console.log('Creating editor with params:', { bufferId: buffer.id, language, filePath });
                console.log('containerRef.current:', containerRef.current);
                
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

                console.log('Monaco editor created successfully for buffer:', buffer.id);
                editorRef.current = editor;
                if (!disposed) setIsEditorReady(true);

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
                cleanup = () => {
                    onContentChange.dispose();
                    onCursorChange.dispose();
                    onScrollChange.dispose();
                    monacoEditorRegistry.disposeEditor(buffer.id);
                    editorRef.current = null;
                    setIsEditorReady(false);
                };
            } catch (error) {
                console.error('Failed to initialize Monaco editor:', error);
                console.error('Error details:', {
                    bufferId: buffer.id,
                    hasContainer: !!containerRef.current,
                    bufferContent: buffer.content ? 'present' : 'missing',
                    bufferExtension: buffer.extension
                });
                if (!disposed) setIsEditorReady(false);
            }
        })();

        return () => {
            disposed = true;
            if (cleanup) {
                cleanup();
            }
        };
    }, [buffer.id, buffer.filePath]); // Only re-create when buffer ID or filePath changes

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
                const monaco = monacoEditorRegistry.getMonaco();
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

    // Always render the container div so ref is available for Monaco
    return (
        <div className="h-full flex flex-col relative">
            <div ref={containerRef} className="h-full w-full" />
            {/* Loading/initializing overlay */}
            {(buffer.isLoading || !isEditorReady) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <p className="text-muted-foreground text-sm">
                        {buffer.isLoading ? 'Loading...' : 'Initializing editor...'}
                    </p>
                </div>
            )}
            {/* Error overlay */}
            {buffer.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <div className="text-center">
                        <p className="text-destructive text-sm mb-2">Error loading file</p>
                        <p className="text-xs text-muted-foreground">{buffer.error}</p>
                    </div>
                </div>
            )}
            {/* Readonly overlay */}
            {!buffer.isEditable && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <div className="text-center">
                        <p className="text-muted-foreground text-sm mb-2">
                            Cannot edit {buffer.type} file
                        </p>
                        <p className="text-xs text-muted-foreground">
                            File size: {buffer.fileSize ? `${Math.round(buffer.fileSize / 1024)}KB` : 'Unknown'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
