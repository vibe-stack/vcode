import * as monaco from 'monaco-editor';

export interface MonacoEditorConfig {
    // Basic options
    theme: string;
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    
    // Editor behavior
    wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
    minimap: boolean;
    lineNumbers: 'on' | 'off' | 'relative' | 'interval';
    folding: boolean;
    autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
    
    // Code intelligence
    quickSuggestions: boolean;
    suggestOnTriggerCharacters: boolean;
    acceptSuggestionOnCommitCharacter: boolean;
    tabCompletion: 'on' | 'off' | 'onlySnippets';
    
    // Visual enhancements
    bracketPairColorization: boolean;
    guides: {
        bracketPairs: boolean;
        indentation: boolean;
    };
    renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
    renderControlCharacters: boolean;
}

export const defaultEditorConfig: MonacoEditorConfig = {
    theme: 'dark-matrix',
    fontSize: 14,
    fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", "SF Mono", Monaco, Menlo, "Ubuntu Mono", monospace',
    lineHeight: 1.5,
    
    wordWrap: 'on',
    minimap: true,
    lineNumbers: 'on',
    folding: true,
    autoIndent: 'advanced',
    
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    tabCompletion: 'on',
    
    bracketPairColorization: true,
    guides: {
        bracketPairs: true,
        indentation: true,
    },
    renderWhitespace: 'selection',
    renderControlCharacters: false,
};

export const getMonacoEditorOptions = (config: Partial<MonacoEditorConfig> = {}): monaco.editor.IStandaloneEditorConstructionOptions => {
    const finalConfig = { ...defaultEditorConfig, ...config };
    
    return {
        theme: finalConfig.theme,
        fontSize: finalConfig.fontSize,
        fontFamily: finalConfig.fontFamily,
        lineHeight: finalConfig.lineHeight,
        
        // Layout
        wordWrap: finalConfig.wordWrap,
        wordWrapColumn: 120,
        wrappingIndent: 'indent',
        minimap: {
            enabled: finalConfig.minimap,
            side: 'right',
            showSlider: 'mouseover',
            renderCharacters: true,
            maxColumn: 120,
        },
        
        // Line numbers and folding
        lineNumbers: finalConfig.lineNumbers,
        lineNumbersMinChars: 3,
        folding: finalConfig.folding,
        foldingStrategy: 'indentation',
        showFoldingControls: 'mouseover',
        
        // Indentation and formatting
        autoIndent: finalConfig.autoIndent,
        insertSpaces: true,
        tabSize: 2,
        detectIndentation: true,
        trimAutoWhitespace: true,
        
        // Code intelligence
        quickSuggestions: finalConfig.quickSuggestions,
        quickSuggestionsDelay: 100,
        suggestOnTriggerCharacters: finalConfig.suggestOnTriggerCharacters,
        acceptSuggestionOnCommitCharacter: finalConfig.acceptSuggestionOnCommitCharacter,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: finalConfig.tabCompletion,
        suggest: {
            showIcons: true,
            showSnippets: true,
            showWords: true,
            showColors: true,
            showFiles: false, // Disable to reduce worker dependency
            showReferences: false, // Disable to reduce worker dependency
            showFolders: false, // Disable to reduce worker dependency
            showTypeParameters: true,
            showIssues: false, // Disable to reduce worker dependency
            showUsers: false, // Disable to reduce worker dependency
            showValues: true,
            filterGraceful: true,
            localityBonus: true,
        },
        
        // Visual enhancements
        bracketPairColorization: {
            enabled: finalConfig.bracketPairColorization,
            independentColorPoolPerBracketType: true,
        },
        guides: {
            bracketPairs: finalConfig.guides.bracketPairs,
            bracketPairsHorizontal: true,
            highlightActiveBracketPair: true,
            indentation: finalConfig.guides.indentation,
            highlightActiveIndentation: true,
        },
        renderWhitespace: finalConfig.renderWhitespace,
        renderControlCharacters: finalConfig.renderControlCharacters,
        renderLineHighlight: 'line',
        renderLineHighlightOnlyWhenFocus: false,
        
        // Cursor and selection
        cursorBlinking: 'blink',
        cursorSmoothCaretAnimation: 'on',
        cursorWidth: 2,
        selectOnLineNumbers: true,
        selectionHighlight: true,
        occurrencesHighlight: 'singleFile',
        
        // Scrolling
        scrollBeyondLastLine: false,
        scrollBeyondLastColumn: 5,
        smoothScrolling: true,
        mouseWheelZoom: true,
        
        // Find and replace
        find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'always',
        },
        
        // Editor behavior
        automaticLayout: true,
        scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 14,
        },
        
        // Performance
        stopRenderingLineAfter: 10000,
        
        // Accessibility
        accessibilitySupport: 'auto',
        
        // Advanced features
        contextmenu: true,
        copyWithSyntaxHighlighting: true,
        emptySelectionClipboard: true,
        multiCursorModifier: 'alt',
        multiCursorMergeOverlapping: true,
        showUnused: true,
        // unusedVariablesStyle: 'underline', // Not available in this Monaco version
        
        // Hover
        hover: {
            enabled: true,
            delay: 300,
            sticky: true,
        },
        
        // Links
        links: true,
        
        // Parameter hints
        parameterHints: {
            enabled: true,
            cycle: false,
        },
        
        // Code lens
        codeLens: true,
        
        // Color decorators
        colorDecorators: true,
        
        // Light bulb
        // lightbulb: {
        //     enabled: true,
        // },
        
        // Glyph margin
        glyphMargin: false,
        
        // Overview ruler
        overviewRulerLanes: 3,
        overviewRulerBorder: false,
    };
};
