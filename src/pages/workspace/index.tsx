import React, { useState, useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { FileExplorer, EditorWithTerminal, ChatPanel } from "./components";
import { useProjectStore } from "@/stores/project";
import { WorkspaceFooter } from "./components/footer";
import { useEditorContentStore } from "@/stores/editor-content";
import { AgentsView } from "./components/agents-view";
import { SettingsModal } from "@/components/SettingsModal";

export default function WorkspacePage() {
  const { currentProject } = useProjectStore();
  const {
    view,
    leftPanelSize,
    rightPanelSize,
    onResizeLeftPanel,
    onResizeRightPanel,
  } = useEditorContentStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Ensure we have a project loaded
    if (!currentProject) {
      // Navigate back to home if no project is loaded
      window.history.back();
      return;
    }
  }, [currentProject]);

  if (leftPanelSize === undefined || rightPanelSize === undefined) {
    return null;
  }

  return (
    <div className="bg-background relative flex w-full flex-col h-full">

      {/* Main content area */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - File Explorer */}
          <ResizablePanel
            defaultSize={leftPanelSize}
            onResize={onResizeLeftPanel}
          >
            <div className="w-full h-full">
              <FileExplorer />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel - Editor Area */}
          <ResizablePanel defaultSize={60} minSize={30}>
            {view === "code" && <EditorWithTerminal />}
            {view === "agents" && <AgentsView />}
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Chat */}
          {view !== "agents" && (
            <ResizablePanel
              defaultSize={rightPanelSize}
              onResize={onResizeRightPanel}
              minSize={15}
            >
              <div className="w-full h-full">
                <ChatPanel />
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
      <WorkspaceFooter />

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
