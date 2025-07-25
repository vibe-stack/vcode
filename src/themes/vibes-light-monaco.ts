import * as monaco from 'monaco-editor';

// Vibes Light theme - clean, minimal light theme
export const vibesLightTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    // Background and base colors
    { token: '', foreground: '374151', background: 'ffffff' },
    
    // Comments - light gray
    { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
    { token: 'comment.line', foreground: '9ca3af', fontStyle: 'italic' },
    { token: 'comment.block', foreground: '9ca3af', fontStyle: 'italic' },
    
    // Keywords - blue
    { token: 'keyword', foreground: '3b82f6' },
    { token: 'keyword.control', foreground: '3b82f6' },
    { token: 'keyword.operator', foreground: '6366f1' },
    { token: 'keyword.other', foreground: '3b82f6' },
    
    // Storage types - indigo
    { token: 'storage', foreground: '6366f1' },
    { token: 'storage.type', foreground: '6366f1' },
    { token: 'storage.modifier', foreground: '8b5cf6' },
    
    // Strings - green
    { token: 'string', foreground: '059669' },
    { token: 'string.quoted', foreground: '059669' },
    { token: 'string.regexp', foreground: '10b981' },
    
    // Numbers - orange
    { token: 'constant.numeric', foreground: 'f59e0b' },
    { token: 'constant.language', foreground: 'f59e0b' },
    { token: 'constant.character', foreground: 'f59e0b' },
    
    // Functions - purple
    { token: 'entity.name.function', foreground: '8b5cf6' },
    { token: 'support.function', foreground: '8b5cf6' },
    { token: 'meta.function-call', foreground: '8b5cf6' },
    
    // Classes and types - violet
    { token: 'entity.name.class', foreground: '7c3aed' },
    { token: 'entity.name.type', foreground: '7c3aed' },
    { token: 'support.type', foreground: '7c3aed' },
    { token: 'support.class', foreground: '7c3aed' },
    
    // Variables - dark gray
    { token: 'variable', foreground: '4b5563' },
    { token: 'variable.parameter', foreground: '374151' },
    { token: 'variable.other', foreground: '4b5563' },
    
    // Operators - gray
    { token: 'keyword.operator.assignment', foreground: '6b7280' },
    { token: 'keyword.operator.comparison', foreground: '6b7280' },
    { token: 'keyword.operator.logical', foreground: '6b7280' },
    
    // Punctuation - gray
    { token: 'punctuation', foreground: '6b7280' },
    { token: 'punctuation.definition', foreground: '6b7280' },
    { token: 'punctuation.separator', foreground: '6b7280' },
    
    // Tags (HTML/XML) - blue
    { token: 'entity.name.tag', foreground: '3b82f6' },
    { token: 'entity.other.attribute-name', foreground: '6366f1' },
    
    // JSON
    { token: 'support.type.property-name.json', foreground: '059669' },
    { token: 'string.quoted.double.json', foreground: '10b981' },
    
    // Markdown
    { token: 'markup.heading', foreground: '1f2937', fontStyle: 'bold' },
    { token: 'markup.bold', foreground: '374151', fontStyle: 'bold' },
    { token: 'markup.italic', foreground: '4b5563', fontStyle: 'italic' },
    { token: 'markup.underline.link', foreground: '3b82f6' },
    
    // CSS
    { token: 'entity.other.attribute-name.css', foreground: '3b82f6' },
    { token: 'support.type.property-name.css', foreground: '6366f1' },
    { token: 'constant.other.color.rgb-value.css', foreground: '059669' },
    
    // Invalid/Error - red
    { token: 'invalid', foreground: 'ef4444', background: 'fee2e2' },
    { token: 'invalid.illegal', foreground: 'ef4444', background: 'fee2e2' },
  ],
  colors: {
    // Editor background
    'editor.background': '#ffffff',
    'editor.foreground': '#374151',
    
    // Line numbers
    'editorLineNumber.foreground': '#d1d5db',
    'editorLineNumber.activeForeground': '#9ca3af',
    
    // Cursor
    'editorCursor.foreground': '#3b82f6',
    
    // Selection
    'editor.selectionBackground': '#e0e7ff',
    'editor.selectionHighlightBackground': '#f3f4f6',
    'editor.inactiveSelectionBackground': '#f9fafb',
    
    // Search
    'editor.findMatchBackground': '#dbeafe',
    'editor.findMatchHighlightBackground': '#eff6ff',
    'editor.findRangeHighlightBackground': '#f3f4f6',
    
    // Current line
    'editor.lineHighlightBackground': '#f9fafb',
    'editor.lineHighlightBorder': '#f3f4f6',
    
    // Gutter
    'editorGutter.background': '#ffffff',
    'editorGutter.modifiedBackground': '#3b82f6',
    'editorGutter.addedBackground': '#10b981',
    'editorGutter.deletedBackground': '#ef4444',
    
    // Scrollbar
    'scrollbarSlider.background': '#e5e7eb',
    'scrollbarSlider.hoverBackground': '#d1d5db',
    'scrollbarSlider.activeBackground': '#9ca3af',
    
    // Minimap
    'minimap.background': '#ffffff',
    'minimap.selectionHighlight': '#e0e7ff',
    'minimap.findMatchHighlight': '#dbeafe',
    
    // Brackets
    'editorBracketMatch.background': '#e0e7ff',
    'editorBracketMatch.border': '#3b82f6',
    
    // Word highlight
    'editor.wordHighlightBackground': '#f3f4f6',
    'editor.wordHighlightStrongBackground': '#e5e7eb',
    
    // Folding
    'editorGutter.foldingControlForeground': '#9ca3af',
    
    // Indent guides
    'editorIndentGuide.background': '#f3f4f6',
    'editorIndentGuide.activeBackground': '#e5e7eb',
    
    // Ruler
    'editorRuler.foreground': '#f3f4f6',
    
    // Overview ruler
    'editorOverviewRuler.border': '#f3f4f6',
    'editorOverviewRuler.findMatchForeground': '#dbeafe',
    'editorOverviewRuler.rangeHighlightForeground': '#f3f4f6',
    'editorOverviewRuler.selectionHighlightForeground': '#e0e7ff',
    'editorOverviewRuler.wordHighlightForeground': '#f3f4f6',
    'editorOverviewRuler.wordHighlightStrongForeground': '#e5e7eb',
    'editorOverviewRuler.modifiedForeground': '#3b82f6',
    'editorOverviewRuler.addedForeground': '#10b981',
    'editorOverviewRuler.deletedForeground': '#ef4444',
    'editorOverviewRuler.errorForeground': '#ef4444',
    'editorOverviewRuler.warningForeground': '#f59e0b',
    'editorOverviewRuler.infoForeground': '#3b82f6',
    
    // Errors and warnings
    'editorError.foreground': '#ef4444',
    'editorWarning.foreground': '#f59e0b',
    'editorInfo.foreground': '#3b82f6',
    
    // Suggestions
    'editorSuggestWidget.background': '#ffffff',
    'editorSuggestWidget.border': '#e5e7eb',
    'editorSuggestWidget.foreground': '#374151',
    'editorSuggestWidget.selectedBackground': '#e0e7ff',
    'editorSuggestWidget.highlightForeground': '#3b82f6',
    
    // Hover
    'editorHoverWidget.background': '#ffffff',
    'editorHoverWidget.border': '#e5e7eb',
    'editorHoverWidget.foreground': '#374151',
  }
};

// Register the theme
export const registerVibesLightTheme = () => {
  monaco.editor.defineTheme('vibes-light', vibesLightTheme);
};
