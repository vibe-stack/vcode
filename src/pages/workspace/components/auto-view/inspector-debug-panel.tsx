import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, Code } from 'lucide-react';

interface DebugMessage {
  timestamp: string;
  source: string;
  message: string;
  data?: any;
}

export const InspectorDebugPanel: React.FC = () => {
  const [messages, setMessages] = useState<DebugMessage[]>([]);

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

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Inspector Debug</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={injectManualScript}>
              <Code className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearMessages}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-40">
          <div className="space-y-1">
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
      </CardContent>
    </Card>
  );
};
