import React, { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface AppHeaderProps {
  title?: ReactNode;
}

export default function AppHeader({ title }: AppHeaderProps) {
  return (
    <div className="draglayer relative z-940 flex w-screen items-stretch border-b py-1">
      <div className="flex flex-1 items-center px-4">
        <div className="no-drag">
          <Link to="/">
            <img src="src/assets/imgs/vcode.svg" className="text-xs h-4" />
          </Link>
        </div>
        {title && (
          <div className="flex-1 items-center ml-4 text-sm text-muted-foreground">
            {title}
          </div>
        )}
      </div>
    </div>
  );
}
