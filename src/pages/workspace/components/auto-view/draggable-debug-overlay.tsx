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
  const overlayRef = useRef<HTMLDivElement>(null);

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

  // Handle mouse events for dragging and resizing
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

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const mousePos = getRelativeMousePosition(e);
        const newX = mousePos.x - dragOffset.x;
        const newY = mousePos.y - dragOffset.y;
        const constrained = constrainPosition(newX, newY, size.width, size.height);
        setPosition(constrained);
      } else if (isResizing) {
        const mousePos = getRelativeMousePosition(e);
        const bounds = getContainerBounds();
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection.includes('right')) {
          newWidth = Math.max(250, Math.min(mousePos.x - position.x, bounds.right - position.x));
        }
        if (resizeDirection.includes('left')) {
          const deltaX = mousePos.x - position.x;
          newWidth = Math.max(250, size.width - deltaX);
          newX = Math.max(bounds.left, Math.min(position.x + deltaX, position.x + size.width - 250));
        }
        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(200, Math.min(mousePos.y - position.y, bounds.bottom - position.y));
        }
        if (resizeDirection.includes('top')) {
          const deltaY = mousePos.y - position.y;
          newHeight = Math.max(200, size.height - deltaY);
          newY = Math.max(bounds.top, Math.min(position.y + deltaY, position.y + size.height - 200));
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, size, position, resizeDirection, containerRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef?.current) return;
    
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
    e.stopPropagation();
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
          <Button variant="ghost" size="sm" onClick={injectManualScript} className="h-6 w-6 p-0">
            <Code className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearMessages} className="h-6 w-6 p-0">
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
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
