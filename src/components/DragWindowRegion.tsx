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

interface DragWindowRegionProps {
  title?: ReactNode;
}

export default function DragWindowRegion({ title }: DragWindowRegionProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="draglayer relative z-950 flex  items-stretch border-b py-1">
        <div className="flex flex-1 items-center px-4">
          <div className="no-drag">
            <Link to="/">
              <img
                src="src/assets/imgs/vcode_long.svg"
                className="h-4 text-xs"
              />
            </Link>
          </div>
        </div>
        <div className="flex items-center">
          <div className="no-drag flex-1 items-center">
            <GlobalCommands onOpenSettings={() => setSettingsOpen(true)} />
          </div>
        </div>
        <div className="text-muted-foreground flex flex-1 items-center justify-end px-4 select-none">
          <div className="no-drag">
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-md p-2 transition-colors hover:bg-slate-700"
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

function WindowButtons() {
  return (
    <div className="flex">
      <button
        type="button"
        title="Close"
        className="cursor-default rounded-md p-2 hover:cursor-default hover:bg-red-700"
        onClick={closeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <polygon
            fill="currentColor"
            fillRule="evenodd"
            points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
          ></polygon>
        </svg>
      </button>
      <button
        title="Minimize"
        type="button"
        className="cursor-default rounded-md p-2 hover:cursor-default hover:bg-slate-700"
        onClick={minimizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
        </svg>
      </button>
      <button
        title="Maximize"
        type="button"
        className="cursor-default rounded-md p-2 hover:cursor-default hover:bg-slate-700"
        onClick={maximizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect
            width="9"
            height="9"
            x="1.5"
            y="1.5"
            fill="none"
            stroke="currentColor"
          ></rect>
        </svg>
      </button>
    </div>
  );
}
