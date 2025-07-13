import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File, Globe, Link, Folder } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { MentionItem } from './types';

interface MentionSuggestionProps {
  items: MentionItem[];
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export const MentionSuggestion: React.FC<MentionSuggestionProps> = ({
  items,
  selectedIndex,
  onSelect,
  onKeyDown,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <File className="h-4 w-4" />;
      case 'url':
        return <Globe className="h-4 w-4" />;
      case 'reference':
        return <Link className="h-4 w-4" />;
      default:
        return <Folder className="h-4 w-4" />;
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="w-80 max-h-64 shadow-lg border">
      <CardContent className="p-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-1">
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={index === selectedIndex ? selectedItemRef : null}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => onSelect(item)}
              >
                <div className="flex-shrink-0 text-muted-foreground">
                  {item.icon || getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {item.label}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  )}
                  {item.path && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.path}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
