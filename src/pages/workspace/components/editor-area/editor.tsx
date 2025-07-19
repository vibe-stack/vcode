import React, { useRef, useEffect } from 'react';
import { BufferContent, useBufferStore } from '@/stores/buffers';
import { getLanguageFromExtension } from '@/stores/buffers/utils';
import { Editor as MonacoEditor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { registerDarkMatrixTheme } from '@/themes/dark-matrix-monaco';
import { getMonacoEditorOptions } from '@/config/monaco-config';
import { enhanceMonacoLanguages, registerCustomLanguages, getCustomLanguageFromExtension } from '@/config/monaco-languages';
import { setupMonacoEnvironment } from '@/config/monaco-environment';

setupMonacoEnvironment();

loader.config({ monaco });

loader.init().then((monacoInstance) => {
  // Register custom languages and themes
  registerDarkMatrixTheme();
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

    

    const value = typeof buffer.content === 'string'
        ? buffer.content
        : new TextDecoder().decode(buffer.content!);

    const language = getLanguageFromExtension(buffer.extension ?? 'plaintext');
    const editorOptions = getMonacoEditorOptions({
        // Override any specific options based on file type or user preferences
        fontSize: 14,
        minimap: buffer.fileSize && buffer.fileSize > 50000 ? false : true, // Disable minimap for large files
    });

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: any) => {
        editorRef.current = editor;
        
        // Focus the editor
        editor.focus();
        
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

        // For TypeScript files, set up additional language features
        if (buffer.filePath && (
            buffer.filePath.endsWith('.ts') || 
            buffer.filePath.endsWith('.tsx') || 
            buffer.filePath.endsWith('.js') || 
            buffer.filePath.endsWith('.jsx')
        )) {
            // Enable additional TypeScript features
            monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
            monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
            
            // For TSX/JSX files, ensure JSX support is enabled
            if (buffer.filePath.endsWith('.tsx') || buffer.filePath.endsWith('.jsx')) {
                // Log the language being used for debugging
                console.log(`TSX/JSX file detected: ${buffer.filePath}, using language: ${language}`);
                
                // Ensure TypeScript JSX configuration is properly applied
                const currentTsOptions = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
                console.log('Current TypeScript compiler options:', currentTsOptions);
            }
        }
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
                theme="dark-matrix"
                language={language}
                value={value}
                options={editorOptions}
                onChange={(value) => {
                    if (value !== undefined) {
                        onChange(value);
                    }
                }}
                onMount={handleEditorDidMount}
                
            />
        </div>
    )

}
