import React, { useRef, useEffect } from 'react';
import { BufferContent, useBufferStore } from '@/stores/buffers';
import { getLanguageFromExtension } from '@/stores/buffers/utils';
import { Editor as MonacoEditor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { registerDarkMatrixTheme } from '@/themes/dark-matrix-monaco';
import { getMonacoEditorOptions } from '@/config/monaco-config';
import { enhanceMonacoLanguages, registerCustomLanguages, getCustomLanguageFromExtension } from '@/config/monaco-languages';
import { setupMonacoEnvironment } from '@/config/monaco-environment';
import { typescriptProjectService } from '@/services/typescript-project';
import { useProjectStore } from '@/stores/project';

setupMonacoEnvironment();

loader.config({ monaco });

loader.init().then(async (monacoInstance) => {
  // Register custom languages and themes
  registerDarkMatrixTheme();
  enhanceMonacoLanguages();
  registerCustomLanguages();
  
  // Log Monaco language support for debugging
  console.log('Available Monaco languages:', monacoInstance.languages.getLanguages().map(l => l.id));
});

export interface EditorProps {
    buffer: BufferContent;
    onChange: (content: string) => void;
}

export function Editor({ buffer, onChange }: EditorProps) {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const saveBuffer = useBufferStore((s) => s.saveBuffer);
    const currentProject = useProjectStore((s) => s.currentProject);

    // Update TypeScript project service when file content changes
    useEffect(() => {
        if (buffer.filePath && currentProject && 
            (buffer.extension === 'ts' || buffer.extension === 'tsx' || 
             buffer.extension === 'js' || buffer.extension === 'jsx')) {
            const content = typeof buffer.content === 'string'
                ? buffer.content
                : new TextDecoder().decode(buffer.content!);
            
            typescriptProjectService.updateFile(buffer.filePath, content);
        }
    }, [buffer.content, buffer.filePath, buffer.extension, currentProject]);

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
        
        // Debug: Check Monaco TypeScript configuration
        console.log('Monaco TypeScript configuration:');
        console.log('- Language for file:', detectedLanguage);
        console.log('- Original language detection:', language);
        console.log('- File extension:', buffer.extension);
        console.log('- File path:', buffer.filePath);
        console.log('- TS compiler options:', monaco.languages.typescript.typescriptDefaults.getCompilerOptions());
        console.log('- JS compiler options:', monaco.languages.typescript.javascriptDefaults.getCompilerOptions());
        
        // Load file into TypeScript service if it's a TypeScript/JavaScript file
        if (buffer.filePath && currentProject && 
            (buffer.extension === 'ts' || buffer.extension === 'tsx' || 
             buffer.extension === 'js' || buffer.extension === 'jsx')) {
            console.log('Loading file into TypeScript service:', buffer.filePath);
            await typescriptProjectService.loadFileIntoMonaco(buffer.filePath);
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

    // Debug function to check current TypeScript project state
    const debugTypeScriptState = () => {
        console.log('=== TypeScript Debug Info ===');
        console.log('Current project:', currentProject);
        console.log('TS Project Service initialized:', typescriptProjectService.isProjectInitialized());
        console.log('TS Config:', typescriptProjectService.getTSConfig());
        typescriptProjectService.debugInfo();
        console.log('========================');
    };

    // Trigger debug info when project changes
    useEffect(() => {
        if (currentProject) {
            debugTypeScriptState();
        }
    }, [currentProject]);

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
                language={detectedLanguage}
                value={value}
                options={editorOptions}
                onChange={(value) => {
                    if (value !== undefined) {
                        onChange(value);
                        // Update TypeScript service when content changes
                        if (buffer.filePath && currentProject && 
                            (buffer.extension === 'ts' || buffer.extension === 'tsx' || 
                             buffer.extension === 'js' || buffer.extension === 'jsx')) {
                            typescriptProjectService.updateFile(buffer.filePath, value);
                        }
                    }
                }}
                onMount={handleEditorDidMount}
                path={buffer.filePath || undefined} // This helps Monaco identify the file properly
            />
        </div>
    )

}
