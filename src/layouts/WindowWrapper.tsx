import React, { useState, useEffect } from 'react';
import {
    closeWindow,
    maximizeWindow,
    minimizeWindow
} from "@/helpers/window_helpers";
import { SettingsIcon, UserIcon, Minus, Square, X, MinusIcon, XIcon, Maximize2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { SettingsModal } from "@/components/settings";
import { SignInSheet } from "@/components/auth/SignInSheet";
import { UserAvatarButton } from "@/components/auth/UserAvatarButton";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import GlobalCommands from "@/components/global-commands";
import { isMacOS } from "@/services/keymaps/utils";

// Platform-specific window controls
const MacOSTrafficLights = () => (
    <div className="flex items-center space-x-2 no-drag">
        <button
            onClick={closeWindow}
            className="w-3.5 h-3.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors group flex items-center justify-center"
            title="Close"
        >
            <XIcon size={10} className="hidden group-hover:block text-black/50 self-center" />
        </button>
        <button
            onClick={minimizeWindow}
            className="w-3.5 h-3.5 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors group flex items-center justify-center"
            title="Minimize"
        >
            <MinusIcon size={10} strokeWidth={4} className="hidden group-hover:block text-black/50 self-center" />
        </button>
        <button
            onClick={maximizeWindow}
            className="w-3.5 h-3.5 bg-green-500 hover:bg-green-600 rounded-full transition-colors group flex items-center justify-center"
            title="Maximize"
        >
            <Maximize2Icon size={6} strokeWidth={4} className="hidden group-hover:block text-black/50 self-center" />
        </button>
    </div>
);

const WindowsControls = () => (
    <div className="flex items-center no-drag">
        <button
            onClick={minimizeWindow}
            className="h-8 w-12 flex items-center justify-center hover:bg-white/10 transition-colors"
            title="Minimize"
        >
            <Minus size={14} />
        </button>
        <button
            onClick={maximizeWindow}
            className="h-8 w-12 flex items-center justify-center hover:bg-white/10 transition-colors"
            title="Maximize"
        >
            <Square size={12} />
        </button>
        <button
            onClick={closeWindow}
            className="h-8 w-12 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Close"
        >
            <X size={14} />
        </button>
    </div>
);

export const WindowWrapper = ({ children }: { children: React.ReactNode }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [signInOpen, setSignInOpen] = useState(false);
    const { user, getSession } = useAuthStore();
    const isMac = isMacOS();

    // Check for existing session on mount
    useEffect(() => {
        getSession();
    }, [getSession]);

    return (
        <>
            <div className="flex flex-col h-screen">
                {/* Title Bar */}
                <div className="draglayer relative z-950 flex w-full h-10 bg-background/80 items-center justify-between">
                    {/* Left side - Window controls (platform specific) */}
                    <div className="flex items-center px-4">
                        {isMac ? <MacOSTrafficLights /> : <WindowsControls />}
                    </div>

                    {/* Center - Global Commands Search */}
                    <div className="flex-1 flex justify-center px-4">
                        <div className="no-drag max-w-md w-full">
                            <GlobalCommands onOpenSettings={() => setSettingsOpen(true)} />
                        </div>
                    </div>

                    {/* Right side - User controls */}
                    <div className="flex items-center gap-2 px-4">
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
                                    className="h-6 px-2 hover:bg-slate-700 rounded-md transition-colors"
                                    title="Sign In"
                                >
                                    <UserIcon size={10} className="mr-1" />
                                    <span className="text-xs">Sign In</span>
                                </Button>
                            )}

                            {/* Settings Button */}
                            <button
                                onClick={() => setSettingsOpen(true)}
                                className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                                title="Settings"
                            >
                                <SettingsIcon size={10} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden no-drag h-full">
                    {children}
                </div>
            </div>

            {/* Modals */}
            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
            <SignInSheet open={signInOpen} onOpenChange={setSignInOpen} />
        </>
    );
}