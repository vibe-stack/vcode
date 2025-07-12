import { monacoEditorRegistry, monaco } from '@/services/monaco';

/**
 * Example utility functions for advanced Monaco Editor features
 * These can be called from anywhere in the application using the registry
 */

export class EditorAdvancedFeatures {
  /**
   * Add custom actions to an editor
   */
  static addCustomActions(bufferId: string) {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    // Example: Add a custom action to format document
    editor.addAction({
      id: 'format-document-custom',
      label: 'Format Document (Custom)',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (ed) => {
        ed.trigger('', 'editor.action.formatDocument', {});
      },
    });

    // Example: Add a custom action to duplicate line
    editor.addAction({
      id: 'duplicate-line',
      label: 'Duplicate Line',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyD],
      run: (ed) => {
        ed.trigger('', 'editor.action.copyLinesDownAction', {});
      },
    });
  }

  /**
   * Add custom decorations to highlight specific lines or ranges
   */
  static addDecorations(bufferId: string, ranges: monaco.IRange[], className: string = 'highlight-line') {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return null;

    const decorations = ranges.map(range => ({
      range,
      options: {
        isWholeLine: true,
        className,
        glyphMarginClassName: 'highlight-glyph',
      },
    }));

    return editor.deltaDecorations([], decorations);
  }

  /**
   * Remove decorations
   */
  static removeDecorations(bufferId: string, decorationIds: string[]) {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    editor.deltaDecorations(decorationIds, []);
  }

  /**
   * Add custom completion provider
   */
  static addCompletionProvider(language: string, provider: monaco.languages.CompletionItemProvider) {
    return monaco.languages.registerCompletionItemProvider(language, provider);
  }

  /**
   * Add custom hover provider
   */
  static addHoverProvider(language: string, provider: monaco.languages.HoverProvider) {
    return monaco.languages.registerHoverProvider(language, provider);
  }

  /**
   * Find and replace text in editor
   */
  static findAndReplace(bufferId: string, searchText: string, replaceText: string, replaceAll: boolean = false) {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    if (replaceAll) {
      const matches = model.findMatches(searchText, false, false, false, null, false);
      editor.executeEdits('replace-all', matches.map(match => ({
        range: match.range,
        text: replaceText,
      })));
    } else {
      // Find first occurrence and replace
      const match = model.findNextMatch(searchText, editor.getPosition() || { lineNumber: 1, column: 1 }, false, false, null, false);
      if (match) {
        editor.executeEdits('replace', [{
          range: match.range,
          text: replaceText,
        }]);
      }
    }
  }

  /**
   * Go to specific line and column
   */
  static goToPosition(bufferId: string, lineNumber: number, column: number = 1) {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    editor.setPosition({ lineNumber, column });
    editor.revealLineInCenter(lineNumber);
    editor.focus();
  }

  /**
   * Insert text at current cursor position
   */
  static insertText(bufferId: string, text: string) {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    const position = editor.getPosition();
    if (position) {
      editor.executeEdits('insert-text', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text,
      }]);
    }
  }

  /**
   * Get selected text
   */
  static getSelectedText(bufferId: string): string | null {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return null;

    const selection = editor.getSelection();
    if (!selection) return null;

    const model = editor.getModel();
    if (!model) return null;

    return model.getValueInRange(selection);
  }

  /**
   * Replace selected text
   */
  static replaceSelectedText(bufferId: string, text: string) {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    editor.executeEdits('replace-selection', [{
      range: selection,
      text,
    }]);
  }

  /**
   * Toggle line comment
   */
  static toggleLineComment(bufferId: string) {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    editor.trigger('', 'editor.action.commentLine', {});
  }

  /**
   * Format document
   */
  static formatDocument(bufferId: string) {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    return editor.trigger('', 'editor.action.formatDocument', {});
  }

  /**
   * Set editor theme
   */
  static setTheme(theme: string) {
    monaco.editor.setTheme(theme);
  }

  /**
   * Get line count
   */
  static getLineCount(bufferId: string): number {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return 0;

    const model = editor.getModel();
    return model ? model.getLineCount() : 0;
  }

  /**
   * Get text on specific line
   */
  static getLineText(bufferId: string, lineNumber: number): string | null {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return null;

    const model = editor.getModel();
    return model ? model.getLineContent(lineNumber) : null;
  }

  /**
   * Focus editor by buffer ID
   */
  static focusEditor(bufferId: string) {
    monacoEditorRegistry.focusEditor(bufferId);
  }

  /**
   * Dispose specific editor
   */
  static disposeEditor(bufferId: string) {
    monacoEditorRegistry.disposeEditor(bufferId);
  }
}

// Example usage functions that demonstrate the power of having access to editor instances
export const EditorExamples = {
  /**
   * Example: Highlight all TODO comments
   */
  highlightTodos: (bufferId: string) => {
    const editor = monacoEditorRegistry.getEditorByBuffer(bufferId);
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const content = model.getValue();
    const lines = content.split('\n');
    const todoRanges: monaco.IRange[] = [];

    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
        todoRanges.push({
          startLineNumber: index + 1,
          startColumn: 1,
          endLineNumber: index + 1,
          endColumn: line.length + 1,
        });
      }
    });

    return EditorAdvancedFeatures.addDecorations(bufferId, todoRanges, 'todo-highlight');
  },

  /**
   * Example: Quick snippet insertion
   */
  insertReactComponent: (bufferId: string, componentName: string) => {
    const template = `import React from 'react';

interface ${componentName}Props {
  // Define your props here
}

export function ${componentName}({}: ${componentName}Props) {
  return (
    <div>
      {/* Your component content */}
    </div>
  );
}

export default ${componentName};
`;
    EditorAdvancedFeatures.insertText(bufferId, template);
  },
};

export default EditorAdvancedFeatures;
