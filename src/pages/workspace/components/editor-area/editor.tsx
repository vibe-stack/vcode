import React, { useRef, useEffect } from 'react';
import { BufferContent, useBufferStore } from '@/stores/buffers';
import { getLanguageFromExtension } from '@/stores/buffers/utils';
import { Editor as MonacoEditor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { registerDarkMatrixTheme } from '@/themes/dark-matrix-monaco';
import { getMonacoEditorOptions } from '@/config/monaco-config';
import { enhanceMonacoLanguages, registerCustomLanguages, getCustomLanguageFromExtension } from '@/config/monaco-languages';
import { setupMonacoEnvironment } from '@/config/monaco-environment';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

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

    // Setup Monaco Environment for web workers on mount
    useEffect(() => {

    }, []);

    const value = typeof buffer.content === 'string'
        ? buffer.content
        : new TextDecoder().decode(buffer.content!);

    // Get the appropriate language for Monaco
    const getEditorLanguage = (extension: string | null): string => {
        if (!extension) return 'plaintext';
        
        // Check for custom language mappings first
        const customLang = getCustomLanguageFromExtension(extension);
        if (customLang) return customLang;
        
        // Use the standard mapping
        return getLanguageFromExtension(extension);
    };

    const language = getEditorLanguage(buffer.extension);
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
                beforeMount={(monaco) => {
                    // Register theme and enhance languages before mounting
                    registerDarkMatrixTheme();
                    enhanceMonacoLanguages();
                    registerCustomLanguages();
                }}
            />
        </div>
    )

}
