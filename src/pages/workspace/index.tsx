import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileExplorer, ChatPanel, TerminalPanel, EditorArea } from './components';
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
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel - File Explorer */}
        <ResizablePanel defaultSize={leftPanelSize} onResize={onResizeLeftPanel}>
          <div className="h-full w-full">
            <FileExplorer />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Center Panel - Editor Area */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={70} minSize={30}>
              {view === "code" && <EditorArea />}
              {view === "agents" && <AgentsView />}
            </ResizablePanel>

            {isVisible && <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={15}>
                <TerminalPanel />
              </ResizablePanel></>
            }
          </ResizablePanelGroup>

        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel - Chat */}
        {view !== "agents" && <ResizablePanel defaultSize={rightPanelSize} onResize={onResizeRightPanel} minSize={15}>
          <div className="h-full w-full">
            <ChatPanel />
          </div>
        </ResizablePanel>}
      </ResizablePanelGroup>
      <WorkspaceFooter />
    </div>
  );
}