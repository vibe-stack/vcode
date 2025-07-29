import React, { useRef, useEffect } from 'react';
import { BufferContent, useBufferStore } from '@/stores/buffers';
import { getLanguageFromExtension } from '@/stores/buffers/utils';
import { Editor as MonacoEditor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { registerDarkMatrixTheme } from '@/themes/dark-matrix-monaco';
import { registerVibesLightTheme } from '@/themes/vibes-light-monaco';
import { registerDuneTheme } from '@/themes/dune-monaco';
import { getMonacoEditorOptions } from '@/config/monaco-config';
import { enhanceMonacoLanguages, registerCustomLanguages, getCustomLanguageFromExtension } from '@/config/monaco-languages';
import { setupMonacoEnvironment } from '@/config/monaco-environment';
import { useProjectStore } from '@/stores/project';
import { useThemeStore } from '@/stores/theme';
import { typescriptLSPClient } from '@/services/typescript-lsp';
import { registerDarkSummerNightTheme } from '@/themes/dark-summer-night-monaco';

setupMonacoEnvironment();

loader.config({ monaco });

loader.init().then(async (monacoInstance) => {
  // Register custom languages and themes
  registerDarkMatrixTheme();
  registerVibesLightTheme();
  registerDuneTheme();
  registerDarkSummerNightTheme();
  enhanceMonacoLanguages();
  registerCustomLanguages();
});

export interface EditorProps {
    buffer: BufferContent;
    onChange: (content: string) => void;
}

export function Editor({ buffer, onChange }: EditorProps) {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const saveBuffer = useBufferStore((s) => s.saveBuffer);
    const currentProject = useProjectStore((s) => s.currentProject);
    const { currentTheme, getTheme } = useThemeStore();
    
    // Get the current theme's Monaco theme
    const currentThemeData = getTheme(currentTheme);
    const monacoTheme = currentThemeData?.monacoTheme || 'dark-matrix';

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
            
            // Open document in LSP if not already open
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

    const value = typeof buffer.content === 'string'
        ? buffer.content
        : new TextDecoder().decode(buffer.content!);

    const language = getLanguageFromExtension(buffer.extension ?? 'plaintext');
    
    // Ensure TypeScript files are properly detected
    const detectedLanguage = buffer.extension === 'ts' ? 'typescript' :
                            buffer.extension === 'tsx' ? 'typescript' :
                            language;
    const editorOptions = getMonacoEditorOptions({
        // Override any specific options based on file type or user preferences
        fontSize: 14,
        minimap: buffer.fileSize && buffer.fileSize > 50000 ? false : true, // Disable minimap for large files
    });

    const handleEditorDidMount = async (editor: monaco.editor.IStandaloneCodeEditor, monaco: any) => {
        editorRef.current = editor;
        
        // Focus the editor
        editor.focus();
        
        // Set up LSP integration for TypeScript/JavaScript files
        if (buffer.filePath && 
            (buffer.extension === 'ts' || buffer.extension === 'tsx' || 
             buffer.extension === 'js' || buffer.extension === 'jsx')) {
            
            const model = editor.getModel();
            if (model) {
                const uri = `file://${buffer.filePath}`;
                const languageId = buffer.extension === 'ts' ? 'typescript' :
                                  buffer.extension === 'tsx' ? 'typescriptreact' :
                                  buffer.extension === 'js' ? 'javascript' :
                                  buffer.extension === 'jsx' ? 'javascriptreact' :
                                  'typescript';
                
                // Ensure document is opened in LSP
                await typescriptLSPClient.openDocument(uri, languageId, model.getValue());
                
                // Handle content changes for LSP
                model.onDidChangeContent((e) => {
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
        
        // Add some useful keybindings
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // Emit save event (you can customize this)
            console.log('Save triggered');
            saveBuffer(buffer.id);
        });
        
        // Format document keybinding
        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
            editor.getAction('editor.action.formatDocument')?.run();
        });
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* Loading/initializing overlay */}
            {buffer.isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <p className="text-muted-foreground text-sm">Loading...</p>
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
            {/* Monaco Editor */}
            <MonacoEditor
                theme={monacoTheme}
                language={detectedLanguage}
                value={value}
                options={editorOptions}
                onChange={(value) => {
                    if (value !== undefined) {
                        onChange(value);
                    }
                }}
                onMount={handleEditorDidMount}
                path={buffer.filePath || undefined} // This helps Monaco identify the file properly
            />
        </div>
    )

}
