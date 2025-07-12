import React, { useCallback, useRef } from 'react';
import { BufferContent } from '@/stores/buffers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/tailwind';
import { Tab } from './tab';

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
}: TabBarProps) {
  const tabBarRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={tabBarRef}
      className={cn(
        "border-b bg-muted/30 transition-colors",
        isActivePane && "bg-muted/50"
      )}
      onDrop={onTabDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex items-center min-h-[32px]">
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
      </div>
    </div>
  );
}
