import React, { useEffect, useRef } from 'react';
import { useKeyboardHandler } from './hooks';

interface KeymapProviderProps {
  children: React.ReactNode;
  context?: 'editor' | 'global' | 'explorer' | 'terminal';
}

/**
 * Provider component that handles keyboard events for its children
 */
export const KeymapProvider: React.FC<KeymapProviderProps> = ({ 
  children, 
  context = 'global' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useKeyboardHandler(containerRef, context);

  return (
    <div ref={containerRef} className="keymap-provider">
      {children}
    </div>
  );
};

/**
 * Global keymap provider that should wrap your entire application
 */
export const GlobalKeymapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use document-level handler for global shortcuts
  useKeyboardHandler(undefined, 'global');

  return <>{children}</>;
};

/**
 * Editor-specific keymap provider
 */
export const EditorKeymapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  useKeyboardHandler(editorRef, 'editor');

  return (
    <div ref={editorRef} className="editor-keymap-provider w-full h-full">
      {children}
    </div>
  );
};
