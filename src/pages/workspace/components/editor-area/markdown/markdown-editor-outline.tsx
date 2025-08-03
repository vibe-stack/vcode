import React, { useState } from 'react';
import { cn } from '@/utils/tailwind';
import { HeadingNode } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentsTab } from './comments-tab';
import { Editor } from '@tiptap/react';
import { X } from 'lucide-react';

interface OutlineProps {
  headings: HeadingNode[];
  isVisible: boolean;
  onJump: (heading: HeadingNode) => void;
  onHide: () => void;
  editor: Editor | null;
  fileId: string;
}

export const MarkdownEditorOutline: React.FC<OutlineProps> = ({ 
  headings, 
  isVisible, 
  onJump, 
  onHide, 
  editor, 
  fileId 
}) => {
  const [activeTab, setActiveTab] = useState<'outline' | 'comments'>('outline');

  if (!isVisible) return null;

  return (
    <div className="w-80 border-l border-border bg-background/50 overflow-auto">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Sidebar</span>
          <button
            onClick={onHide}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'outline' | 'comments')}>
        <div className="border-b border-border">
          <TabsList className="w-full grid grid-cols-2 rounded-none">
            <TabsTrigger value="outline" className="text-xs">
              Outline
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">
              Comments
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="outline" className="p-2 space-y-1 mt-0">
          {headings.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No headings found
            </div>
          ) : (
            headings.map((heading) => (
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
            ))
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-0 p-0">
          <CommentsTab
            fileId={fileId}
            editor={editor}
            isVisible={true}
            onHide={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
