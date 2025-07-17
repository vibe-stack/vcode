import React, { useState, useCallback, memo } from "react";
import { useTerminalStore } from "@/stores/terminal";
import { useProjectStore } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { X, Plus, Split, Trash2 } from "lucide-react";
import { cn } from "@/utils/tailwind";
import { XTerminal } from "./xterm-component";

// Simple terminal component using pre-styled div (will be replaced with xterm.js later)
interface TerminalViewProps {
  terminalId: string;
  isActive: boolean;
  onWrite: (data: string) => void;
}

const TerminalView = memo(function TerminalView({
  terminalId,
  isActive,
  onWrite,
}: TerminalViewProps) {
  return (
    <div className="h-full w-full">
      <XTerminal
        terminalId={terminalId}
        isActive={isActive}
        onWrite={onWrite}
      />
    </div>
  );
});

export function TerminalPanel() {
  const { currentProject } = useProjectStore();
  const {
    tabs,
    activeTabId,
    splits,
    activeSplitId,
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
    getActiveSplits,
  } = useTerminalStore();

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTerminal = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const terminalInfo = await window.terminalApi.create({
        title: `Terminal ${tabs.length + 1}`,
        cwd: currentProject || undefined,
      });

      createTab(terminalInfo);
    } catch (error) {
      console.error("Failed to create terminal:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSplitTerminal = async () => {
    if (!activeTabId || isCreating) return;

    setIsCreating(true);
    try {
      const terminalInfo = await window.terminalApi.create({
        title: `Split ${splits.length + 1}`,
        cwd: currentProject || undefined,
      });

      createSplit(activeTabId, terminalInfo);
    } catch (error) {
      console.error("Failed to create split:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseTab = async (tabId: string) => {
    try {
      await window.terminalApi.kill(tabId);
      removeTab(tabId);
    } catch (error) {
      console.error("Failed to close terminal:", error);
    }
  };

  const handleCloseSplit = async (splitId: string) => {
    const split = splits.find((s) => s.id === splitId);
    if (!split) return;

    try {
      await window.terminalApi.kill(split.terminalId);
      removeSplit(splitId);
    } catch (error) {
      console.error("Failed to close split:", error);
    }
  };

  const handleWrite = useCallback(async (terminalId: string, data: string) => {
    try {
      await window.terminalApi.write(terminalId, data);
    } catch (error) {
      console.error("Failed to write to terminal:", error);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  const activeSplits = getActiveSplits();

  return (
    <div
      className="bg-background flex flex-col border-t border-gray-800"
      style={{ height }}
    >
      {/* Tab Bar */}
      <div className="bg-muted/30 flex items-center justify-between border-b px-2 py-1">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "group flex cursor-pointer items-center rounded-t-md px-3 py-1 text-sm",
                tab.isActive
                  ? "bg-background border-b-2 border-emerald-500 text-white"
                  : "bg-muted/70 text-gray-300 hover:bg-[#3e3e42]",
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-2">{tab.title}</span>

              {/* Splits indicator */}
              {activeSplits.length > 0 && tab.isActive && (
                <div className="mr-2 flex items-center space-x-1">
                  {activeSplits.map((split) => (
                    <div
                      key={split.id}
                      className={cn(
                        "h-2 w-2 cursor-pointer rounded-full",
                        split.id === activeSplitId
                          ? "bg-blue-500"
                          : "bg-gray-400",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSplit(split.id);
                      }}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Show split context menu or handle split actions
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
            <Split className="h-3 w-3" />
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
      <div className="relative flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn("absolute inset-0", !tab.isActive && "hidden")}
          >
            {activeSplits.length === 0 ? (
              <TerminalView
                terminalId={tab.id}
                isActive={tab.isActive}
                onWrite={(data) => handleWrite(tab.id, data)}
              />
            ) : (
              <div className="flex h-full">
                <div className="flex-1">
                  <TerminalView
                    terminalId={tab.id}
                    isActive={tab.isActive}
                    onWrite={(data) => handleWrite(tab.id, data)}
                  />
                </div>
                <div className="w-px bg-[#3e3e42]" />
                <div className="flex-1">
                  {activeSplits.map((split) => (
                    <div
                      key={split.id}
                      className={cn(
                        "h-full",
                        split.id !== activeSplitId && "hidden",
                      )}
                    >
                      <TerminalView
                        terminalId={split.terminalId}
                        isActive={split.id === activeSplitId}
                        onWrite={(data) => handleWrite(split.terminalId, data)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {tabs.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-4">No terminals open</p>
              <Button onClick={handleCreateTerminal} disabled={isCreating}>
                <Plus className="mr-2 h-4 w-4" />
                Create Terminal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
