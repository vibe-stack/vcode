import React, { useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { useBufferStore } from '@/stores/buffers';
import { useEditorSplitStore, EditorSplit, DropZone } from '@/stores/editor-splits';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/utils/tailwind';
import { EditorPane } from './editor-pane';
import { EditorKeymapProvider } from '@/services/keymaps/KeymapProvider';
import * as motion from "motion/react-client"

export function EditorArea() {
  // Use minimal selectors to avoid unnecessary re-renders
  const tabOrder = useBufferStore(state => state.tabOrder);

  // Use separate selectors for split store data
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

  const dragRef = useRef<HTMLDivElement>(null);
  const lastDragTimeRef = useRef<number>(0);
  const cachedDropZonesRef = useRef<DropZone[]>([]);
  const dragThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize layout on first render
  useEffect(() => {
    const panes = getAllPanes();
    if (panes.length === 0) {
      initializeLayout();
    }
  }, [getAllPanes, initializeLayout]);

  // Memoize pane elements to avoid repeated DOM queries
  const paneElements = useMemo(() => {
    const elements = new Map<string, Element>();
    const panes = getAllPanes();
    
    panes.forEach(pane => {
      const element = document.querySelector(`[data-pane-id="${pane.id}"]`);
      if (element) {
        elements.set(pane.id, element);
      }
    });
    
    // If no panes exist, add the editor root element
    if (panes.length === 0 && dragRef.current) {
      elements.set('editor-root', dragRef.current);
    }
    
    return elements;
  }, [getAllPanes, rootSplit]); // Re-memoize when layout changes

  // Calculate drop zones based on current panes - optimized version
  const calculateDropZones = useCallback((): DropZone[] => {
    const zones: DropZone[] = [];
    const panes = getAllPanes();

    // If no panes exist (editor just opened), create a drop zone for the entire editor area
    if (panes.length === 0) {
      const editorContainer = dragRef.current;
      if (editorContainer) {
        const rect = editorContainer.getBoundingClientRect();
        // Create a temporary pane ID for the drop zone
        zones.push({
          paneId: 'editor-root',
          position: 'center',
          rect
        });
      }
      return zones;
    }

    panes.forEach(pane => {
      const paneElement = paneElements.get(pane.id);
      if (paneElement) {
        const rect = paneElement.getBoundingClientRect();
        const threshold = 200; // pixels from edge

        // Always allow center drop zone for every pane, even if it's the only one
        zones.push({
          paneId: pane.id,
          position: 'center',
          rect
        });

        // Edge zones for splitting (only if pane is large enough)
        if (rect.width > threshold * 2 && rect.height > threshold * 2) {
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
      }
    });

    return zones;
  }, [getAllPanes, paneElements]);

  // Find the active drop zone based on mouse position - optimized
  const findActiveDropZone = useCallback((clientX: number, clientY: number, zones: DropZone[]): DropZone | null => {
    // Prioritize edge zones over center zones for more predictable behavior
    const edgeZones = zones.filter(z => z.position !== 'center');
    const centerZones = zones.filter(z => z.position === 'center');

    // Use a more efficient hit test
    const testZone = (zone: DropZone): boolean => {
      const rect = zone.rect;
      return clientX >= rect.left && clientX <= rect.right &&
             clientY >= rect.top && clientY <= rect.bottom;
    };

    // Check edge zones first
    for (const zone of edgeZones) {
      if (testZone(zone)) {
        return zone;
      }
    }

    // Then check center zones
    for (const zone of centerZones) {
      if (testZone(zone)) {
        return zone;
      }
    }

    return null;
  }, []);

  // Throttled drag over handler to improve performance
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    // Check if this is a file drag from the explorer
    const isFileDrag = event.dataTransfer.types.includes('application/x-file-path') ||
      event.dataTransfer.types.includes('text/plain');

    if (!isDragging && !isFileDrag) return;

    const now = Date.now();
    const timeSinceLastDrag = now - lastDragTimeRef.current;
    
    // Throttle drag events to improve performance (16ms = ~60fps)
    if (timeSinceLastDrag < 16) {
      return;
    }

    lastDragTimeRef.current = now;

    // Clear any existing timeout
    if (dragThrottleTimeoutRef.current) {
      clearTimeout(dragThrottleTimeoutRef.current);
    }

    // Debounce zone calculation slightly to avoid excessive recalculation
    dragThrottleTimeoutRef.current = setTimeout(() => {
      // Only recalculate zones if they're not cached or if layout might have changed
      let zones = cachedDropZonesRef.current;
      if (zones.length === 0) {
        zones = calculateDropZones();
        cachedDropZonesRef.current = zones;
        updateDropZones(zones);
      }

      const activeZone = findActiveDropZone(event.clientX, event.clientY, zones);
      setActiveDropZone(activeZone);
    }, 8);
  }, [isDragging, calculateDropZones, updateDropZones, findActiveDropZone, setActiveDropZone]);

  // Clear cache when layout changes
  useEffect(() => {
    cachedDropZonesRef.current = [];
  }, [rootSplit]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Only clear if we're leaving the editor area entirely
    if (!dragRef.current?.contains(event.relatedTarget as Node)) {
      setActiveDropZone(null);
      // Clear cached zones when leaving drag area
      cachedDropZonesRef.current = [];
    }
  }, [setActiveDropZone]);

  const handleDropEvent = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    // Clear any pending throttled updates
    if (dragThrottleTimeoutRef.current) {
      clearTimeout(dragThrottleTimeoutRef.current);
      dragThrottleTimeoutRef.current = null;
    }

    // Clear cached zones after drop
    cachedDropZonesRef.current = [];

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

  // Cleanup effect for timeouts
  useEffect(() => {
    return () => {
      if (dragThrottleTimeoutRef.current) {
        clearTimeout(dragThrottleTimeoutRef.current);
      }
    };
  }, []);

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

  // Memoized drop zone component for better performance
  const DropZoneIndicator = memo(({ zone, editorRect }: { zone: DropZone; editorRect: DOMRect }) => {
    const rect = zone.rect;
    
    // Calculate position relative to the editor container
    const relativeRect = {
      left: rect.left - editorRect.left,
      top: rect.top - editorRect.top,
      width: rect.width,
      height: rect.height
    };

    return (
      <div className="absolute inset-0 pointer-events-none z-50">
        <motion.div
          className={cn(
            "absolute transition-all duration-150 border-2 rounded-md",
            zone.position === 'center' ?
              "border-emerald-500 bg-emerald-500/10" :
              "border-emerald-400 bg-emerald-400/20"
          )}
          style={{
            left: `${relativeRect.left}px`,
            top: `${relativeRect.top}px`,
            width: `${relativeRect.width}px`,
            height: `${relativeRect.height}px`,
          }}
        />
      </div>
    );
  });

  DropZoneIndicator.displayName = 'DropZoneIndicator';

  const renderDropZones = () => {
    if (!activeDropZone) return null;

    // Get the editor area container to calculate relative positioning
    const editorContainer = dragRef.current?.getBoundingClientRect();
    if (!editorContainer) return null;

    const zone = activeDropZone;
    const rect = zone.rect;
    const relativeRect = {
      left: rect.left - editorContainer.left,
      top: rect.top - editorContainer.top,
      width: rect.width,
      height: rect.height
    };

    return (
      <div className="absolute inset-0 pointer-events-none z-50">
        <motion.div
          className={cn(
            "absolute transition-all duration-150 border-2 rounded-md",
            zone.position === 'center' ?
              "border-emerald-500 bg-emerald-500/10" :
              "border-emerald-400 bg-emerald-400/20"
          )}
          initial={{
            left: `${relativeRect.left}px`,
            top: `${relativeRect.top}px`,
            width: `${relativeRect.width}px`,
            height: `${relativeRect.height}px`,
          }}
          animate={{
            left: `${relativeRect.left}px`,
            top: `${relativeRect.top}px`,
            width: `${relativeRect.width}px`,
            height: `${relativeRect.height}px`,
          }}
        />
      </div>
    );
  }

  const hasBuffers = tabOrder.length > 0;

  return (
    <EditorKeymapProvider>
      <div
        ref={dragRef}
        className="h-full bg-background relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropEvent}
      >
        {renderSplit(rootSplit)}
        {renderDropZones()}
      </div>
    </EditorKeymapProvider>
  );
}
