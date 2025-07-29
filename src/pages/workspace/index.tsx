import React from 'react';
import { useSearch } from '@tanstack/react-router';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileExplorer, ChatPanel, PersistentTerminalPanel, EditorArea, AutoView, HiddenTerminalContainer } from './components';
import { useProjectStore } from '@/stores/project';
import { useCallback } from 'react';
import { useEffect, useRef, useLayoutEffect } from 'react';
import { WorkspaceFooter } from './components/footer';
import { useEditorContentStore } from '@/stores/editor-content';
import { AgentsView } from './components/agents-view';
import { useTerminalStore } from '@/stores/terminal';
import WorkspaceHeader from '@/components/WorkspaceHeader';
import { Toaster } from "@/components/ui/sonner";
import { GlobalKeymapProvider } from '@/services/keymaps/main';


export default function WorkspacePage() {
  const { currentProject, setCurrentProject } = useProjectStore();
  const { view, leftPanelSize, rightPanelSize, onResizeLeftPanel, onResizeRightPanel } = useEditorContentStore();
  const { isVisible } = useTerminalStore();
  const panelGroupRef = useRef(null);

  // Calculate panel sizes based on current view
  const hasRightPanel = view !== "agents" && view !== "auto";
  const stableLeftSize = hasRightPanel ? leftPanelSize : Math.min(leftPanelSize, 35);
  const stableRightSize = hasRightPanel ? rightPanelSize : 0;
  const stableCenterSize = 100 - stableLeftSize - stableRightSize;

  const search = useSearch({ from: '/workspace' });
  React.useEffect(() => {
    const projectPath = search?.project;
    if (!currentProject && projectPath) {
      setCurrentProject(projectPath);
    } else if (!currentProject && !projectPath) {
      // No project loaded and no project param, redirect to home
      window.location.replace('/');
    }
  }, [currentProject, setCurrentProject, search]);

  return (
    <GlobalKeymapProvider>
      <div className="flex h-screen flex-col">
        <WorkspaceHeader />
        <main className="h-full grow flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div className="w-full bg-background h-full max-h-full relative flex flex-col workspace-layout">
              {/* Hidden container for keeping all terminals alive */}
              <HiddenTerminalContainer />

              <ResizablePanelGroup direction="horizontal">
                {/* Left Panel - File Explorer */}
                <ResizablePanel
                  defaultSize={stableLeftSize}
                  onResize={onResizeLeftPanel}
                  minSize={15}
                  maxSize={50}
                >
                  <div className="h-full w-full">
                    <FileExplorer />
                  </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Center Panel - Main Content Area */}
                <ResizablePanel defaultSize={stableCenterSize} minSize={30}>
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

                {/* Right Panel - Chat (always present but conditionally visible) */}
                {hasRightPanel && <ResizableHandle />}
                {hasRightPanel && (
                  <ResizablePanel
                    defaultSize={stableRightSize}
                    onResize={onResizeRightPanel}
                    minSize={15}
                    maxSize={50}
                  >
                    <div className="h-full w-full">
                      <ChatPanel />
                    </div>
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>

              <WorkspaceFooter />
            </div>
          </div>
        </main>
        <Toaster />
      </div>
    </GlobalKeymapProvider>
  );
}