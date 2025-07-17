import React, { useCallback, useEffect, useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { EditorArea } from "./editor-area";
import { TerminalPanel } from "../terminal";
import { useTerminalStore } from "@/stores/terminal";

export function EditorWithTerminal() {
  const { isVisible: isTerminalVisible, setHeight } = useTerminalStore();
  const [terminalSize, setTerminalSize] = useState(() => {
    // Try to load from localStorage, default to 30%
    const saved = localStorage.getItem('terminal-panel-size');
    return saved ? parseFloat(saved) : 30;
  });

  const handleTerminalResize = useCallback((size: number) => {
    setTerminalSize(size);
    // Save to localStorage for persistence
    localStorage.setItem('terminal-panel-size', size.toString());
    
    // Calculate approximate height based on viewport size
    // This is for backward compatibility with components that might use the height value
    const viewportHeight = window.innerHeight;
    const approximateHeight = Math.round((size / 100) * viewportHeight * 0.7); // Approximate terminal area
    setHeight(approximateHeight);
  }, [setHeight]);

  useEffect(() => {
    // Update height when terminal becomes visible
    if (isTerminalVisible) {
      const viewportHeight = window.innerHeight;
      const approximateHeight = Math.round((terminalSize / 100) * viewportHeight * 0.7);
      setHeight(approximateHeight);
    }
  }, [isTerminalVisible, terminalSize, setHeight]);

  if (!isTerminalVisible) {
    return <EditorArea />;
  }

  return (
    <ResizablePanelGroup direction="vertical" className="h-full">
      <ResizablePanel 
        defaultSize={100 - terminalSize} 
        minSize={30}
        className="flex flex-col"
      >
        <EditorArea />
      </ResizablePanel>

      <ResizableHandle className="h-1 bg-border hover:bg-accent transition-colors" />

      <ResizablePanel 
        defaultSize={terminalSize} 
        minSize={15}
        maxSize={70}
        onResize={handleTerminalResize}
        className="flex flex-col"
      >
        <TerminalPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
