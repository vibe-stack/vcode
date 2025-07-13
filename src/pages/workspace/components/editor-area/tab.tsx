import React, { useCallback } from 'react';
import { BufferContent } from '@/stores/buffers';
import { Button } from '@/components/ui/button';
import { X, Circle } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { useFileGitStatus } from '@/hooks/use-file-git-status';
import { getGitStatusColor } from '@/services/git-api';

export interface TabProps {
  buffer: BufferContent;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function Tab({ buffer, isActive, onClick, onClose, onDragStart, onDragEnd, isDragging }: TabProps) {
  const handleCloseClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onClose();
  }, [onClose]);

  const gitFileStatus = useFileGitStatus(buffer.filePath);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 border-r cursor-pointer select-none min-w-0 transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-background border-b-2 border-b-primary",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <span className={
        cn("text-sm truncate flex-1 min-w-0", gitFileStatus ? getGitStatusColor(gitFileStatus?.workingTreeStatus, gitFileStatus?.indexStatus) : '')
      }>
        {buffer.name}
      </span>

      <div className="flex items-center gap-1">
        {buffer.isDirty && (
          <Circle className="h-2 w-2 fill-current text-orange-500" />
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-accent-foreground/10"
          onClick={handleCloseClick}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
