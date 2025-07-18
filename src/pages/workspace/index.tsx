import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileExplorer, ChatPanel, PersistentTerminalPanel, EditorArea, AutoView, HiddenTerminalContainer } from './components';
import { useProjectStore } from '@/stores/project';
import { useEffect } from 'react';
import { WorkspaceFooter } from './components/footer';
import { useEditorContentStore } from '@/stores/editor-content';
import { AgentsView } from './components/agents-view';
import { useTerminalStore } from '@/stores/terminal';

export default function WorkspacePage() {
  const { currentProject, fileTree } = useProjectStore();
  const { view, leftPanelSize, rightPanelSize, onResizeLeftPanel, onResizeRightPanel } = useEditorContentStore();
  const { isVisible } = useTerminalStore();

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
      {/* Hidden container for keeping all terminals alive */}
      <HiddenTerminalContainer />
      
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel - File Explorer */}
        <ResizablePanel defaultSize={leftPanelSize} onResize={onResizeLeftPanel}>
          <div className="h-full w-full">
            <FileExplorer />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Center Panel - Main Content Area */}
        <ResizablePanel defaultSize={60} minSize={30}>
          {view === "auto" ? (
            // Auto view takes the full center panel
            <AutoView />
          ) : (
            // Other views use the resizable vertical layout
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={70} minSize={30}>
                {view === "code" && <EditorArea />}
                {view === "agents" && <AgentsView />}
              </ResizablePanel>

              {isVisible && <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={15}>
                  <PersistentTerminalPanel />
                </ResizablePanel></>
              }
            </ResizablePanelGroup>
          )}
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel - Chat (hidden in auto and agents views) */}
        {view !== "agents" && view !== "auto" && <ResizablePanel defaultSize={rightPanelSize} onResize={onResizeRightPanel} minSize={15}>
          <div className="h-full w-full">
            <ChatPanel />
          </div>
        </ResizablePanel>}
      </ResizablePanelGroup>
      
      <WorkspaceFooter />
    </div>
  );
}