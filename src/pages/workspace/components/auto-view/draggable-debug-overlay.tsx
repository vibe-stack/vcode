import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, Code, X, GripHorizontal, Move3D } from 'lucide-react';

interface DebugMessage {
  timestamp: string;
  source: string;
  message: string;
  data?: any;
}

interface DraggableDebugOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const DraggableDebugOverlay: React.FC<DraggableDebugOverlayProps> = ({ 
  isVisible, 
  onClose,
  containerRef
}) => {
  const [messages, setMessages] = useState<DebugMessage[]>([]);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 384, height: 320 }); // 320 includes header
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [resizeStart, setResizeStart] = useState({ mouseX: 0, mouseY: 0, width: 0, height: 0, x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Refs to track mouse event handlers for proper cleanup
  const mouseHandlersRef = useRef<{
    handleMouseMove?: (e: MouseEvent) => void;
    handleMouseUp?: (e: MouseEvent) => void;
    handleMouseLeave?: (e: MouseEvent) => void;
    handleVisibilityChange?: () => void;
  }>({});

  useEffect(() => {
    // Capture console.log messages that start with [GROK]
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    const logHandler = (level: string, ...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('[GROK]')) {
        setMessages(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          source: `Console.${level}`,
          message: message.replace('[GROK]', '').trim(),
          data: args.length > 1 ? args.slice(1) : undefined
        }]);
      }
    };

    console.log = (...args) => {
      logHandler('log', ...args);
      originalConsoleLog(...args);
    };
    
    console.warn = (...args) => {
      logHandler('warn', ...args);
      originalConsoleWarn(...args);
    };
    
    console.error = (...args) => {
      logHandler('error', ...args);
      originalConsoleError(...args);
    };

    // Listen for postMessage events
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type && event.data.type.startsWith('GROK_')) {
        setMessages(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          source: 'PostMessage',
          message: `${event.data.type}`,
          data: event.data
        }]);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Robust mouse event handling with proper cleanup and escape detection
  useEffect(() => {
    const getContainerBounds = () => {
      if (containerRef?.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        return { 
          left: 0, 
          top: 0, 
          right: containerRect.width, 
          bottom: containerRect.height 
        };
      }
      return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    };

    const constrainPosition = (x: number, y: number, width: number, height: number) => {
      const bounds = getContainerBounds();
      return {
        x: Math.max(bounds.left, Math.min(x, bounds.right - width)),
        y: Math.max(bounds.top, Math.min(y, bounds.bottom - height))
      };
    };

    const getRelativeMousePosition = (e: MouseEvent) => {
      if (containerRef?.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        return {
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top
        };
      }
      return { x: e.clientX, y: e.clientY };
    };

    // Clean up any active drag/resize state
    const cleanup = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    // Handle mouse move with validation
    const handleMouseMove = (e: MouseEvent) => {
      // Prevent default to avoid text selection during drag
      e.preventDefault();
      
      if (isDragging) {
        const mousePos = getRelativeMousePosition(e);
        const newX = mousePos.x - dragOffset.x;
        const newY = mousePos.y - dragOffset.y;
        const constrained = constrainPosition(newX, newY, size.width, size.height);
        setPosition(constrained);
      } else if (isResizing) {
        const mousePos = getRelativeMousePosition(e);
        const bounds = getContainerBounds();
        
        // Calculate deltas from initial resize position
        const deltaX = mousePos.x - resizeStart.mouseX;
        const deltaY = mousePos.y - resizeStart.mouseY;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.x;
        let newY = resizeStart.y;

        if (resizeDirection.includes('right')) {
          newWidth = Math.max(250, Math.min(resizeStart.width + deltaX, bounds.right - resizeStart.x));
        }
        if (resizeDirection.includes('left')) {
          newWidth = Math.max(250, resizeStart.width - deltaX);
          newX = Math.max(bounds.left, Math.min(resizeStart.x + deltaX, resizeStart.x + resizeStart.width - 250));
        }
        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(200, Math.min(resizeStart.height + deltaY, bounds.bottom - resizeStart.y));
        }
        if (resizeDirection.includes('top')) {
          newHeight = Math.max(200, resizeStart.height - deltaY);
          newY = Math.max(bounds.top, Math.min(resizeStart.y + deltaY, resizeStart.y + resizeStart.height - 200));
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    // Handle mouse up with cleanup
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      cleanup();
    };

    // Handle mouse leave - stop drag/resize when mouse leaves window
    const handleMouseLeave = (e: MouseEvent) => {
      // Only cleanup if mouse actually leaves the viewport
      if (e.clientX < 0 || e.clientX > window.innerWidth || 
          e.clientY < 0 || e.clientY > window.innerHeight) {
        cleanup();
      }
    };

    // Handle visibility change (tab switch, window minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
      }
    };

    // Handle focus loss
    const handleBlur = () => {
      cleanup();
    };

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isDragging || isResizing)) {
        e.preventDefault();
        cleanup();
      }
    };

    // Store handlers in ref for cleanup
    mouseHandlersRef.current = {
      handleMouseMove,
      handleMouseUp,
      handleMouseLeave,
      handleVisibilityChange
    };

    // Add event listeners when dragging or resizing
    if (isDragging || isResizing) {
      // Mouse events on document for global capture
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.addEventListener('mouseleave', handleMouseLeave);
      
      // Visibility and focus events
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      
      // Keyboard events
      document.addEventListener('keydown', handleKeyDown);
      
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Re-enable pointer events on the overlay itself
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = 'auto';
      }
    }

    // Cleanup function
    return () => {
      // Remove all event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore document state
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = '';
      }
    };
  }, [isDragging, isResizing, dragOffset, size, position, resizeDirection, resizeStart, containerRef]);

  // Cleanup on unmount or visibility change
  useEffect(() => {
    return () => {
      // Ensure cleanup on unmount
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
      
      // Restore document state
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent any existing drag/resize operations
    if (isDragging || isResizing) return;
    
    if (!containerRef?.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate mouse position relative to container
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Calculate offset from mouse to overlay's current position
    setDragOffset({
      x: mouseX - position.x,
      y: mouseY - position.y
    });
    setIsDragging(true);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    // Prevent any existing drag/resize operations
    if (isDragging || isResizing) return;
    
    if (!containerRef?.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate mouse position relative to container
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Store initial resize state
    setResizeStart({
      mouseX,
      mouseY,
      width: size.width,
      height: size.height,
      x: position.x,
      y: position.y
    });
    
    setResizeDirection(direction);
    setIsResizing(true);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const injectManualScript = () => {
    console.log('[GROK] InspectorDebugPanel - Manual script injection requested');
    setMessages(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      source: 'Manual',
      message: 'Manual script injection triggered'
    }]);
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={overlayRef}
      className="absolute z-50 bg-background/60 backdrop-blur-sm border rounded-lg shadow-lg"
      style={{ 
        left: position.x, 
        top: position.y,
        width: size.width,
        height: size.height,
        userSelect: isDragging || isResizing ? 'none' : 'auto'
      }}
    >
      {/* Resize handles */}
      <div 
        className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}
      />
      <div 
        className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}
      />
      <div 
        className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}
      />
      <div 
        className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize hover:bg-muted/30 rounded-tl"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
      />
      <div 
        className="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
      />
      <div 
        className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
      />
      <div 
        className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
      />
      <div 
        className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
        onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
      />
      
      <div 
        className="flex items-center justify-between p-3 border-b cursor-move hover:bg-muted/50 transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Inspector Debug</span>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={injectManualScript} 
            className="h-6 w-6 p-0"
            title="Inject debug script"
          >
            <Code className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearMessages} 
            className="h-6 w-6 p-0"
            title="Clear all messages"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="h-6 w-6 p-0"
            title="Close inspector debug panel"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="p-3 overflow-hidden" style={{ height: size.height - 60 }}>
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div key={index} className="text-xs border-l-2 border-muted pl-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {msg.timestamp}
                  </Badge>
                  <Badge variant={msg.source === 'Console' ? 'secondary' : 'default'} className="text-xs px-1 py-0">
                    {msg.source}
                  </Badge>
                </div>
                <div className="mt-1 text-muted-foreground">{msg.message}</div>
                {msg.data && (
                  <div className="mt-1 text-xs bg-muted p-1 rounded">
                    {JSON.stringify(msg.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                No debug messages yet. Try inspecting an element.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
