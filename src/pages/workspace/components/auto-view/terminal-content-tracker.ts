import { useEffect, useState } from 'react';

interface TerminalContent {
  terminalId: string;
  recentOutput: string;
}

// Store recent terminal output to parse for port information
const TERMINAL_CONTENT_MAP = new Map<string, string>();
const MAX_CONTENT_LENGTH = 10000; // Keep last 10KB of content per terminal

export const useTerminalContentTracker = () => {
  const [terminalContents, setTerminalContents] = useState<TerminalContent[]>([]);

  useEffect(() => {
    // Check if terminalApi is available
    if (!(window as any).terminalApi?.onData) {
      console.warn('Terminal API not available for port detection');
      return;
    }

    // Listen to terminal data events
    const unsubscribe = (window as any).terminalApi.onData((data: { terminalId: string; data: string }) => {
      const { terminalId, data: newData } = data;
      
      // Get existing content or initialize
      const existingContent = TERMINAL_CONTENT_MAP.get(terminalId) || '';
      
      // Append new data and trim if too long
      const updatedContent = (existingContent + newData).slice(-MAX_CONTENT_LENGTH);
      
      // Store updated content
      TERMINAL_CONTENT_MAP.set(terminalId, updatedContent);
      
      // Update state
      setTerminalContents(prev => {
        const existing = prev.find(tc => tc.terminalId === terminalId);
        if (existing) {
          return prev.map(tc => 
            tc.terminalId === terminalId 
              ? { ...tc, recentOutput: updatedContent }
              : tc
          );
        } else {
          return [...prev, { terminalId, recentOutput: updatedContent }];
        }
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const getPortsFromAllTerminals = (): number[] => {
    const allPorts: number[] = [];
    
    // Parse all terminal contents for ports
    Array.from(TERMINAL_CONTENT_MAP.values()).forEach(content => {
      const ports = parseTerminalOutputForPorts(content);
      allPorts.push(...ports);
    });
    
    return [...new Set(allPorts)]; // Remove duplicates
  };

  return {
    terminalContents,
    getPortsFromAllTerminals
  };
};

// Parse terminal output for port information
export const parseTerminalOutputForPorts = (terminalOutput: string): number[] => {
  const ports: number[] = [];
  
  // Common patterns for port detection in terminal output
  const patterns = [
    // Direct localhost URLs
    /(?:https?:\/\/)?(?:localhost|127\.0\.0\.1):(\d+)/gi,
    // Server running messages
    /(?:Server|server|development server|dev server).*?(?:running|listening|started).*?(?:on port|port|:)\s*(\d+)/gi,
    // Local development messages
    /(?:Local|Development|Dev).*?(?:http:\/\/.*?:|:)(\d+)/gi,
    // Vite specific
    /➜\s+Local:\s+http:\/\/.*?:(\d+)/gi,
    // Next.js specific
    /ready - started server on.*?(\d+)/gi,
    // Create React App
    /Local:\s+http:\/\/.*?:(\d+)/gi,
    // Angular CLI
    /Live Development Server is listening on.*?(\d+)/gi,
    // Generic port mentions
    /(?:port|Port)\s*(\d+)/gi,
    // URLs in terminal
    /(?:http:\/\/.*?:|https:\/\/.*?:)(\d+)/gi,
    // Server addresses
    /(?:address|Address).*?(\d+)/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = terminalOutput.matchAll(pattern);
    for (const match of matches) {
      const port = parseInt(match[1]);
      // Valid port range, exclude common system ports and this app's port (5173)
      if (port && port >= 3000 && port <= 9999 && port !== 5173) {
        ports.push(port);
      }
    }
  });
  
  return [...new Set(ports)]; // Remove duplicates
};
