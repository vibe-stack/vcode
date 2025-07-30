import React from 'react';
import { cn } from '@/utils/tailwind';
import { HeadingNode } from './types';

interface OutlineProps {
  headings: HeadingNode[];
  isVisible: boolean;
  onJump: (heading: HeadingNode) => void;
  onHide: () => void;
}

export const MarkdownEditorOutline: React.FC<OutlineProps> = ({ headings, isVisible, onJump, onHide }) => {
  if (!isVisible || headings.length === 0) return null;
  return (
    <div className="w-64 border-l border-border bg-background/50 overflow-auto">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Outline</span>
          <button
            onClick={onHide}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Hide
          </button>
        </div>
      </div>
      <div className="p-2 space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => onJump(heading)}
            className={cn(
              "w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors",
              `pl-${2 + heading.level * 2}`
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">H{heading.level}</span>
              <span className="truncate">{heading.text || `Heading ${heading.level}`}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
