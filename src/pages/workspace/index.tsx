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
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalCommands from "@/components/global-commands";
import { SettingsModal } from "@/components/SettingsModal";
import { Link } from "@tanstack/react-router";

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
    <div className="bg-background relative flex h-full max-h-full w-full flex-col">
      {/* Custom title bar */}
      <div className="draglayer bg-background/95 flex h-12 flex-shrink-0 items-center border-b px-4 backdrop-blur-md">
        {/* Left section - Logo/Home */}
        <div className="flex flex-1 items-center">
          <div className="no-drag">
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img
                src="/src/assets/imgs/vcode_long.svg"
                className="h-5"
                alt="vCode"
              />
            </Link>
          </div>
        </div>

        {/* Center section - Project name */}
        <div className="flex flex-1 items-center justify-center">
          <span className="text-foreground/80 text-sm font-medium select-none">
            {currentProject ? currentProject.split("/").pop() : "vCode"}
          </span>
        </div>

        {/* Right section - Commands and Settings */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="no-drag">
            <GlobalCommands onOpenSettings={() => setSettingsOpen(true)} />
          </div>
          <div className="no-drag">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - File Explorer */}
          <ResizablePanel
            defaultSize={leftPanelSize}
            onResize={onResizeLeftPanel}
          >
            <div className="h-full w-full">
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
              <div className="h-full w-full">
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
