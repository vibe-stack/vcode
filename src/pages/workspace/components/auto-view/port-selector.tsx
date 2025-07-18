import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { useAutoViewStore } from '@/stores/auto-view';

export const PortSelector: React.FC = () => {
  const {
    selectedPort,
    detectedPorts,
    customUrl,
    currentUrl,
    setSelectedPort,
    setCustomUrl,
    refreshPorts
  } = useAutoViewStore();

  const handlePortChange = (value: string) => {
    const port = parseInt(value);
    if (!isNaN(port)) {
      setSelectedPort(port);
      setCustomUrl(`http://localhost:${port}`);
    }
  };

  const handleUrlChange = (value: string) => {
    setCustomUrl(value);
    // Auto-detect port from URL if it's a localhost URL
    const match = value.match(/localhost:(\d+)/);
    if (match) {
      const port = parseInt(match[1]);
      setSelectedPort(port);
    }
  };

  const openInBrowser = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 relative">
        {/* Auto-detect select inside the input */}
        {detectedPorts.length > 0 && (
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
            <Select value={selectedPort?.toString() || ''} onValueChange={handlePortChange}>
              <SelectTrigger className="h-6 w-20 border-0 bg-transparent text-xs p-0">
                <SelectValue placeholder="Auto" />
              </SelectTrigger>
              <SelectContent>
                {detectedPorts.map((port) => (
                  <SelectItem key={port.port} value={port.port.toString()}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{port.port}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Input
          value={customUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="http://localhost:3000 or custom URL"
          className={`w-full ${detectedPorts.length > 0 ? 'pl-24' : 'pl-3'}`}
        />
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={refreshPorts}
        className="h-8 w-8 p-0"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={openInBrowser}
        className="h-8 w-8 p-0"
        disabled={!currentUrl}
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
};
