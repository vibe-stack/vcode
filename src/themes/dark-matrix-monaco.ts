import * as monaco from 'monaco-editor';

// Dark Matrix theme with subtle green accents
export const darkMatrixTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        // Background and base colors
        { token: '', foreground: '9ca3af', background: '0f0f0f' },
        
        // Comments - dark gray
        { token: 'comment', foreground: '4b5563', fontStyle: 'italic' },
        { token: 'comment.line', foreground: '4b5563', fontStyle: 'italic' },
        { token: 'comment.block', foreground: '4b5563', fontStyle: 'italic' },
        
        // Keywords - subtle green
        { token: 'keyword', foreground: '34d399' },
        { token: 'keyword.control', foreground: '34d399' },
        { token: 'keyword.operator', foreground: '6ee7b7' },
        { token: 'keyword.other', foreground: '34d399' },
        
        // Storage types - bright green
        { token: 'storage', foreground: '10b981' },
        { token: 'storage.type', foreground: '10b981' },
        { token: 'storage.modifier', foreground: '6ee7b7' },
        
        // Strings - soft green
        { token: 'string', foreground: '86efac' },
        { token: 'string.quoted', foreground: '86efac' },
        { token: 'string.regexp', foreground: '6ee7b7' },
        
        // Numbers - pale green
        { token: 'constant.numeric', foreground: 'bbf7d0' },
        { token: 'constant.language', foreground: 'bbf7d0' },
        { token: 'constant.character', foreground: 'bbf7d0' },
        
        // Functions - bright matrix green
        { token: 'entity.name.function', foreground: '22c55e' },
        { token: 'support.function', foreground: '22c55e' },
        { token: 'meta.function-call', foreground: '22c55e' },
        
        // Classes and types - emerald
        { token: 'entity.name.class', foreground: '059669' },
        { token: 'entity.name.type', foreground: '059669' },
        { token: 'support.type', foreground: '059669' },
        { token: 'support.class', foreground: '059669' },
        
        // Variables - light gray
        { token: 'variable', foreground: 'd1d5db' },
        { token: 'variable.parameter', foreground: 'e5e7eb' },
        { token: 'variable.other', foreground: 'd1d5db' },
        
        // Operators - subtle green
        { token: 'keyword.operator.assignment', foreground: '6ee7b7' },
        { token: 'keyword.operator.comparison', foreground: '6ee7b7' },
        { token: 'keyword.operator.logical', foreground: '6ee7b7' },
        
        // Punctuation - dark gray
        { token: 'punctuation', foreground: '6b7280' },
        { token: 'punctuation.definition', foreground: '6b7280' },
        { token: 'punctuation.separator', foreground: '6b7280' },
        
        // Tags (HTML/XML) - matrix green
        { token: 'entity.name.tag', foreground: '16a34a' },
        { token: 'entity.other.attribute-name', foreground: '22c55e' },
        
        // JSON
        { token: 'support.type.property-name.json', foreground: '34d399' },
        { token: 'string.quoted.double.json', foreground: '86efac' },
        
        // Markdown
        { token: 'markup.heading', foreground: '16a34a', fontStyle: 'bold' },
        { token: 'markup.bold', foreground: '22c55e', fontStyle: 'bold' },
        { token: 'markup.italic', foreground: '6ee7b7', fontStyle: 'italic' },
        { token: 'markup.underline.link', foreground: '34d399' },
        
        // CSS
        { token: 'entity.other.attribute-name.css', foreground: '34d399' },
        { token: 'support.type.property-name.css', foreground: '22c55e' },
        { token: 'constant.other.color.rgb-value.css', foreground: '86efac' },
        
        // Invalid/Error - subtle red
        { token: 'invalid', foreground: 'f87171', background: '1f2937' },
        { token: 'invalid.illegal', foreground: 'f87171', background: '1f2937' },
    ],
    colors: {
        // Editor background
        'editor.background': '#0a0a0a',
        'editor.foreground': '#9ca3af',
        
        // Line numbers
        'editorLineNumber.foreground': '#374151',
        'editorLineNumber.activeForeground': '#6b7280',
        
        // Cursor
        'editorCursor.foreground': '#22c55e',
        
        // Selection
        'editor.selectionBackground': '#1f2937',
        'editor.selectionHighlightBackground': '#111827',
        'editor.inactiveSelectionBackground': '#111827',
        
        // Search
        'editor.findMatchBackground': '#065f46',
        'editor.findMatchHighlightBackground': '#064e3b',
        'editor.findRangeHighlightBackground': '#111827',
        
        // Current line
        'editor.lineHighlightBackground': '#111827',
        'editor.lineHighlightBorder': '#1f2937',
        
        // Gutter
        'editorGutter.background': '#0a0a0a',
        'editorGutter.modifiedBackground': '#34d399',
        'editorGutter.addedBackground': '#10b981',
        'editorGutter.deletedBackground': '#f87171',
        
        // Scrollbar
        'scrollbarSlider.background': '#1f2937',
        'scrollbarSlider.hoverBackground': '#374151',
        'scrollbarSlider.activeBackground': '#4b5563',
        
        // Minimap
        'minimap.background': '#0a0a0a',
        'minimap.selectionHighlight': '#1f2937',
        'minimap.findMatchHighlight': '#065f46',
        
        // Brackets
        'editorBracketMatch.background': '#1f2937',
        'editorBracketMatch.border': '#34d399',
        
        // Word highlight
        'editor.wordHighlightBackground': '#111827',
        'editor.wordHighlightStrongBackground': '#1f2937',
        
        // Folding
        'editorGutter.foldingControlForeground': '#6b7280',
        
        // Indent guides
        'editorIndentGuide.background': '#1f2937',
        'editorIndentGuide.activeBackground': '#374151',
        
        // Ruler
        'editorRuler.foreground': '#1f2937',
        
        // Overview ruler
        'editorOverviewRuler.border': '#1f2937',
        'editorOverviewRuler.findMatchForeground': '#065f46',
        'editorOverviewRuler.rangeHighlightForeground': '#111827',
        'editorOverviewRuler.selectionHighlightForeground': '#1f2937',
        'editorOverviewRuler.wordHighlightForeground': '#111827',
        'editorOverviewRuler.wordHighlightStrongForeground': '#1f2937',
        'editorOverviewRuler.modifiedForeground': '#34d399',
        'editorOverviewRuler.addedForeground': '#10b981',
        'editorOverviewRuler.deletedForeground': '#f87171',
        'editorOverviewRuler.errorForeground': '#f87171',
        'editorOverviewRuler.warningForeground': '#fbbf24',
        'editorOverviewRuler.infoForeground': '#3b82f6',
        
        // Errors and warnings
        'editorError.foreground': '#f87171',
        'editorWarning.foreground': '#fbbf24',
        'editorInfo.foreground': '#3b82f6',
        
        // Suggestions
        'editorSuggestWidget.background': '#1f2937',
        'editorSuggestWidget.border': '#374151',
        'editorSuggestWidget.foreground': '#d1d5db',
        'editorSuggestWidget.selectedBackground': '#065f46',
        'editorSuggestWidget.highlightForeground': '#22c55e',
        
        // Hover
        'editorHoverWidget.background': '#1f2937',
        'editorHoverWidget.border': '#374151',
        'editorHoverWidget.foreground': '#d1d5db',
    }
};

// Register the theme
export const registerDarkMatrixTheme = () => {
    monaco.editor.defineTheme('dark-matrix', darkMatrixTheme);
};
