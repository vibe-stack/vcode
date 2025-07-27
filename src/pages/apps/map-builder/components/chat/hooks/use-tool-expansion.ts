import { useState, useCallback } from 'react';

export function useToolExpansion() {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((toolCallId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolCallId)) {
        newSet.delete(toolCallId);
      } else {
        newSet.add(toolCallId);
      }
      return newSet;
    });
  }, []);

  const isExpanded = useCallback((toolCallId: string) => {
    return expandedTools.has(toolCallId);
  }, [expandedTools]);

  const collapseAll = useCallback(() => {
    setExpandedTools(new Set());
  }, []);

  return {
    isExpanded,
    toggleExpanded,
    collapseAll
  };
}
