import React, { useCallback } from "react";
import { BufferContent } from "@/stores/buffers";
import { Button } from "@/components/ui/button";
import { X, Circle } from "lucide-react";
import { cn } from "@/utils/tailwind";
import { useFileGitStatus } from "@/hooks/use-file-git-status";
import { getGitStatusColor } from "@/services/git-api";

export interface TabProps {
  buffer: BufferContent;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function Tab({
  buffer,
  isActive,
  onClick,
  onClose,
  onDragStart,
  onDragEnd,
  isDragging,
}: TabProps) {
  const handleCloseClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onClose();
    },
    [onClose],
  );

  const gitFileStatus = useFileGitStatus(buffer.filePath);

  return (
    <div
      className={cn(
        "flex min-w-0 cursor-pointer items-center gap-2 border-r px-3 py-2 transition-colors select-none",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-background border-b-primary border-b-2",
        isDragging && "opacity-50",
      )}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          gitFileStatus
            ? getGitStatusColor(
                gitFileStatus?.workingTreeStatus,
                gitFileStatus?.indexStatus,
              )
            : "",
        )}
      >
        {buffer.name}
      </span>

      <div className="flex items-center gap-1">
        {buffer.isDirty && (
          <Circle className="h-2 w-2 fill-current text-orange-500" />
        )}

        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-accent-foreground/10 h-4 w-4 p-0"
          onClick={handleCloseClick}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
