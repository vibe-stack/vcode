import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText } from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface HeadingNode {
  id: string;
  level: number;
  text: string;
  position: number;
}

export interface MarkdownOutlineProps {
  headings: HeadingNode[];
  onHeadingClick: (heading: HeadingNode) => void;
  onToggle: () => void;
}

export function MarkdownOutline({ headings, onHeadingClick, onToggle }: MarkdownOutlineProps) {
  if (headings.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Outline</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No headings found</p>
            <p className="text-xs mt-1">Add headings to see the outline</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">Outline</span>
          <span className="text-xs text-muted-foreground">({headings.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Outline list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {headings.map((heading) => (
            <Button
              key={heading.id}
              variant="ghost"
              size="sm"
              onClick={() => onHeadingClick(heading)}
              className={cn(
                "w-full justify-start text-left h-auto py-2 px-3 whitespace-normal break-words",
                "hover:bg-muted/50 transition-colors"
              )}
              style={{
                paddingLeft: `${8 + (heading.level - 1) * 16}px`,
              }}
            >
              <div className="flex items-start gap-2 w-full">
                {/* Level indicator */}
                <div 
                  className={cn(
                    "flex-shrink-0 w-1 h-4 rounded-full mt-0.5",
                    heading.level === 1 && "bg-blue-500",
                    heading.level === 2 && "bg-green-500",
                    heading.level === 3 && "bg-yellow-500",
                    heading.level === 4 && "bg-orange-500",
                    heading.level === 5 && "bg-red-500",
                    heading.level === 6 && "bg-purple-500"
                  )}
                />
                
                {/* Heading text */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "truncate",
                    heading.level === 1 && "text-sm font-semibold",
                    heading.level === 2 && "text-sm font-medium",
                    heading.level >= 3 && "text-xs"
                  )}>
                    {heading.text || `Heading ${heading.level}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    H{heading.level}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
