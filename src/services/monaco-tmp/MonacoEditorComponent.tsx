/**
 * Example usage of the enhanced Monaco Editor with VSCode API integration
 */
import React, { useEffect, useRef, useState } from 'react';
import { monacoEditorRegistry, useMonacoEditor, type MonacoTypes } from './index';
import { applyVSCodeSettings, createMinimalSettings, type VSCodeSettings } from './vscode-config';

interface MonacoEditorProps {
    bufferId: string;
    content?: string;
    language?: string;
    filePath?: string;
    theme?: string;
    options?: MonacoTypes.editor.IStandaloneEditorConstructionOptions;
    onContentChange?: (content: string) => void;
    onCursorPositionChange?: (position: MonacoTypes.Position) => void;
    settings?: Partial<VSCodeSettings>;
}

/**
 * Enhanced Monaco Editor Component with VSCode services integration
 */
export const MonacoEditorComponent: React.FC<MonacoEditorProps> = ({
    bufferId,
    content = '',
    language = 'typescript',
    filePath,
    theme = 'vs-dark',
    options = {},
    onContentChange,
    onCursorPositionChange,
    settings = {},
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    
    const {
        registry,
        getEditor,
        getValue,
        setValue,
        getCursorPosition,
        initializeServices,
        isInitialized: servicesInitialized,
    } = useMonacoEditor(bufferId);

    // Initialize VSCode services and apply settings
    useEffect(() => {
        const init = async () => {
            try {
                // Initialize Monaco VSCode services
                await initializeServices();
                
                // Apply VSCode settings
                const mergedSettings = createMinimalSettings(settings);
                applyVSCodeSettings(mergedSettings);
                
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize Monaco services:', error);
            }
        };

        if (!servicesInitialized()) {
            init();
        } else {
            setIsInitialized(true);
        }
    }, [initializeServices, servicesInitialized, settings]);

    // Create editor instance
    useEffect(() => {
        const createEditor = async () => {
            if (!containerRef.current || !isInitialized) return;

            try {
                const editorOptions: MonacoTypes.editor.IStandaloneEditorConstructionOptions = {
                    theme,
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    fontSize: 14,
                    fontFamily: 'Geist Mono, Monaco, "Lucida Console", monospace',
                    ...options,
                };

                let editor: MonacoTypes.editor.IStandaloneCodeEditor;

                if (filePath && content) {
                    // Create editor with file system integration
                    editor = await registry.createEditorWithFile(
                        bufferId,
                        containerRef.current,
                        filePath,
                        content,
                        language,
                        editorOptions
                    );
                } else {
                    // Create standard editor
                    editor = await registry.createEditor(
                        bufferId,
                        containerRef.current,
                        editorOptions,
                        content,
                        language
                    );
                }

                // Set up event listeners
                if (onContentChange) {
                    editor.onDidChangeModelContent(() => {
                        const currentContent = editor.getValue();
                        onContentChange(currentContent);
                    });
                }

                if (onCursorPositionChange) {
                    editor.onDidChangeCursorPosition((e) => {
                        onCursorPositionChange(e.position);
                    });
                }

                setIsReady(true);
            } catch (error) {
                console.error('Failed to create Monaco editor:', error);
            }
        };

        createEditor();

        // Cleanup
        return () => {
            registry.disposeEditor(bufferId);
        };
    }, [
        bufferId,
        isInitialized,
        theme,
        language,
        content,
        filePath,
        options,
        onContentChange,
        onCursorPositionChange,
        registry,
    ]);

    // Update content when prop changes
    useEffect(() => {
        if (isReady && content !== undefined) {
            const currentContent = getValue();
            if (currentContent !== content) {
                setValue(content);
            }
        }
    }, [content, getValue, setValue, isReady]);

    // Update theme when prop changes
    useEffect(() => {
        if (isReady && theme) {
            registry.setTheme(theme);
        }
    }, [theme, registry, isReady]);

    return (
        <div 
            ref={containerRef} 
            style={{ 
                width: '100%', 
                height: '100%',
                opacity: isReady ? 1 : 0.5,
                transition: 'opacity 0.2s ease-in-out'
            }}
        />
    );
};

/**
 * Example usage with advanced features
 */
export const AdvancedMonacoExample: React.FC = () => {
    const [content, setContent] = useState('// Welcome to Monaco Editor with VSCode API!\nconsole.log("Hello, World!");');
    const [language, setLanguage] = useState('typescript');
    const [theme, setTheme] = useState('vs-dark');
    const [isDirty, setIsDirty] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<MonacoTypes.Position | null>(null);

    const bufferId = 'example-editor';
    const filePath = '/virtual/example.ts';

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            await monacoEditorRegistry.saveFile(bufferId);
            setIsDirty(false);
            console.log('File saved successfully!');
        } catch (error) {
            console.error('Failed to save file:', error);
        }
    };

    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage);
        // Update the editor model with new language
        const fileExtension = newLanguage === 'typescript' ? '.ts' : 
                            newLanguage === 'javascript' ? '.js' :
                            newLanguage === 'python' ? '.py' : '.txt';
        const newFilePath = `/virtual/example${fileExtension}`;
        
        // You would typically recreate the editor with the new language
        monacoEditorRegistry.updateEditorModel(bufferId, content, newLanguage);
    };

    const availableLanguages = monacoEditorRegistry.getAvailableLanguages();
    const availableThemes = monacoEditorRegistry.getAvailableThemes();

    return (
        <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <div style={{ 
                padding: '10px', 
                backgroundColor: '#f5f5f5', 
                borderBottom: '1px solid #ddd',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }}>
                <select 
                    value={language} 
                    onChange={(e) => handleLanguageChange(e.target.value)}
                >
                    {availableLanguages.slice(0, 10).map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>

                <select 
                    value={theme} 
                    onChange={(e) => setTheme(e.target.value)}
                >
                    {availableThemes.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                <button 
                    onClick={handleSave}
                    disabled={!isDirty}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: isDirty ? '#007acc' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: isDirty ? 'pointer' : 'not-allowed'
                    }}
                >
                    {isDirty ? 'Save*' : 'Saved'}
                </button>

                {cursorPosition && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
                        Line {cursorPosition.lineNumber}, Col {cursorPosition.column}
                    </span>
                )}
            </div>

            {/* Editor */}
            <div style={{ flex: 1 }}>
                <MonacoEditorComponent
                    bufferId={bufferId}
                    content={content}
                    language={language}
                    filePath={filePath}
                    theme={theme}
                    onContentChange={handleContentChange}
                    onCursorPositionChange={setCursorPosition}
                    settings={{
                        editor: {
                            fontSize: 16,
                            lineHeight: 1.6,
                            minimap: { enabled: true },
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            renderWhitespace: 'boundary',
                            bracketPairColorization: { enabled: true },
                        },
                        workbench: {
                            colorTheme: theme,
                        },
                    }}
                />
            </div>
        </div>
    );
};

/**
 * Multi-editor example showing split view
 */
export const MultiEditorExample: React.FC = () => {
    const [leftContent, setLeftContent] = useState('// Left editor\nconsole.log("Left");');
    const [rightContent, setRightContent] = useState('// Right editor\nconsole.log("Right");');

    return (
        <div style={{ height: '500px', display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
                <h3>Left Editor</h3>
                <div style={{ height: 'calc(100% - 40px)' }}>
                    <MonacoEditorComponent
                        bufferId="left-editor"
                        content={leftContent}
                        language="typescript"
                        filePath="/virtual/left.ts"
                        onContentChange={setLeftContent}
                    />
                </div>
            </div>
            
            <div style={{ flex: 1 }}>
                <h3>Right Editor</h3>
                <div style={{ height: 'calc(100% - 40px)' }}>
                    <MonacoEditorComponent
                        bufferId="right-editor"
                        content={rightContent}
                        language="javascript"
                        filePath="/virtual/right.js"
                        onContentChange={setRightContent}
                    />
                </div>
            </div>
        </div>
    );
};

export default MonacoEditorComponent;
