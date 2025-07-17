import React, { useState, useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { FileExplorer, EditorWithTerminal, ChatPanel, KanbanView } from "./components";
import { useProjectStore } from "@/stores/project";
import { WorkspaceFooter } from "./components/footer";
import { useEditorContentStore } from "@/stores/editor-content";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalCommands from "@/components/global-commands";
import { SettingsModal } from "@/components/SettingsModal";
import { Link } from "@tanstack/react-router";

export default function WorkspacePage() {
  const { currentProject } = useProjectStore();
  const {
    codeVisible,
    agentsVisible,
    kanbanVisible,
    leftPanelSize,
    rightPanelSize,
    onResizeLeftPanel,
  } = useEditorContentStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Calculate layout based on visible panels - COLUMN VIEWS
  const calculateLayout = () => {
    // Each toggle controls an entire column
    const columns = [];
    
    // Code Column (File Explorer + Editor)
    if (codeVisible) {
      columns.push('code');
    }
    
    // Kanban Column
    if (kanbanVisible) {
      columns.push('kanban');
    }
    
    // Agent Column (Chat)
    if (agentsVisible) {
      columns.push('agent');
    }
    
    return {
      showCodeColumn: codeVisible,
      showKanbanColumn: kanbanVisible,
      showAgentColumn: agentsVisible,
      totalColumns: columns.length,
      columns: columns
    };
  };

  const layout = calculateLayout();

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
    <div className="bg-background relative flex h-full max-h-full w-full flex-col overflow-hidden">
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
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-full overflow-hidden"
          key={`layout-${layout.columns.join('-')}`}
        >
          {/* Code Column (File Explorer + Editor) */}
          {layout.showCodeColumn && (
            <ResizablePanel
              id="code-column"
              defaultSize={layout.totalColumns === 1 ? 100 : layout.totalColumns === 2 ? 50 : 33}
              minSize={25}
              maxSize={75}
            >
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* File Explorer */}
                <ResizablePanel
                  id="file-explorer"
                  defaultSize={leftPanelSize}
                  onResize={onResizeLeftPanel}
                  minSize={15}
                >
                  <div className="h-full max-h-full w-full overflow-hidden">
                    <FileExplorer />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                {/* Code Editor */}
                <ResizablePanel id="code-editor" defaultSize={100 - leftPanelSize} minSize={30}>
                  <div className="h-full max-h-full w-full overflow-hidden">
                    <EditorWithTerminal />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          )}

          {/* Resizable handle between Code and Kanban columns */}
          {layout.showCodeColumn && layout.showKanbanColumn && <ResizableHandle />}

          {/* Kanban Column */}
          {layout.showKanbanColumn && (
            <ResizablePanel
              id="kanban-column"
              defaultSize={layout.totalColumns === 1 ? 100 : layout.totalColumns === 2 ? 50 : 33}
              minSize={25}
            >
              <div className="h-full max-h-full w-full overflow-hidden">
                <KanbanView />
              </div>
            </ResizablePanel>
          )}

          {/* Resizable handle between Kanban and Agent columns */}
          {layout.showKanbanColumn && layout.showAgentColumn && <ResizableHandle />}
          {/* Resizable handle between Code and Agent columns (when Kanban is not visible) */}
          {layout.showCodeColumn && !layout.showKanbanColumn && layout.showAgentColumn && <ResizableHandle />}

          {/* Agent Column (Chat) */}
          {layout.showAgentColumn && (
            <ResizablePanel
              id="agent-column"
              defaultSize={layout.totalColumns === 1 ? 100 : layout.totalColumns === 2 ? 50 : 33}
              minSize={25}
            >
              <div className="h-full max-h-full w-full overflow-hidden">
                {layout.totalColumns === 1 ? (
                  <div className="flex justify-center w-full h-full">
                    <div className="w-[70%] h-full">
                      <ChatPanel isAgentMode={true} />
                    </div>
                  </div>
                ) : (
                  <ChatPanel />
                )}
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
