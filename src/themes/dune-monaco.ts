import * as monaco from 'monaco-editor';

// Dune theme - warm sand-like colors inspired by desert aesthetics
export const duneTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    // Background and base colors
    { token: '', foreground: '451a03', background: 'fefce8' },
    
    // Comments - warm gray
    { token: 'comment', foreground: 'a8a29e', fontStyle: 'italic' },
    { token: 'comment.line', foreground: 'a8a29e', fontStyle: 'italic' },
    { token: 'comment.block', foreground: 'a8a29e', fontStyle: 'italic' },
    
    // Keywords - desert orange
    { token: 'keyword', foreground: 'ea580c' },
    { token: 'keyword.control', foreground: 'ea580c' },
    { token: 'keyword.operator', foreground: 'f97316' },
    { token: 'keyword.other', foreground: 'ea580c' },
    
    // Storage types - amber
    { token: 'storage', foreground: 'd97706' },
    { token: 'storage.type', foreground: 'd97706' },
    { token: 'storage.modifier', foreground: 'f59e0b' },
    
    // Strings - warm green
    { token: 'string', foreground: '65a30d' },
    { token: 'string.quoted', foreground: '65a30d' },
    { token: 'string.regexp', foreground: '84cc16' },
    
    // Numbers - sandy yellow
    { token: 'constant.numeric', foreground: 'eab308' },
    { token: 'constant.language', foreground: 'eab308' },
    { token: 'constant.character', foreground: 'eab308' },
    
    // Functions - rusty red
    { token: 'entity.name.function', foreground: 'dc2626' },
    { token: 'support.function', foreground: 'dc2626' },
    { token: 'meta.function-call', foreground: 'dc2626' },
    
    // Classes and types - terracotta
    { token: 'entity.name.class', foreground: 'b91c1c' },
    { token: 'entity.name.type', foreground: 'b91c1c' },
    { token: 'support.type', foreground: 'b91c1c' },
    { token: 'support.class', foreground: 'b91c1c' },
    
    // Variables - earth brown
    { token: 'variable', foreground: '78716c' },
    { token: 'variable.parameter', foreground: '57534e' },
    { token: 'variable.other', foreground: '78716c' },
    
    // Operators - stone
    { token: 'keyword.operator.assignment', foreground: '78716c' },
    { token: 'keyword.operator.comparison', foreground: '78716c' },
    { token: 'keyword.operator.logical', foreground: '78716c' },
    
    // Punctuation - stone
    { token: 'punctuation', foreground: '78716c' },
    { token: 'punctuation.definition', foreground: '78716c' },
    { token: 'punctuation.separator', foreground: '78716c' },
    
    // Tags (HTML/XML) - desert orange
    { token: 'entity.name.tag', foreground: 'ea580c' },
    { token: 'entity.other.attribute-name', foreground: 'f97316' },
    
    // JSON
    { token: 'support.type.property-name.json', foreground: '65a30d' },
    { token: 'string.quoted.double.json', foreground: '84cc16' },
    
    // Markdown
    { token: 'markup.heading', foreground: '451a03', fontStyle: 'bold' },
    { token: 'markup.bold', foreground: '57534e', fontStyle: 'bold' },
    { token: 'markup.italic', foreground: '78716c', fontStyle: 'italic' },
    { token: 'markup.underline.link', foreground: 'ea580c' },
    
    // CSS
    { token: 'entity.other.attribute-name.css', foreground: 'ea580c' },
    { token: 'support.type.property-name.css', foreground: 'f97316' },
    { token: 'constant.other.color.rgb-value.css', foreground: '65a30d' },
    
    // Invalid/Error - dark red
    { token: 'invalid', foreground: '991b1b', background: 'fef2f2' },
    { token: 'invalid.illegal', foreground: '991b1b', background: 'fef2f2' },
  ],
  colors: {
    // Editor background - warm cream
    'editor.background': '#fefce8',
    'editor.foreground': '#451a03',
    
    // Line numbers
    'editorLineNumber.foreground': '#d6d3d1',
    'editorLineNumber.activeForeground': '#a8a29e',
    
    // Cursor
    'editorCursor.foreground': '#ea580c',
    
    // Selection
    'editor.selectionBackground': '#fed7aa',
    'editor.selectionHighlightBackground': '#fef3c7',
    'editor.inactiveSelectionBackground': '#fffbeb',
    
    // Search
    'editor.findMatchBackground': '#fde68a',
    'editor.findMatchHighlightBackground': '#fef3c7',
    'editor.findRangeHighlightBackground': '#fffbeb',
    
    // Current line
    'editor.lineHighlightBackground': '#fffbeb',
    'editor.lineHighlightBorder': '#fef3c7',
    
    // Gutter
    'editorGutter.background': '#fefce8',
    'editorGutter.modifiedBackground': '#ea580c',
    'editorGutter.addedBackground': '#65a30d',
    'editorGutter.deletedBackground': '#dc2626',
    
    // Scrollbar
    'scrollbarSlider.background': '#e7e5e4',
    'scrollbarSlider.hoverBackground': '#d6d3d1',
    'scrollbarSlider.activeBackground': '#a8a29e',
    
    // Minimap
    'minimap.background': '#fefce8',
    'minimap.selectionHighlight': '#fed7aa',
    'minimap.findMatchHighlight': '#fde68a',
    
    // Brackets
    'editorBracketMatch.background': '#fed7aa',
    'editorBracketMatch.border': '#ea580c',
    
    // Word highlight
    'editor.wordHighlightBackground': '#fef3c7',
    'editor.wordHighlightStrongBackground': '#fde68a',
    
    // Folding
    'editorGutter.foldingControlForeground': '#a8a29e',
    
    // Indent guides
    'editorIndentGuide.background': '#fef3c7',
    'editorIndentGuide.activeBackground': '#fde68a',
    
    // Ruler
    'editorRuler.foreground': '#fef3c7',
    
    // Overview ruler
    'editorOverviewRuler.border': '#fef3c7',
    'editorOverviewRuler.findMatchForeground': '#fde68a',
    'editorOverviewRuler.rangeHighlightForeground': '#fef3c7',
    'editorOverviewRuler.selectionHighlightForeground': '#fed7aa',
    'editorOverviewRuler.wordHighlightForeground': '#fef3c7',
    'editorOverviewRuler.wordHighlightStrongForeground': '#fde68a',
    'editorOverviewRuler.modifiedForeground': '#ea580c',
    'editorOverviewRuler.addedForeground': '#65a30d',
    'editorOverviewRuler.deletedForeground': '#dc2626',
    'editorOverviewRuler.errorForeground': '#dc2626',
    'editorOverviewRuler.warningForeground': '#d97706',
    'editorOverviewRuler.infoForeground': '#ea580c',
    
    // Errors and warnings
    'editorError.foreground': '#dc2626',
    'editorWarning.foreground': '#d97706',
    'editorInfo.foreground': '#ea580c',
    
    // Suggestions
    'editorSuggestWidget.background': '#fefce8',
    'editorSuggestWidget.border': '#e7e5e4',
    'editorSuggestWidget.foreground': '#451a03',
    'editorSuggestWidget.selectedBackground': '#fed7aa',
    'editorSuggestWidget.highlightForeground': '#ea580c',
    
    // Hover
    'editorHoverWidget.background': '#fefce8',
    'editorHoverWidget.border': '#e7e5e4',
    'editorHoverWidget.foreground': '#451a03',
  }
};

// Register the theme
export const registerDuneTheme = () => {
  monaco.editor.defineTheme('dune', duneTheme);
};
