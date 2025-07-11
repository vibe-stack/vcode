import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useBufferStore, BufferContent } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Circle, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface EditorPaneProps {
  paneId: string;
  className?: string;
}

interface TabProps {
  buffer: BufferContent;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function Tab({ buffer, isActive, onClick, onClose, onDragStart, onDragEnd, isDragging }: TabProps) {
  const handleCloseClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onClose();
  }, [onClose]);

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
      <span className="text-sm truncate flex-1 min-w-0">
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

interface EditorProps {
  buffer: BufferContent;
  onChange: (content: string) => void;
}

function Editor({ buffer, onChange }: EditorProps) {
  const [content, setContent] = useState(buffer.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(buffer.content || '');
  }, [buffer.content]);

  const handleContentChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setContent(newContent);
    onChange(newContent);
  }, [onChange]);

  // Handle cursor position restoration
  useEffect(() => {
    if (textareaRef.current && buffer.cursorPosition) {
      const textarea = textareaRef.current;
      const lines = content.split('\n');
      let position = 0;
      
      for (let i = 0; i < buffer.cursorPosition.line && i < lines.length; i++) {
        position += lines[i].length + 1; // +1 for newline
      }
      
      position += Math.min(buffer.cursorPosition.column, lines[buffer.cursorPosition.line]?.length || 0);
      
      textarea.setSelectionRange(position, position);
    }
  }, [buffer.cursorPosition, content]);

  if (buffer.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (buffer.error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-sm mb-2">Error loading file</p>
          <p className="text-xs text-muted-foreground">{buffer.error}</p>
        </div>
      </div>
    );
  }

  if (!buffer.isEditable) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2">
            Cannot edit {buffer.type} file
          </p>
          <p className="text-xs text-muted-foreground">
            File size: {buffer.fileSize ? `${Math.round(buffer.fileSize / 1024)}KB` : 'Unknown'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        className="flex-1 resize-none border-0 rounded-none font-mono text-sm"
        placeholder="Start typing..."
        style={{
          scrollbarWidth: 'thin',
        }}
      />
    </div>
  );
}

export function EditorPane({ paneId, className }: EditorPaneProps) {
  const { 
    buffers, 
    closeBuffer, 
    updateBufferContent 
  } = useBufferStore();
  
  const { 
    getPane, 
    setActivePane, 
    setActivePaneBuffer, 
    closeBufferInPane, 
    moveBuffer,
    startDrag,
    endDrag,
    activePaneId
  } = useEditorSplitStore();
  
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const pane = getPane(paneId);
  const paneBuffers = pane?.bufferIds.map(id => buffers.get(id)!).filter(Boolean) || [];
  const activeBuffer = pane?.activeBufferId ? buffers.get(pane.activeBufferId) : null;
  const isActivePane = activePaneId === paneId;

  const handleTabClick = useCallback((bufferId: string) => {
    setActivePane(paneId);
    setActivePaneBuffer(paneId, bufferId);
  }, [paneId, setActivePane, setActivePaneBuffer]);

  const handleTabClose = useCallback(async (bufferId: string) => {
    // First close the buffer globally
    await closeBuffer(bufferId);
    // Then remove from this pane
    closeBufferInPane(paneId, bufferId);
  }, [closeBuffer, closeBufferInPane, paneId]);

  const handleTabDragStart = useCallback((bufferId: string, event: React.DragEvent) => {
    setDraggedTabId(bufferId);
    startDrag('tab', bufferId, paneId);
    
    event.dataTransfer.setData('application/x-tab-id', bufferId);
    event.dataTransfer.setData('application/x-source-pane', paneId);
    event.dataTransfer.effectAllowed = 'move';
  }, [paneId, startDrag]);

  const handleTabDragEnd = useCallback(() => {
    setDraggedTabId(null);
    endDrag();
  }, [endDrag]);

  const handleContentChange = useCallback((content: string) => {
    if (activeBuffer) {
      updateBufferContent(activeBuffer.id, content);
    }
  }, [activeBuffer, updateBufferContent]);

  const handleTabDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const tabId = event.dataTransfer.getData('application/x-tab-id');
    const sourcePaneId = event.dataTransfer.getData('application/x-source-pane');
    
    if (tabId && sourcePaneId && sourcePaneId !== paneId) {
      // Move buffer from source pane to this pane
      moveBuffer(tabId, sourcePaneId, paneId);
    }
  }, [paneId, moveBuffer]);

  const handlePaneClick = useCallback(() => {
    setActivePane(paneId);
  }, [paneId, setActivePane]);

  return (
    <div 
      className={cn("flex flex-col h-full bg-background", className)}
      onClick={handlePaneClick}
      data-pane-id={paneId}
    >
      {/* Tab Bar */}
      <div 
        ref={tabBarRef}
        className={cn(
          "border-b bg-muted/30 transition-colors",
          isActivePane && "bg-muted/50"
        )}
        onDrop={handleTabDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex items-center min-h-[32px]">
          <ScrollArea className="flex-1">
            <div className="flex overflow-x-auto">
              {paneBuffers.map((buffer) => (
                <Tab
                  key={buffer.id}
                  buffer={buffer}
                  isActive={buffer.id === activeBuffer?.id}
                  onClick={() => handleTabClick(buffer.id)}
                  onClose={() => handleTabClose(buffer.id)}
                  onDragStart={(event) => handleTabDragStart(buffer.id, event)}
                  onDragEnd={handleTabDragEnd}
                  isDragging={draggedTabId === buffer.id}
                />
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex items-center px-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {activeBuffer ? (
          <Editor
            buffer={activeBuffer}
            onChange={handleContentChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">No file selected</p>
              <p className="text-xs text-muted-foreground">
                Drag a file here or click on a file in the explorer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
