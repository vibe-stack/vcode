import React, { useState, useCallback, useEffect } from 'react';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { cn } from '@/utils/tailwind';
import { TabBar } from './tab-bar';
import { ContentRenderer } from './content-renderer';
import { EditorPaneProps } from './types';
import { UnsavedChangesDialog } from '@/components/unsaved-changes-dialog';
import { bufferCloseService } from '@/services/buffer-close';

export function EditorPane({ paneId, className }: EditorPaneProps) {
  // Use specific selectors to minimize re-renders
  const getBuffer = useBufferStore(state => state.getBuffer);
  const updateBufferContent = useBufferStore(state => state.updateBufferContent);
  
  // Get pane data directly
  const pane = useEditorSplitStore(state => state.getPane(paneId));
  const setActivePane = useEditorSplitStore(state => state.setActivePane);
  const setActivePaneBuffer = useEditorSplitStore(state => state.setActivePaneBuffer);
  const closePane = useEditorSplitStore(state => state.closePane);
  const getAllPanes = useEditorSplitStore(state => state.getAllPanes);
  const moveBuffer = useEditorSplitStore(state => state.moveBuffer);
  const startDrag = useEditorSplitStore(state => state.startDrag);
  const endDrag = useEditorSplitStore(state => state.endDrag);
  const activePaneId = useEditorSplitStore(state => state.activePaneId);
  
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [unsavedChangesDialog, setUnsavedChangesDialog] = useState<{
    open: boolean;
    bufferId: string;
    fileName: string;
    onSave: () => Promise<void>;
    onDiscard: () => void;
    onCancel: () => void;
  }>({
    open: false,
    bufferId: '',
    fileName: '',
    onSave: async () => {},
    onDiscard: () => {},
    onCancel: () => {},
  });

  // Set up the confirmation handler for the buffer close service
  useEffect(() => {
    bufferCloseService.setConfirmationHandler(paneId, (options) => {
      setUnsavedChangesDialog({
        open: true,
        bufferId: options.bufferId,
        fileName: options.fileName,
        onSave: options.onSave,
        onDiscard: options.onDiscard,
        onCancel: options.onCancel,
      });
    });

    // Cleanup when component unmounts
    return () => {
      bufferCloseService.removeConfirmationHandler(paneId);
    };
  }, [paneId]);

  // Use the selected pane object for bufferIds and activeBufferId
  const paneBuffers = (pane?.bufferIds.map(id => getBuffer(id)).filter((buffer): buffer is NonNullable<typeof buffer> => buffer !== null)) || [];
  const activeBuffer = pane?.activeBufferId ? getBuffer(pane.activeBufferId) : null;
  const isActivePane = activePaneId === paneId;

  const handleTabClick = useCallback((bufferId: string) => {
    setActivePane(paneId);
    setActivePaneBuffer(paneId, bufferId);
    // Also update the global buffer store's active buffer for commands like Cmd+W
    useBufferStore.getState().setActiveBuffer(bufferId);
  }, [paneId, setActivePane, setActivePaneBuffer]);

  const handleTabClose = useCallback(async (bufferId: string) => {
    await bufferCloseService.closeBuffer({ bufferId, paneId });
  }, [paneId]);

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
    // Also update the global buffer store's active buffer when pane is clicked
    if (activeBuffer) {
      useBufferStore.getState().setActiveBuffer(activeBuffer.id);
    }
  }, [paneId, setActivePane, activeBuffer]);

  const handleClosePane = useCallback(() => {
    // Get all panes to check if this is the last one
    const allPanes = getAllPanes();
    if (allPanes.length > 1) {
      closePane(paneId);
    }
  }, [closePane, paneId, getAllPanes]);

  return (
    <>
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
          onClosePane={handleClosePane}
          canClosePane={getAllPanes().length > 1}
        />

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden">
          {activeBuffer ? (
            <ContentRenderer
              buffer={activeBuffer}
              isFocused={isActivePane}
              onChange={handleContentChange}
              onFocus={() => handleTabClick(activeBuffer.id)}
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

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={unsavedChangesDialog.open}
        onOpenChange={(open) => setUnsavedChangesDialog(prev => ({ ...prev, open }))}
        fileName={unsavedChangesDialog.fileName}
        onSave={unsavedChangesDialog.onSave}
        onDiscard={unsavedChangesDialog.onDiscard}
        onCancel={unsavedChangesDialog.onCancel}
      />
    </>
  );
}
