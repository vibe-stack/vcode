import { useBufferStore } from "@/stores/buffers";
import { useProjectStore } from "@/stores/project";
import { useTerminalStore } from "@/stores/terminal";
import { useGitStore } from "@/stores/git";
import {
  detectLineEnding,
  detectIndentation,
  detectEncoding,
  getLanguageFromExtension,
} from "@/stores/buffers/utils";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  GitBranch,
  FileCode2,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Database,
  Zap,
  Activity,
} from "lucide-react";
import React from "react";
import { GitBranchSwitcher } from "./git-branch-switcher";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEditorContentStore } from "@/stores/editor-content";
import { cn } from "@/utils/tailwind";
import { useSettingsStore } from "@/stores/settings";
import { getActiveAccentClasses } from "@/utils/accent-colors";

export function WorkspaceFooter() {
  const { currentProject } = useProjectStore();
  const { buffers, activeBufferId } = useBufferStore();
  const { 
    codeVisible, 
    agentsVisible, 
    kanbanVisible, 
    toggleCode, 
    toggleAgents, 
    toggleKanban 
  } = useEditorContentStore();
  const {
    isVisible: isTerminalVisible,
    setVisible: setTerminalVisible,
    createTab,
  } = useTerminalStore();
  const { currentBranch, isGitRepo } = useGitStore();
  const { settings } = useSettingsStore();
  const accentColor = settings.appearance?.accentColor || "blue";
  const useGradient = settings.appearance?.accentGradient ?? true;

  const handleCreateTerminal = async () => {
    try {
      // Create a new terminal
      const terminalInfo = await window.terminalApi.create({
        cwd: currentProject || undefined,
        title: "Terminal",
      });

      // Add it to the store
      createTab(terminalInfo);

      // Make sure terminal is visible
      setTerminalVisible(true);
    } catch (error) {
      console.error("Failed to create terminal:", error);
    }
  };

  const handleToggleTerminal = () => {
    setTerminalVisible(!isTerminalVisible);
  };

  // Get active buffer reactively from the store
  const activeBuffer = activeBufferId ? buffers.get(activeBufferId) : null;

  // Calculate editor status info
  const editorInfo = React.useMemo(() => {
    if (
      !activeBuffer ||
      !activeBuffer.content ||
      typeof activeBuffer.content !== "string"
    ) {
      return {
        lineEnding: "LF",
        indentation: { type: "spaces" as const, size: 4 },
        encoding: "UTF-8",
        language: "Plain Text",
      };
    }

    const content = activeBuffer.content;
    return {
      lineEnding: detectLineEnding(content),
      indentation: detectIndentation(content),
      encoding: detectEncoding(content),
      language: getLanguageFromExtension(activeBuffer.extension),
    };
  }, [activeBuffer?.content, activeBuffer?.extension]);

  // Check if buffer has unsaved changes
  const hasUnsavedChanges = activeBuffer?.isDirty || false;

  return (
    <footer
      className="workspace-footer bg-background flex h-10 w-full items-center justify-between border-t px-2 text-[11px] flex-shrink-0"
      data-status-bar
    >
      <div className="flex items-center gap-1">
        {/* Git Branch Switcher */}
        <GitBranchSwitcher />

        {/* Terminal - Toggle and Create */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleTerminal}
          className="hover:bg-accent/50 flex h-7 items-center gap-1 rounded-sm px-2 py-0"
          title="Toggle terminal"
        >
          <Terminal className="h-3 w-3 text-blue-400" />
          <span className="text-muted-foreground">Terminal</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreateTerminal}
          className="hover:bg-accent/50 flex h-7 items-center gap-1 rounded-sm px-2 py-0"
          title="Create new terminal"
        >
          <Terminal className="h-3 w-3 text-green-400" />
          <span className="text-muted-foreground">New</span>
        </Button>

        {/* View Toggle */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-muted/50 rounded-md p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCode}
              className={cn(
                "h-7 px-2 py-0 text-xs rounded-l-sm rounded-r-none transition-all",
                codeVisible && getActiveAccentClasses(accentColor, useGradient)
              )}
              title="Toggle Code Editor"
            >
              Code
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleKanban}
              className={cn(
                "h-7 px-2 py-0 text-xs rounded-none transition-all",
                kanbanVisible && getActiveAccentClasses(accentColor, useGradient)
              )}
              title="Toggle Kanban Panel"
            >
              Kanban
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAgents}
              className={cn(
                "h-7 px-2 py-0 text-xs rounded-r-sm rounded-l-none transition-all",
                agentsVisible && getActiveAccentClasses(accentColor, useGradient)
              )}
              title="Toggle Agents Panel"
            >
              Agent
            </Button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1 px-2">
          {hasUnsavedChanges ? (
            <>
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
              <span className="text-yellow-400/80">Modified</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              <span className="text-muted-foreground">Ready</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Cursor Position */}
        {activeBuffer?.cursorPosition && (
          <div className="hover:bg-accent/30 flex cursor-default items-center gap-1 rounded-sm px-2">
            <Activity className="h-3 w-3 text-cyan-400" />
            <span className="text-muted-foreground">
              Ln {activeBuffer.cursorPosition.line}, Col{" "}
              {activeBuffer.cursorPosition.column}
            </span>
          </div>
        )}

        {/* Language Mode */}
        {activeBuffer && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-accent/50 flex h-7 items-center gap-1 rounded-sm px-2 py-0"
          >
            <FileCode2 className="h-3 w-3 text-orange-400" />
            <span className="text-muted-foreground">{editorInfo.language}</span>
          </Button>
        )}

        {/* Encoding */}
        {activeBuffer && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-accent/50 flex h-7 items-center gap-1 rounded-sm px-2 py-0"
          >
            <Database className="h-3 w-3 text-teal-400" />
            <span className="text-muted-foreground">{editorInfo.encoding}</span>
          </Button>
        )}

        {/* Indentation */}
        {activeBuffer && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-accent/50 flex h-7 items-center gap-1 rounded-sm px-2 py-0"
          >
            <Zap className="h-3 w-3 text-pink-400" />
            <span className="text-muted-foreground">
              {editorInfo.indentation.type === "spaces"
                ? `${editorInfo.indentation.size} Spaces`
                : `Tab Size: ${editorInfo.indentation.size}`}
            </span>
          </Button>
        )}

        {/* Line Endings */}
        {activeBuffer && (
          <div className="hover:bg-accent/30 flex cursor-default items-center gap-1 rounded-sm px-2">
            <span className="text-muted-foreground text-[10px]">
              {editorInfo.lineEnding}
            </span>
          </div>
        )}
      </div>
    </footer>
  );
}
