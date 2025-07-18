import React, { useCallback, useRef } from "react";
import { BufferContent } from "@/stores/buffers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/tailwind";
import { MoreHorizontal, X } from "lucide-react";
import { Tab } from "./tab";

export interface TabBarProps {
  paneId: string;
  buffers: BufferContent[];
  activeBufferId: string | null;
  isActivePane: boolean;
  onTabClick: (bufferId: string) => void;
  onTabClose: (bufferId: string) => void;
  onTabDragStart: (bufferId: string, event: React.DragEvent) => void;
  onTabDragEnd: () => void;
  onTabDrop: (event: React.DragEvent) => void;
  draggedTabId: string | null;
  onClosePane: () => void;
  canClosePane?: boolean;
}

export function TabBar({
  paneId,
  buffers,
  activeBufferId,
  isActivePane,
  onTabClick,
  onTabClose,
  onTabDragStart,
  onTabDragEnd,
  onTabDrop,
  draggedTabId,
  onClosePane,
  canClosePane = true,
}: TabBarProps) {
  const tabBarRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={tabBarRef}
      className={cn(
        "bg-muted/30 border-b transition-colors",
        isActivePane && "bg-muted/50",
      )}
      onDrop={onTabDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex min-h-[32px] items-center">
        <ScrollArea className="flex-1">
          <div className="flex overflow-x-auto">
            {buffers.map((buffer) => (
              <Tab
                key={buffer.id}
                buffer={buffer}
                isActive={buffer.id === activeBufferId}
                onClick={() => onTabClick(buffer.id)}
                onClose={() => onTabClose(buffer.id)}
                onDragStart={(event) => onTabDragStart(buffer.id, event)}
                onDragEnd={onTabDragEnd}
                isDragging={draggedTabId === buffer.id}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Pane menu button */}
        <div className="flex-shrink-0 px-1">
          {canClosePane && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-muted h-6 w-6 p-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={onClosePane}
                  className="text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  Close
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
