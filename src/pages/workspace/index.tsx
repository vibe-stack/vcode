import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileExplorer, EditorArea, ChatPanel } from './components';
import { useProjectStore } from '@/stores/project';
import { useEffect } from 'react';
import { WorkspaceFooter } from './components/footer';

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

  return (
    <div className="w-full bg-background h-full max-h-full relative flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="">
        {/* Left Panel - File Explorer */}
        <ResizablePanel defaultSize={20}>
          <FileExplorer />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center Panel - Editor Area */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <EditorArea />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Chat */}
        <ResizablePanel defaultSize={20}>
          <ChatPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
      <WorkspaceFooter />
    </div>
  );
}