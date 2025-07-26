import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/helpers/window_helpers";
import React, { type ReactNode, useState, useEffect } from "react";
import GlobalCommands from "./global-commands";
import { SettingsIcon, UserIcon } from "lucide-react";
import { SettingsModal } from "./settings";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { SignInSheet } from "@/components/auth/SignInSheet";
import { UserAvatarButton } from "@/components/auth/UserAvatarButton";
import { PresenceIndicator } from "@/components/PresenceIndicator";

interface AppHeaderProps {
  title?: ReactNode;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { user, getSession } = useAuthStore();

  // Check for existing session on mount
  useEffect(() => {
    getSession();
  }, [getSession]);

  return (
    <>
      <div className="draglayer relative z-950 flex w-screen items-stretch border-b py-1">
        <div className="flex flex-1 items-center px-4">
          <div className="no-drag">
            <Link to="/">
              <img src="src/assets/imgs/vcode.svg" className="text-xs h-4" />
            </Link>
          </div>
          <div className="no-drag flex-1 items-center ml-4">
            <GlobalCommands onOpenSettings={() => setSettingsOpen(true)} />
          </div>
        </div>
        <div className="text-muted-foreground flex flex-1 items-center justify-end px-4 select-none">
          <div className="no-drag flex items-center gap-2">
            {/* Presence Indicator */}
            <PresenceIndicator />
            
            {/* User Avatar / Sign In Button */}
            {user ? (
              <UserAvatarButton onOpenSettings={() => setSettingsOpen(true)} />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSignInOpen(true)}
                className="h-8 px-3 hover:bg-slate-700 rounded-md transition-colors"
                title="Sign In"
              >
                <UserIcon size={12} className="mr-1" />
                <span className="text-xs">Sign In</span>
              </Button>
            )}
            
            {/* Settings Button */}
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
      <SignInSheet open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
