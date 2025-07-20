import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/helpers/window_helpers";
import React, { type ReactNode, useState } from "react";
import GlobalCommands from "./global-commands";
import { SettingsIcon } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import { Link } from "@tanstack/react-router";

interface AppHeaderProps {
  title?: ReactNode;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
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
        <div className="text-muted-foreground flex flex-1 items-center justify-end px-4 select-none">
          <div className="no-drag">
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
