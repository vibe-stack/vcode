import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { File, Globe, Link, Folder } from "lucide-react";
import { cn } from "@/utils/tailwind";
import { MentionItem } from "./types";

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

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const getIcon = (type: string) => {
    switch (type) {
      case "file":
        return <File className="h-4 w-4" />;
      case "url":
        return <Globe className="h-4 w-4" />;
      case "reference":
        return <Link className="h-4 w-4" />;
      default:
        return <Folder className="h-4 w-4" />;
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="max-h-64 w-80 border shadow-lg">
      <CardContent className="p-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-1">
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={index === selectedIndex ? selectedItemRef : null}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors",
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted",
                )}
                onClick={() => onSelect(item)}
              >
                <div className="text-muted-foreground flex-shrink-0">
                  {item.icon || getIcon(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {item.label}
                  </div>
                  {item.description && (
                    <div className="text-muted-foreground truncate text-xs">
                      {item.description}
                    </div>
                  )}
                  {item.path && (
                    <div className="text-muted-foreground truncate text-xs">
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
