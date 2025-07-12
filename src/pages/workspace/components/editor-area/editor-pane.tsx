import React, { useState, useCallback } from 'react';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { cn } from '@/utils/tailwind';
import { TabBar } from './tab-bar';
import { Editor } from './editor';
import { EditorPaneProps } from './types';

export function EditorPane({ paneId, className }: EditorPaneProps) {
  // Use separate selectors to ensure re-renders when state changes
  const buffers = useBufferStore(state => state.buffers);
  const closeBuffer = useBufferStore(state => state.closeBuffer);
  const updateBufferContent = useBufferStore(state => state.updateBufferContent);
  
  // Select the pane object directly so this component re-renders on state change
  const pane = useEditorSplitStore(state => state.getPane(paneId));
  const setActivePane = useEditorSplitStore(state => state.setActivePane);
  const setActivePaneBuffer = useEditorSplitStore(state => state.setActivePaneBuffer);
  const closeBufferInPane = useEditorSplitStore(state => state.closeBufferInPane);
  const moveBuffer = useEditorSplitStore(state => state.moveBuffer);
  const startDrag = useEditorSplitStore(state => state.startDrag);
  const endDrag = useEditorSplitStore(state => state.endDrag);
  const activePaneId = useEditorSplitStore(state => state.activePaneId);
  
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  // Use the selected pane object for bufferIds and activeBufferId
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
      <TabBar
        paneId={paneId}
        buffers={paneBuffers}
        activeBufferId={activeBuffer?.id || null}
        isActivePane={isActivePane}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onTabDragStart={handleTabDragStart}
        onTabDragEnd={handleTabDragEnd}
        onTabDrop={handleTabDrop}
        draggedTabId={draggedTabId}
      />

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {activeBuffer ? (
          <Editor
            buffer={activeBuffer}
            onChange={handleContentChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center select-none">
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
