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
  Code,
  Kanban,
  MessageSquare,
  Bell,
  Settings,
  Files,
  Server,
  Package,
  Palette,
} from "lucide-react";
import React from "react";
import { GitBranchSwitcher } from "./git-branch-switcher";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEditorContentStore } from "@/stores/editor-content";
import { cn } from "@/utils/tailwind";
import { useSettingsStore } from "@/stores/settings";
import { getActiveAccentClasses } from "@/utils/accent-colors";
import { GoToLineDialog } from "@/components/go-to-line-dialog";

interface WorkspaceFooterProps {
  onOpenSettings?: () => void;
}

export function WorkspaceFooter({ onOpenSettings }: WorkspaceFooterProps = {}) {
  const { currentProject } = useProjectStore();
  const { buffers, activeBufferId } = useBufferStore();
  const { 
    codeVisible, 
    agentsVisible, 
    kanbanVisible, 
    toggleCode, 
    toggleAgents, 
    toggleKanban,
    fileExplorerTab,
    setFileExplorerTab
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
  const [goToLineOpen, setGoToLineOpen] = React.useState(false);

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
      className="workspace-footer bg-background flex h-9 w-full items-center justify-between border-t px-2 text-[11px] flex-shrink-0"
      data-status-bar
    >
      {/* Left Section - View Icons */}
      <div className="flex items-center gap-1">
        {/* Git Branch */}
        <GitBranchSwitcher />

        {/* View Toggle Icons */}
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCode}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50",
              codeVisible && "bg-accent text-accent-foreground"
            )}
            title="Toggle Code Editor"
          >
            <Code className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleKanban}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50",
              kanbanVisible && "bg-accent text-accent-foreground"
            )}
            title="Toggle Kanban Panel"
          >
            <Kanban className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAgents}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50",
              agentsVisible && "bg-accent text-accent-foreground"
            )}
            title="Toggle Agents Panel"
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
        </div>

        {/* File Explorer Tab Icons */}
        <div className="flex items-center gap-1 ml-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab("files")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50",
              fileExplorerTab === "files" && "bg-accent text-accent-foreground"
            )}
            title="Files"
          >
            <Files className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab("git")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50",
              fileExplorerTab === "git" && "bg-accent text-accent-foreground"
            )}
            title="Git"
            disabled={!isGitRepo}
          >
            <GitBranch className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab("mcp")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50",
              fileExplorerTab === "mcp" && "bg-accent text-accent-foreground"
            )}
            title="MCP"
          >
            <Server className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab("extensions")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50",
              fileExplorerTab === "extensions" && "bg-accent text-accent-foreground"
            )}
            title="Extensions"
          >
            <Package className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab("themes")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50",
              fileExplorerTab === "themes" && "bg-accent text-accent-foreground"
            )}
            title="Themes"
          >
            <Palette className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Right Section - File Info and Controls */}
      <div className="flex items-center gap-1">
        {/* Language Mode */}
        {activeBuffer && (
          <span className="text-muted-foreground text-[10px]">
            {editorInfo.language.toUpperCase()}
          </span>
        )}

        {/* Cursor Position - Clickable */}
        {activeBuffer?.cursorPosition && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-accent/30 h-5 px-2 py-0 text-[10px] text-muted-foreground"
            title="Go to line (Ctrl+G)"
            onClick={() => setGoToLineOpen(true)}
          >
            {activeBuffer.cursorPosition.line}:{activeBuffer.cursorPosition.column}
          </Button>
        )}

        {/* Terminal Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleTerminal}
          className={cn(
            "h-5 w-5 p-0 transition-all hover:bg-accent/50",
            isTerminalVisible && "bg-accent text-accent-foreground"
          )}
          title="Toggle Terminal"
        >
          <Terminal className="h-3 w-3" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 transition-all hover:bg-accent/50"
          title="Notifications"
        >
          <Bell className="h-3 w-3" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 transition-all hover:bg-accent/50"
          title="Settings"
          onClick={() => onOpenSettings?.()}
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      {/* Go to Line Dialog */}
      <GoToLineDialog
        open={goToLineOpen}
        onOpenChange={setGoToLineOpen}
      />
    </footer>
  );
}
