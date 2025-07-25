import React, { useState, useCallback, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { SettingsIcon, BotIcon, CodeIcon, Sparkles } from "lucide-react";
import { SettingsModal } from "@/components/settings";
import GlobalCommands from "@/components/global-commands";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEditorContentStore } from "@/stores/editor-content";

import { useCommandManager, useKeyBindingManager } from "@/services/keymaps/main";
import { PresenceIndicator } from "./PresenceIndicator";

export default function WorkspaceHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { view, setView } = useEditorContentStore();

  // Use keymap system for cycling views
  const views = ["code", "agents", "auto"];
  const { registerCommand, unregisterCommand } = useCommandManager();
  const { addKeyBinding, removeKeyBinding } = useKeyBindingManager();

  // Register the cycle view command and key binding
  useEffect(() => {
    // Register command
    registerCommand("view.cycleView", {
      execute: () => {
        console.log("registered keymap, view.cycleView")
        const idx = views.indexOf(view);
        const nextView = views[(idx + 1) % views.length];
        setView(nextView as typeof view);
      },
      canExecute: () => true,
    });

    // Register key binding for Cmd/Ctrl+5 (global context)
    addKeyBinding({
      id: "view.cycleView.binding",
      description: "Cycle editor views",
      key: "cmd+5",
      altKeys: ["ctrl+5"],
      command: "view.cycleView",
      enabled: true,
      category: "view",
      context: "global",
    });

    // Cleanup on unmount
    return () => {
      unregisterCommand("view.cycleView");
      removeKeyBinding("view.cycleView.binding");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, setView]);

  return (
    <>
      {/* Keymap handles Cmd/Ctrl+5 for cycling views */}
      <div className="draglayer relative z-950 flex w-screen items-stretch border-b py-1">
        <div className="flex flex-1 items-center px-4">
          <div className="no-drag">
            <Link to="/">
              <img src="src/assets/imgs/vcode_long.svg" className="text-xs h-4" />
            </Link>
          </div>
          <div className="no-drag flex-1 items-center ml-4">
            <GlobalCommands onOpenSettings={() => setSettingsOpen(true)} />
          </div>
        </div>
        
        {/* Center - View Mode Toggle */}
        <div className="flex items-center justify-center">
          <div className="no-drag">
            <ToggleGroup type="single" size="default" value={view} onValueChange={setView}>
              <ToggleGroupItem value="code" className="text-xs px-3">
                <div className="flex flex-row gap-0.5">
                  <CodeIcon className="h-3 w-3" />
                  <span>Code</span>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem value="agents" className="text-xs px-3">
                <div className="flex flex-row gap-0.5">
                  <BotIcon className="h-3 w-3" />
                  <span>Handsfree</span>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem value="auto" className="text-xs px-3">
                <div className="flex flex-row gap-0.5">
                  <Sparkles className="h-3 w-3" />
                  <span>Autopilot</span>
                </div>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="text-muted-foreground flex flex-1 items-center justify-end px-4 select-none">
          <div className="no-drag flex items-center gap-2">
            <PresenceIndicator />
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-slate-700 rounded-md transition-colors"
              title="Settings"
            >
              <SettingsIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
