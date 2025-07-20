import React, { useState, useCallback, useEffect, memo } from 'react';
import { useTerminalStore } from '@/stores/terminal';
import { useProjectStore } from '@/stores/project';
import { Button } from '@/components/ui/button';
import { X, Plus, Split, Trash2, SquareSplitHorizontalIcon } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { XTerminal } from './xterm-component';

// Simple terminal component using pre-styled div (will be replaced with xterm.js later)
interface TerminalViewProps {
  terminalId: string;
  isActive: boolean;
  onWrite: (data: string) => void;
  layoutVersion?: number;
}

const TerminalView = memo(function TerminalView({ terminalId, isActive, onWrite, layoutVersion }: TerminalViewProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <XTerminal
        terminalId={terminalId}
        isActive={isActive}
        onWrite={onWrite}
        layoutVersion={layoutVersion}
      />
    </div>
  );
});

export function TerminalPanel() {
  const { currentProject } = useProjectStore();
  const {
    tabs,
    activeTabId,
    isVisible,
    height,
    createTab,
    removeTab,
    setActiveTab,
    createSplit,
    removeSplit,
    setActiveSplit,
    setVisible,
    setHeight,
    getTabSplits,
    getActiveTab,
    cleanup
  } = useTerminalStore();

  const [isCreating, setIsCreating] = useState(false);

  // Get current active tab and its splits
  const activeTab = getActiveTab();
  const activeSplits = activeTab ? getTabSplits(activeTab.id) : [];
  
  // Generate layout version for forcing terminal refit when splits change
  const layoutVersion = tabs.reduce((version, tab) => {
    const tabSplits = getTabSplits(tab.id);
    return version + tabSplits.length;
  }, tabs.length);

  // Cleanup all terminals when component unmounts
  useEffect(() => {
    return () => {
      // Kill all terminals on cleanup
      const allTabs = useTerminalStore.getState().tabs;
      for (const tab of allTabs) {
        try {
          window.terminalApi?.kill(tab.id);
          const splits = useTerminalStore.getState().getTabSplits(tab.id);
          for (const split of splits) {
            window.terminalApi?.kill(split.terminalId);
          }
        } catch (error) {
          console.error('Failed to cleanup terminal:', error);
        }
      }
    };
  }, []);

  const handleCreateTerminal = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const terminalInfo = await window.terminalApi.create({
        title: `Terminal ${tabs.length + 1}`,
        cwd: currentProject || undefined
      });
      
      createTab(terminalInfo);
    } catch (error) {
      console.error('Failed to create terminal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSplitTerminal = async () => {
    if (!activeTabId || isCreating) return;
    
    setIsCreating(true);
    try {
      const terminalInfo = await window.terminalApi.create({
        title: `Split ${activeSplits.length + 1}`,
        cwd: currentProject || undefined
      });
      
      createSplit(activeTabId, terminalInfo);
    } catch (error) {
      console.error('Failed to create split:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseTab = async (tabId: string) => {
    const tabToClose = tabs.find(t => t.id === tabId);
    if (!tabToClose) return;
    
    try {
      // Kill the main terminal process
      await window.terminalApi.kill(tabId);
      
      // Kill all split terminal processes
      const tabSplits = getTabSplits(tabId);
      for (const split of tabSplits) {
        try {
          await window.terminalApi.kill(split.terminalId);
        } catch (error) {
          console.error('Failed to kill split terminal:', split.terminalId, error);
        }
      }
      
      removeTab(tabId);
    } catch (error) {
      console.error('Failed to close terminal:', error);
    }
  };

  const handleCloseSplit = async (splitId: string) => {
    if (!activeTabId) return;
    
    const split = activeSplits.find(s => s.id === splitId);
    if (!split) return;
    
    try {
      await window.terminalApi.kill(split.terminalId);
      removeSplit(activeTabId, splitId);
    } catch (error) {
      console.error('Failed to close split:', error);
    }
  };

  const handleWrite = useCallback(async (terminalId: string, data: string) => {
    try {
      console.log("runnign command")
      await window.terminalApi.write(terminalId, data, (result, exitCode) => {
        console.log(`[Terminal] Command executed in ${terminalId}:`, result, `Exit code: ${exitCode}`);
        if (exitCode !== 0) {
          console.error(`[Terminal] Command failed in ${terminalId}:`, result);
        }
      });
    } catch (error) {
      console.error('Failed to write to terminal:', error);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex flex-col bg-background border-t border-gray-800" style={{ height }}>
      {/* Tab Bar */}
      <div className="flex items-center justify-between bg-muted/30 border-b px-2 py-1">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "group flex items-center px-3 py-1 rounded-t-md cursor-pointer text-sm",
                tab.isActive 
                  ? "bg-background text-white border-b-2 border-emerald-500" 
                  : "bg-muted/70 text-gray-300 hover:bg-[#3e3e42]"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-2">{tab.title}</span>
              
              {/* Splits indicator */}
              {activeSplits.length > 0 && tab.isActive && (
                <div className="flex items-center space-x-1 mr-2">
                  {activeSplits.map((split) => (
                    <div
                      key={split.id}
                      className="group/split flex items-center"
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full cursor-pointer",
                          split.id === activeTab?.activeSplitId ? "bg-blue-500" : "bg-gray-400"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeTabId) {
                            setActiveSplit(activeTabId, split.id);
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 ml-1 opacity-0 group-hover/split:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseSplit(split.id);
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSplitTerminal}
            disabled={!activeTabId || isCreating}
            className="h-6 w-6 p-0"
          >
            <SquareSplitHorizontalIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateTerminal}
            disabled={isCreating}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.map((tab) => {
          const tabSplits = getTabSplits(tab.id);
          
          return (
            <div
              key={tab.id}
              className={cn(
                "absolute inset-0",
                !tab.isActive && "hidden"
              )}
            >
              {tabSplits.length === 0 ? (
                <TerminalView
                  terminalId={tab.id}
                  isActive={tab.isActive}
                  onWrite={(data) => handleWrite(tab.id, data)}
                  layoutVersion={layoutVersion}
                />
              ) : (
                <div className="flex h-full">
                  <div 
                    className={cn(
                      "flex-1 cursor-pointer",
                      tab.activeSplitId !== null && "opacity-70 hover:opacity-90"
                    )}
                    onClick={() => {
                      if (activeTabId) {
                        setActiveSplit(activeTabId, null);
                      }
                    }}
                  >
                    <TerminalView
                      terminalId={tab.id}
                      isActive={tab.isActive && tab.activeSplitId === null}
                      onWrite={(data) => handleWrite(tab.id, data)}
                      layoutVersion={layoutVersion}
                    />
                  </div>
                  <div className="w-px bg-[#3e3e42]" />
                  <div className="flex-1">
                    {tabSplits.map((split) => (
                      <div
                        key={split.id}
                        className={cn(
                          "h-full cursor-pointer",
                          split.id !== tab.activeSplitId && "hidden",
                          split.id !== tab.activeSplitId && "opacity-70 hover:opacity-90"
                        )}
                        onClick={() => {
                          if (activeTabId) {
                            setActiveSplit(activeTabId, split.id);
                          }
                        }}
                      >
                        <TerminalView
                          terminalId={split.terminalId}
                          isActive={tab.isActive && split.id === tab.activeSplitId}
                          onWrite={(data) => handleWrite(split.terminalId, data)}
                          layoutVersion={layoutVersion}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {tabs.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="mb-4">No terminals open</p>
              <Button onClick={handleCreateTerminal} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-2" />
                Create Terminal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
