import * as monaco from 'monaco-editor';

// Dark Summer Night theme - zen, calming, sunset-inspired dark palette
export const darkSummerNightTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Background and base colors - deep indigo, soft twilight
    { token: '', foreground: 'e6e1e8', background: '181c24' },

    // Comments - gentle dusk purple
    { token: 'comment', foreground: '7c6f8c', fontStyle: 'italic' },
    { token: 'comment.line', foreground: '7c6f8c', fontStyle: 'italic' },
    { token: 'comment.block', foreground: '7c6f8c', fontStyle: 'italic' },

    // Keywords - sunset orange
    { token: 'keyword', foreground: 'ffb86b' },
    { token: 'keyword.control', foreground: 'ffb86b' },
    { token: 'keyword.operator', foreground: 'fca17d' },
    { token: 'keyword.other', foreground: 'ffb86b' },

    // Storage types - warm gold
    { token: 'storage', foreground: 'ffd580' },
    { token: 'storage.type', foreground: 'ffd580' },
    { token: 'storage.modifier', foreground: 'ffe2a0' },

    // Strings - soft leafy green
    { token: 'string', foreground: 'a3d9a5' },
    { token: 'string.quoted', foreground: 'a3d9a5' },
    { token: 'string.regexp', foreground: 'b6e3c6' },

    // Numbers - honey yellow
    { token: 'constant.numeric', foreground: 'ffe2a0' },
    { token: 'constant.language', foreground: 'ffe2a0' },
    { token: 'constant.character', foreground: 'ffe2a0' },

    // Functions - soft coral
    { token: 'entity.name.function', foreground: 'fca17d' },
    { token: 'support.function', foreground: 'fca17d' },
    { token: 'meta.function-call', foreground: 'fca17d' },

    // Classes and types - muted lavender
    { token: 'entity.name.class', foreground: 'b6a0e3' },
    { token: 'entity.name.type', foreground: 'b6a0e3' },
    { token: 'support.type', foreground: 'b6a0e3' },
    { token: 'support.class', foreground: 'b6a0e3' },

    // Variables - soft blue-grey
    { token: 'variable', foreground: '8ca6c1' },
    { token: 'variable.parameter', foreground: '6e7a8a' },
    { token: 'variable.other', foreground: '8ca6c1' },

    // Operators - dusk stone
    { token: 'keyword.operator.assignment', foreground: '8ca6c1' },
    { token: 'keyword.operator.comparison', foreground: '8ca6c1' },
    { token: 'keyword.operator.logical', foreground: '8ca6c1' },

    // Punctuation - dusk stone
    { token: 'punctuation', foreground: '8ca6c1' },
    { token: 'punctuation.definition', foreground: '8ca6c1' },
    { token: 'punctuation.separator', foreground: '8ca6c1' },

    // Tags (HTML/XML) - sunset orange
    { token: 'entity.name.tag', foreground: 'ffb86b' },
    { token: 'entity.other.attribute-name', foreground: 'fca17d' },

    // JSON
    { token: 'support.type.property-name.json', foreground: 'a3d9a5' },
    { token: 'string.quoted.double.json', foreground: 'b6e3c6' },

    // Markdown
    { token: 'markup.heading', foreground: 'ffe2a0', fontStyle: 'bold' },
    { token: 'markup.bold', foreground: 'ffb86b', fontStyle: 'bold' },
    { token: 'markup.italic', foreground: '7c6f8c', fontStyle: 'italic' },
    { token: 'markup.underline.link', foreground: 'fca17d' },

    // CSS
    { token: 'entity.other.attribute-name.css', foreground: 'ffb86b' },
    { token: 'support.type.property-name.css', foreground: 'fca17d' },
    { token: 'constant.other.color.rgb-value.css', foreground: 'a3d9a5' },

    // Invalid/Error - subtle red clay
    { token: 'invalid', foreground: 'fca17d', background: '2a1a1a' },
    { token: 'invalid.illegal', foreground: 'fca17d', background: '2a1a1a' },
  ],
  colors: {
    // Editor background - deep indigo
    'editor.background': '#181c24',
    'editor.foreground': '#e6e1e8',

    // Line numbers
    'editorLineNumber.foreground': '#4e5360',
    'editorLineNumber.activeForeground': '#ffb86b',

    // Cursor
    'editorCursor.foreground': '#ffb86b',

    // Selection
    'editor.selectionBackground': '#2c3140',
    'editor.selectionHighlightBackground': '#3a3f54',
    'editor.inactiveSelectionBackground': '#23273a',

    // Search
    'editor.findMatchBackground': '#3a3f54',
    'editor.findMatchHighlightBackground': '#23273a',
    'editor.findRangeHighlightBackground': '#23273a',

    // Current line
    'editor.lineHighlightBackground': '#23273a',
    'editor.lineHighlightBorder': '#2c3140',

    // Gutter
    'editorGutter.background': '#181c24',
    'editorGutter.modifiedBackground': '#ffb86b',
    'editorGutter.addedBackground': '#a3d9a5',
    'editorGutter.deletedBackground': '#fca17d',

    // Scrollbar
    'scrollbarSlider.background': '#23273a',
    'scrollbarSlider.hoverBackground': '#3a3f54',
    'scrollbarSlider.activeBackground': '#ffb86b',

    // Minimap
    'minimap.background': '#181c24',
    'minimap.selectionHighlight': '#2c3140',
    'minimap.findMatchHighlight': '#3a3f54',

    // Brackets
    'editorBracketMatch.background': '#2c3140',
    'editorBracketMatch.border': '#ffb86b',

    // Word highlight
    'editor.wordHighlightBackground': '#3a3f54',
    'editor.wordHighlightStrongBackground': '#23273a',

    // Folding
    'editorGutter.foldingControlForeground': '#ffb86b',

    // Indent guides
    'editorIndentGuide.background': '#23273a',
    'editorIndentGuide.activeBackground': '#3a3f54',

    // Ruler
    'editorRuler.foreground': '#23273a',

    // Overview ruler
    'editorOverviewRuler.border': '#23273a',
    'editorOverviewRuler.findMatchForeground': '#3a3f54',
    'editorOverviewRuler.rangeHighlightForeground': '#23273a',
    'editorOverviewRuler.selectionHighlightForeground': '#2c3140',
    'editorOverviewRuler.wordHighlightForeground': '#3a3f54',
    'editorOverviewRuler.wordHighlightStrongForeground': '#23273a',
    'editorOverviewRuler.modifiedForeground': '#ffb86b',
    'editorOverviewRuler.addedForeground': '#a3d9a5',
    'editorOverviewRuler.deletedForeground': '#fca17d',
    'editorOverviewRuler.errorForeground': '#fca17d',
    'editorOverviewRuler.warningForeground': '#ffd580',
    'editorOverviewRuler.infoForeground': '#ffb86b',

    // Errors and warnings
    'editorError.foreground': '#fca17d',
    'editorWarning.foreground': '#ffd580',
    'editorInfo.foreground': '#ffb86b',

    // Suggestions
    'editorSuggestWidget.background': '#181c24',
    'editorSuggestWidget.border': '#23273a',
    'editorSuggestWidget.foreground': '#e6e1e8',
    'editorSuggestWidget.selectedBackground': '#2c3140',
    'editorSuggestWidget.highlightForeground': '#ffb86b',

    // Hover
    'editorHoverWidget.background': '#181c24',
    'editorHoverWidget.border': '#23273a',
    'editorHoverWidget.foreground': '#e6e1e8',
  }
};

// Register the dark summer night theme
export const registerDarkSummerNightTheme = () => {
  monaco.editor.defineTheme('dark-summer-night', darkSummerNightTheme);
};