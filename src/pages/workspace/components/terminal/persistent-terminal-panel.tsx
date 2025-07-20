import React, { useState, useCallback, useEffect, memo } from 'react';
import { useTerminalStore } from '@/stores/terminal';
import { useProjectStore } from '@/stores/project';
import { Button } from '@/components/ui/button';
import { X, Plus, Split, Trash2, SquareSplitHorizontalIcon } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { RegistryXTerminal } from './registry-xterm-component';
import { PersistentTerminalContainer } from './persistent-terminal-container';

// Terminal view component using the registry approach
interface RegistryTerminalViewProps {
  terminalId: string;
  isActive: boolean;
  onWrite: (data: string) => void;
}

const RegistryTerminalView = memo(function RegistryTerminalView({ terminalId, isActive, onWrite }: RegistryTerminalViewProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <RegistryXTerminal
        terminalId={terminalId}
        isActive={isActive}
        onWrite={onWrite}
      />
    </div>
  );
});

export function PersistentTerminalPanel() {
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
      console.error('Failed to create terminal split:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveTab = useCallback(async (tabId: string) => {
    try {
      // Kill the main terminal
      await window.terminalApi.kill(tabId);
      
      // Kill all splits for this tab
      const splits = getTabSplits(tabId);
      for (const split of splits) {
        await window.terminalApi.kill(split.terminalId);
      }
      
      removeTab(tabId);
    } catch (error) {
      console.error('Failed to remove terminal tab:', error);
    }
  }, [getTabSplits, removeTab]);

  const handleRemoveSplit = useCallback(async (tabId: string, splitId: string) => {
    try {
      const splits = getTabSplits(tabId);
      const split = splits.find(s => s.id === splitId);
      if (split) {
        await window.terminalApi.kill(split.terminalId);
        removeSplit(tabId, splitId);
      }
    } catch (error) {
      console.error('Failed to remove terminal split:', error);
    }
  }, [getTabSplits, removeSplit]);

  const handleWrite = useCallback((data: string) => {
    if (activeTabId) {
      // Check if we're writing to main terminal or active split
      if (activeTab?.activeSplitId) {
        const splits = getTabSplits(activeTabId);
        const activeSplit = splits.find(s => s.id === activeTab.activeSplitId);
        if (activeSplit) {
          console.log("running terminal cmd");
          window.terminalApi.write(activeSplit.terminalId, data, (result, exitCode) => {
            console.log(`[Terminal] Command executed in split ${activeSplit.id}:`, result, `Exit code: ${exitCode}`);
            if (exitCode !== 0) {
              console.error(`[Terminal] Command failed in split ${activeSplit.id}:`, result);
            }
          });
          return;
        }
      }
      
      // Write to main terminal
      console.log("running terminal cmd in main terminal");
      window.terminalApi.write(activeTabId, data, (result, exitCode) => {
        console.log(`[Terminal2] Command executed in main terminal ${activeTabId}:`, result, `Exit code: ${exitCode}`);
        if (exitCode !== 0) {
          console.error(`[Terminal2] Command failed in main terminal ${activeTabId}:`, result);
        }
      });
    }
  }, [activeTabId, activeTab?.activeSplitId, getTabSplits]);
  
  if (!isVisible) {
    return null;
  }

  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col">
      {/* Terminal tabs header */}
      <div className="h-8 bg-[#2d2d2d] border-b border-gray-600 flex items-center px-2 gap-1">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer",
                tab.isActive ? "bg-[#1e1e1e] text-white" : "bg-[#3c3c3c] text-gray-300 hover:bg-[#454545]"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="truncate max-w-24">{tab.title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-red-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTab(tab.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={handleSplitTerminal}
            disabled={!activeTabId || isCreating}
            title="Split Terminal"
          >
            <SquareSplitHorizontalIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={handleCreateTerminal}
            disabled={isCreating}
            title="New Terminal"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal content area */}
      <div className="flex-1 flex">
        {/* Main terminal */}
        <div className={cn(
          "flex-1",
          activeSplits.length > 0 ? "border-r border-gray-600" : ""
        )}>
          {activeTab && (
            <RegistryTerminalView
              terminalId={activeTab.id}
              isActive={!activeTab.activeSplitId}
              onWrite={handleWrite}
            />
          )}
        </div>

        {/* Terminal splits */}
        {activeSplits.length > 0 && (
          <div className="flex-1 flex flex-col">
            {activeSplits.map((split, index) => (
              <div key={split.id} className={cn(
                "flex-1 relative",
                index > 0 ? "border-t border-gray-600" : ""
              )}>
                {/* Split header */}
                <div className="absolute top-1 right-1 z-10 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 bg-black/50 hover:bg-red-500/50"
                    onClick={() => activeTab && handleRemoveSplit(activeTab.id, split.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <RegistryTerminalView
                  terminalId={split.terminalId}
                  isActive={activeTab?.activeSplitId === split.id}
                  onWrite={handleWrite}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
