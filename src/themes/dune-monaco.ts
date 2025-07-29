import * as monaco from 'monaco-editor';

// Dune theme - zen warm sand-like colors inspired by desert tranquility
export const duneTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    // Background and base colors - softer, warmer
    { token: '', foreground: '3c2a1e', background: 'faf7f0' },
    
    // Comments - gentle warm sand
    { token: 'comment', foreground: 'b5a394', fontStyle: 'italic' },
    { token: 'comment.line', foreground: 'b5a394', fontStyle: 'italic' },
    { token: 'comment.block', foreground: 'b5a394', fontStyle: 'italic' },
    
    // Keywords - soft terracotta
    { token: 'keyword', foreground: 'c17b5c' },
    { token: 'keyword.control', foreground: 'c17b5c' },
    { token: 'keyword.operator', foreground: 'd4976f' },
    { token: 'keyword.other', foreground: 'c17b5c' },
    
    // Storage types - warm amber
    { token: 'storage', foreground: 'b8965a' },
    { token: 'storage.type', foreground: 'b8965a' },
    { token: 'storage.modifier', foreground: 'cca96b' },
    
    // Strings - sage desert green
    { token: 'string', foreground: '8aa070' },
    { token: 'string.quoted', foreground: '8aa070' },
    { token: 'string.regexp', foreground: '9bb083' },
    
    // Numbers - warm honey
    { token: 'constant.numeric', foreground: 'd4b56a' },
    { token: 'constant.language', foreground: 'd4b56a' },
    { token: 'constant.character', foreground: 'd4b56a' },
    
    // Functions - muted rust
    { token: 'entity.name.function', foreground: 'a8674a' },
    { token: 'support.function', foreground: 'a8674a' },
    { token: 'meta.function-call', foreground: 'a8674a' },
    
    // Classes and types - soft clay
    { token: 'entity.name.class', foreground: '9d5a47' },
    { token: 'entity.name.type', foreground: '9d5a47' },
    { token: 'support.type', foreground: '9d5a47' },
    { token: 'support.class', foreground: '9d5a47' },
    
    // Variables - warm taupe
    { token: 'variable', foreground: '8b7d6b' },
    { token: 'variable.parameter', foreground: '736658' },
    { token: 'variable.other', foreground: '8b7d6b' },
    
    // Operators - soft stone
    { token: 'keyword.operator.assignment', foreground: '8b7d6b' },
    { token: 'keyword.operator.comparison', foreground: '8b7d6b' },
    { token: 'keyword.operator.logical', foreground: '8b7d6b' },
    
    // Punctuation - soft stone
    { token: 'punctuation', foreground: '8b7d6b' },
    { token: 'punctuation.definition', foreground: '8b7d6b' },
    { token: 'punctuation.separator', foreground: '8b7d6b' },
    
    // Tags (HTML/XML) - soft terracotta
    { token: 'entity.name.tag', foreground: 'c17b5c' },
    { token: 'entity.other.attribute-name', foreground: 'd4976f' },
    
    // JSON
    { token: 'support.type.property-name.json', foreground: '8aa070' },
    { token: 'string.quoted.double.json', foreground: '9bb083' },
    
    // Markdown
    { token: 'markup.heading', foreground: '3c2a1e', fontStyle: 'bold' },
    { token: 'markup.bold', foreground: '5a4c3f', fontStyle: 'bold' },
    { token: 'markup.italic', foreground: '736658', fontStyle: 'italic' },
    { token: 'markup.underline.link', foreground: 'c17b5c' },
    
    // CSS
    { token: 'entity.other.attribute-name.css', foreground: 'c17b5c' },
    { token: 'support.type.property-name.css', foreground: 'd4976f' },
    { token: 'constant.other.color.rgb-value.css', foreground: '8aa070' },
    
    // Invalid/Error - subtle red clay
    { token: 'invalid', foreground: '9d5a47', background: 'f9f4f1' },
    { token: 'invalid.illegal', foreground: '9d5a47', background: 'f9f4f1' },
  ],
  colors: {
    // Editor background - warm golden beige, like Anthropic's warmth
    'editor.background': '#f2ede4',
    'editor.foreground': '#3d2e20',
    
    // Line numbers
    'editorLineNumber.foreground': '#c7b8a4',
    'editorLineNumber.activeForeground': '#ad9980',
    
    // Cursor
    'editorCursor.foreground': '#c17b5c',
    
    // Selection
    'editor.selectionBackground': '#e8dcc9',
    'editor.selectionHighlightBackground': '#efe5d5',
    'editor.inactiveSelectionBackground': '#f2ede4',
    
    // Search
    'editor.findMatchBackground': '#e2d4ba',
    'editor.findMatchHighlightBackground': '#efe5d5',
    'editor.findRangeHighlightBackground': '#f2ede4',
    
    // Current line
    'editor.lineHighlightBackground': '#efead9',
    'editor.lineHighlightBorder': '#e8dcc9',
    
    // Gutter
    'editorGutter.background': '#f2ede4',
    'editorGutter.modifiedBackground': '#c17b5c',
    'editorGutter.addedBackground': '#8aa070',
    'editorGutter.deletedBackground': '#a8674a',
    
    // Scrollbar
    'scrollbarSlider.background': '#dfd2be',
    'scrollbarSlider.hoverBackground': '#c7b8a4',
    'scrollbarSlider.activeBackground': '#ad9980',
    
    // Minimap
    'minimap.background': '#f2ede4',
    'minimap.selectionHighlight': '#e8dcc9',
    'minimap.findMatchHighlight': '#e2d4ba',
    
    // Brackets
    'editorBracketMatch.background': '#e8dcc9',
    'editorBracketMatch.border': '#c17b5c',
    
    // Word highlight
    'editor.wordHighlightBackground': '#efe5d5',
    'editor.wordHighlightStrongBackground': '#e2d4ba',
    
    // Folding
    'editorGutter.foldingControlForeground': '#ad9980',
    
    // Indent guides
    'editorIndentGuide.background': '#ebe1d0',
    'editorIndentGuide.activeBackground': '#dfd2be',
    
    // Ruler
    'editorRuler.foreground': '#ebe1d0',
    
    // Overview ruler
    'editorOverviewRuler.border': '#ebe1d0',
    'editorOverviewRuler.findMatchForeground': '#e2d4ba',
    'editorOverviewRuler.rangeHighlightForeground': '#efe5d5',
    'editorOverviewRuler.selectionHighlightForeground': '#e8dcc9',
    'editorOverviewRuler.wordHighlightForeground': '#efe5d5',
    'editorOverviewRuler.wordHighlightStrongForeground': '#e2d4ba',
    'editorOverviewRuler.modifiedForeground': '#c17b5c',
    'editorOverviewRuler.addedForeground': '#8aa070',
    'editorOverviewRuler.deletedForeground': '#a8674a',
    'editorOverviewRuler.errorForeground': '#a8674a',
    'editorOverviewRuler.warningForeground': '#b8965a',
    'editorOverviewRuler.infoForeground': '#c17b5c',
    
    // Errors and warnings
    'editorError.foreground': '#a8674a',
    'editorWarning.foreground': '#b8965a',
    'editorInfo.foreground': '#c17b5c',
    
    // Suggestions
    'editorSuggestWidget.background': '#f2ede4',
    'editorSuggestWidget.border': '#dfd2be',
    'editorSuggestWidget.foreground': '#3d2e20',
    'editorSuggestWidget.selectedBackground': '#e8dcc9',
    'editorSuggestWidget.highlightForeground': '#c17b5c',
    
    // Hover
    'editorHoverWidget.background': '#f2ede4',
    'editorHoverWidget.border': '#dfd2be',
    'editorHoverWidget.foreground': '#3d2e20',
  }
};

// Register the theme
export const registerDuneTheme = () => {
  monaco.editor.defineTheme('dune', duneTheme);
};


