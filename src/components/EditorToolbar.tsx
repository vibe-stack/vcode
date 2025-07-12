import React from 'react';
import { Button } from '@/components/ui/button';
import { useBufferStore } from '@/stores/buffers';
import EditorAdvancedFeatures, { EditorExamples } from '@/services/monaco/advanced-features';

/**
 * Example component demonstrating how to interact with Monaco editors
 * from outside the Editor component using the registry
 */
export function EditorToolbar() {
  const activeBufferId = useBufferStore(state => state.activeBufferId);

  if (!activeBufferId) {
    return null;
  }

  const handleFormatDocument = () => {
    EditorAdvancedFeatures.formatDocument(activeBufferId);
  };

  const handleToggleComment = () => {
    EditorAdvancedFeatures.toggleLineComment(activeBufferId);
  };

  const handleGoToLine = () => {
    const line = prompt('Go to line number:');
    if (line && !isNaN(parseInt(line))) {
      EditorAdvancedFeatures.goToPosition(activeBufferId, parseInt(line));
    }
  };

  const handleHighlightTodos = () => {
    EditorExamples.highlightTodos(activeBufferId);
  };

  const handleInsertSnippet = () => {
    const componentName = prompt('Component name:');
    if (componentName) {
      EditorExamples.insertReactComponent(activeBufferId, componentName);
    }
  };

  const handleFindReplace = () => {
    const searchText = prompt('Search for:');
    if (searchText) {
      const replaceText = prompt('Replace with:') || '';
      const replaceAll = confirm('Replace all occurrences?');
      EditorAdvancedFeatures.findAndReplace(activeBufferId, searchText, replaceText, replaceAll);
    }
  };

  return (
    <div className="flex gap-2 p-2 border-b">
      <Button variant="outline" size="sm" onClick={handleFormatDocument}>
        Format
      </Button>
      <Button variant="outline" size="sm" onClick={handleToggleComment}>
        Toggle Comment
      </Button>
      <Button variant="outline" size="sm" onClick={handleGoToLine}>
        Go to Line
      </Button>
      <Button variant="outline" size="sm" onClick={handleHighlightTodos}>
        Highlight TODOs
      </Button>
      <Button variant="outline" size="sm" onClick={handleInsertSnippet}>
        Insert Component
      </Button>
      <Button variant="outline" size="sm" onClick={handleFindReplace}>
        Find & Replace
      </Button>
    </div>
  );
}
