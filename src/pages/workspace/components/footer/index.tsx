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
    settingsVisible,
    toggleCode, 
    toggleAgents, 
    toggleKanban,
    toggleSettings,
    fileExplorerTab,
    setFileExplorerTab
  } = useEditorContentStore();
  const {
    isVisible: isTerminalVisible,
    setVisible: setTerminalVisible,
    createTab,
    tabs,
  } = useTerminalStore();
  const { currentBranch, isGitRepo } = useGitStore();
  const { settings } = useSettingsStore();
  const accentColor = settings.appearance?.accentColor || "blue";
  const useGradient = settings.appearance?.accentGradient ?? true;
  const [goToLineOpen, setGoToLineOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const handleCreateTerminal = async () => {
    try {
      console.log('Creating terminal with cwd:', currentProject);
      // Create a new terminal
      const terminalInfo = await window.terminalApi.create({
        cwd: currentProject || undefined,
        title: "Terminal",
      });

      console.log('Terminal created:', terminalInfo);
      // Add it to the store
      createTab(terminalInfo);

      // Make sure terminal is visible
      setTerminalVisible(true);
      console.log('Terminal added to store and made visible');
    } catch (error) {
      console.error("Failed to create terminal:", error);
    }
  };

  const handleToggleTerminal = async () => {
    if (!isTerminalVisible) {
      // If terminal is not visible, show it
      setTerminalVisible(true);
      // If no terminals exist, create one automatically
      if (tabs.length === 0) {
        console.log('No terminals exist, creating one automatically...');
        await handleCreateTerminal();
      }
    } else {
      // If terminal is visible, hide it
      setTerminalVisible(false);
    }
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
      className="workspace-footer flex h-9 w-full items-center justify-between px-2 text-[11px] flex-shrink-0"
      data-status-bar
    >
      {/* Left Section - View Icons */}
      <div className="flex items-center gap-1">
        {/* Git Branch */}
        <GitBranchSwitcher />

        {/* All Icons in New Order: files, git, mcp, ext, theme, code, kanban, agent */}
        <div className="flex items-center gap-1.5 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab(fileExplorerTab === "files" ? null : "files")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
              fileExplorerTab === "files" && getActiveAccentClasses(accentColor, useGradient)
            )}
            title="Files"
          >
            <Files className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab(fileExplorerTab === "git" ? null : "git")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
              fileExplorerTab === "git" && getActiveAccentClasses(accentColor, useGradient)
            )}
            title="Git"
            disabled={!isGitRepo}
          >
            <GitBranch className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab(fileExplorerTab === "tools" ? null : "tools")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
              fileExplorerTab === "tools" && getActiveAccentClasses(accentColor, useGradient)
            )}
            title="Tools"
          >
            <Server className="h-3 w-3" />
          </Button>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab(fileExplorerTab === "extensions" ? null : "extensions")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
              fileExplorerTab === "extensions" && getActiveAccentClasses(accentColor, useGradient)
            )}
            title="Extensions"
          >
            <Package className="h-3 w-3" />
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFileExplorerTab(fileExplorerTab === "themes" ? null : "themes")}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
              fileExplorerTab === "themes" && getActiveAccentClasses(accentColor, useGradient)
            )}
            title="Themes"
          >
            <Palette className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCode}
            className={cn(
              "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
              codeVisible && getActiveAccentClasses(accentColor, useGradient)
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
              "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
              kanbanVisible && getActiveAccentClasses(accentColor, useGradient)
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
              "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
              agentsVisible && getActiveAccentClasses(accentColor, useGradient)
            )}
            title="Toggle Agents Panel"
          >
            <MessageSquare className="h-3 w-3" />
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
            "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
            isTerminalVisible && getActiveAccentClasses(accentColor, useGradient)
          )}
          title="Toggle Terminal"
        >
          <Terminal className="h-3 w-3" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className={cn(
            "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
            notificationsOpen && getActiveAccentClasses(accentColor, useGradient)
          )}
          title="Notifications"
        >
          <Bell className="h-3 w-3" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            toggleSettings();
            onOpenSettings?.();
          }}
          className={cn(
            "h-5 w-5 p-0 transition-all hover:bg-accent/50 !rounded-sm",
            settingsVisible && getActiveAccentClasses(accentColor, useGradient)
          )}
          title="Settings"
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
