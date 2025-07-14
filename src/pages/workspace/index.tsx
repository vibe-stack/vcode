import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileExplorer, EditorWithTerminal, ChatPanel } from './components';
import { useProjectStore } from '@/stores/project';
import { useEffect } from 'react';
import { WorkspaceFooter } from './components/footer';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlobalCommands from '@/components/global-commands';
import { SettingsModal } from '@/components/SettingsModal';
import { Link } from '@tanstack/react-router';

export default function WorkspacePage() {
  const { currentProject, fileTree } = useProjectStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(false);

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
      {/* Custom title bar */}
      <div className="draglayer h-12 bg-background/95 backdrop-blur-md border-b flex items-center px-4 flex-shrink-0">
        {/* Left section - Logo/Home */}
        <div className="flex items-center flex-1">
          <div className="no-drag">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/src/assets/imgs/vcode_long.svg" className="h-5" alt="vCode" />
            </Link>
          </div>
        </div>
        
        {/* Center section - Project name */}
        <div className="flex items-center justify-center flex-1">
          <span className="text-sm font-medium text-foreground/80 select-none">
            {currentProject ? currentProject.split('/').pop() : 'vCode'}
          </span>
        </div>
        
        {/* Right section - Commands and Settings */}
        <div className="flex items-center justify-end gap-2 flex-1">
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
      
      {isAgentMode ? (
        /* Agent Mode - Full screen chat */
        <div className="flex-1 h-full">
          <ChatPanel isAgentMode={true} onToggleAgentMode={() => setIsAgentMode(false)} />
        </div>
      ) : (
        /* Code Mode - Normal layout */
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - File Explorer */}
          <ResizablePanel defaultSize={20}>
            <div className="h-full w-full">
              <FileExplorer />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel - Editor Area */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <EditorWithTerminal />
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Chat */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full w-full">
              <ChatPanel isAgentMode={false} onToggleAgentMode={() => setIsAgentMode(true)} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      <WorkspaceFooter />
      
      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}