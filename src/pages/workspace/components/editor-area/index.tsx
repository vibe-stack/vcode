import React, { useCallback, useRef, useEffect } from 'react';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore, EditorSplit, DropZone } from '@/stores/editor-splits';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/utils/tailwind';
import { EditorPane } from './editor-pane';
import { EditorKeymapProvider } from '@/services/keymaps/KeymapProvider';

export function EditorArea() {
  // Use separate selectors to ensure re-renders when state changes
  const buffers = useBufferStore(state => state.buffers);
  const tabOrder = useBufferStore(state => state.tabOrder);
  
  // Use separate selectors to ensure re-renders when state changes
  const rootSplit = useEditorSplitStore(state => state.rootSplit);
  const isDragging = useEditorSplitStore(state => state.isDragging);
  const activeDropZone = useEditorSplitStore(state => state.activeDropZone);
  const draggedItem = useEditorSplitStore(state => state.draggedItem);
  
  // Get actions
  const getAllPanes = useEditorSplitStore(state => state.getAllPanes);
  const handleDrop = useEditorSplitStore(state => state.handleDrop);
  const updateDropZones = useEditorSplitStore(state => state.updateDropZones);
  const setActiveDropZone = useEditorSplitStore(state => state.setActiveDropZone);
  const startDrag = useEditorSplitStore(state => state.startDrag);
  const endDrag = useEditorSplitStore(state => state.endDrag);
  const initializeLayout = useEditorSplitStore(state => state.initializeLayout);

  console.log("open buffers", buffers, "tab order", tabOrder, rootSplit,);

  const dragRef = useRef<HTMLDivElement>(null);

  // Initialize layout on first render
  useEffect(() => {
    const panes = getAllPanes();
    if (panes.length === 0) {
      initializeLayout();
    }
  }, [getAllPanes, initializeLayout]);

  // Calculate drop zones based on current panes
  const calculateDropZones = useCallback((clientX: number, clientY: number): DropZone[] => {
    const zones: DropZone[] = [];
    const panes = getAllPanes();

    panes.forEach(pane => {
      const paneElement = document.querySelector(`[data-pane-id="${pane.id}"]`);
      if (paneElement) {
        const rect = paneElement.getBoundingClientRect();
        const threshold = 50; // pixels from edge

        // Center zone (entire pane)
        zones.push({
          paneId: pane.id,
          position: 'center',
          rect
        });

        // Edge zones for splitting
        // Top
        zones.push({
          paneId: pane.id,
          position: 'top',
          rect: new DOMRect(rect.left, rect.top, rect.width, threshold)
        });

        // Bottom
        zones.push({
          paneId: pane.id,
          position: 'bottom',
          rect: new DOMRect(rect.left, rect.bottom - threshold, rect.width, threshold)
        });

        // Left
        zones.push({
          paneId: pane.id,
          position: 'left',
          rect: new DOMRect(rect.left, rect.top, threshold, rect.height)
        });

        // Right
        zones.push({
          paneId: pane.id,
          position: 'right',
          rect: new DOMRect(rect.right - threshold, rect.top, threshold, rect.height)
        });
      }
    });

    return zones;
  }, [getAllPanes]);

  // Find the active drop zone based on mouse position
  const findActiveDropZone = useCallback((clientX: number, clientY: number, zones: DropZone[]): DropZone | null => {
    // Prioritize edge zones over center zones
    const edgeZones = zones.filter(z => z.position !== 'center');
    const centerZones = zones.filter(z => z.position === 'center');

    for (const zone of edgeZones) {
      if (clientX >= zone.rect.left && clientX <= zone.rect.right &&
        clientY >= zone.rect.top && clientY <= zone.rect.bottom) {
        return zone;
      }
    }

    for (const zone of centerZones) {
      if (clientX >= zone.rect.left && clientX <= zone.rect.right &&
        clientY >= zone.rect.top && clientY <= zone.rect.bottom) {
        return zone;
      }
    }

    return null;
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    // Check if this is a file drag from the explorer
    const isFileDrag = event.dataTransfer.types.includes('application/x-file-path') ||
      event.dataTransfer.types.includes('text/plain');

    if (!isDragging && !isFileDrag) return;

    const zones = calculateDropZones(event.clientX, event.clientY);
    updateDropZones(zones);

    const activeZone = findActiveDropZone(event.clientX, event.clientY, zones);
    setActiveDropZone(activeZone);
  }, [isDragging, calculateDropZones, updateDropZones, findActiveDropZone, setActiveDropZone]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Only clear if we're leaving the editor area entirely
    if (!dragRef.current?.contains(event.relatedTarget as Node)) {
      setActiveDropZone(null);
    }
  }, [setActiveDropZone]);

  const handleDropEvent = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    // Check if this is a file drag from the explorer
    const isFileDrag = event.dataTransfer.types.includes('application/x-file-path') ||
      event.dataTransfer.types.includes('text/plain');

    if (isFileDrag) {
      // Handle file drop from explorer
      const filePath = event.dataTransfer.getData('application/x-file-path') ||
        event.dataTransfer.getData('text/plain');

      if (filePath && activeDropZone) {
        // Start drag state manually for file drops
        startDrag('file', filePath);
        handleDrop(activeDropZone).finally(() => {
          endDrag();
        });
      }
    } else if (activeDropZone) {
      // Handle tab drop (existing drag state)
      handleDrop(activeDropZone);
    } else {
      endDrag();
    }
  }, [activeDropZone, handleDrop, endDrag, startDrag]);

  const renderSplit = (split: EditorSplit): React.ReactNode => {
    if (split.type === 'pane' && split.pane) {
      // This is a leaf node - render the actual editor pane
      return (
        <EditorPane
          key={split.id}
          paneId={split.pane.id}
          className="h-full"
        />
      );
    }

    if (split.type === 'split' && split.children && split.children.length > 0) {
      // This is a split container - render children with resizable panels
      return (
        <ResizablePanelGroup
          key={split.id}
          direction={split.direction || 'horizontal'}
          className="h-full"
        >
          {split.children.map((child, index) => (
            <React.Fragment key={child.id}>
              <ResizablePanel
                defaultSize={split.size || (100 / split.children!.length)}
                minSize={10}
              >
                {renderSplit(child)}
              </ResizablePanel>
              {index < split.children!.length - 1 && <ResizableHandle withHandle />}
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      );
    }

    // Empty split
    return <div key={split.id} className="h-full" />;
  }

  const renderDropZones = () => {
    if (!activeDropZone) return null;

    const zone = activeDropZone;
    const rect = zone.rect;

    return (
      <div className="absolute inset-0 pointer-events-none z-50">
        <div
          className={cn(
            "absolute border-2 border-dashed transition-all duration-150",
            zone.position === 'center' ?
              "border-blue-500 bg-blue-500/10" :
              "border-blue-400 bg-blue-400/20"
          )}
          style={{
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
        />

        {/* Drop indicator */}
        <div
          className="absolute flex items-center justify-center text-blue-600 font-medium text-sm"
          style={{
            left: `${rect.left + rect.width / 2 - 50}px`,
            top: `${rect.top + rect.height / 2 - 10}px`,
            width: '100px',
            height: '20px',
          }}
        >
          {zone.position === 'center' ? 'Open Here' : `Split ${zone.position}`}
        </div>
      </div>
    );
  }

  const hasBuffers = tabOrder.length > 0;
  const panes = getAllPanes();

  return (
    <EditorKeymapProvider>
      <div
        ref={dragRef}
        className="h-full bg-background relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropEvent}
      >
        {(
          renderSplit(rootSplit)
        )
          // : (
          //   <div className="h-full flex items-center justify-center">
          //     <div className="text-center">
          //       <p className="text-muted-foreground text-sm mb-2">No files open</p>
          //       <p className="text-xs text-muted-foreground">
          //         Click on a file in the explorer to open it
          //       </p>
          //     </div>
          //   </div>
          // )
        }

        {renderDropZones()}
      </div>
    </EditorKeymapProvider>
  );
}
