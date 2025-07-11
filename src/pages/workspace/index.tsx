import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileExplorer, EditorArea, ChatPanel } from './components';
import { useProjectStore } from '@/stores/project';
import { useEffect } from 'react';

export default function WorkspacePage() {
  const { currentProject, fileTree } = useProjectStore();

  useEffect(() => {
    // Ensure we have a project loaded
    if (!currentProject) {
      // Navigate back to home if no project is loaded
      window.history.back();
      return;
    }
  }, [currentProject]);

  if (!currentProject || !fileTree) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No project loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background h-full max-h-full relative">
      <ResizablePanelGroup direction="horizontal" className="">
        {/* Left Panel - File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <FileExplorer />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Center Panel - Editor Area */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <EditorArea />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Panel - Chat */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <ChatPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}