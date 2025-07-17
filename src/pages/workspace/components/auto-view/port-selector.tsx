import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ExternalLink, Globe } from 'lucide-react';
import { usePortDetector, DetectedPort } from './port-detector';

interface PortSelectorProps {
  selectedPort: number | null;
  detectedPorts: DetectedPort[];
  onPortSelect: (port: number) => void;
  onRefresh: () => void;
  customUrl: string;
  onCustomUrlChange: (url: string) => void;
}

export const PortSelector: React.FC<PortSelectorProps> = ({
  selectedPort,
  detectedPorts,
  onPortSelect,
  onRefresh,
  customUrl,
  onCustomUrlChange
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handlePortChange = (value: string) => {
    const port = parseInt(value);
    if (!isNaN(port)) {
      onPortSelect(port);
      setIsCustomMode(false);
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Extract port from custom URL if it's a localhost URL
    const match = customUrl.match(/localhost:(\d+)/);
    if (match) {
      const port = parseInt(match[1]);
      onPortSelect(port);
    }
  };

  const openInBrowser = () => {
    const url = isCustomMode ? customUrl : `http://localhost:${selectedPort}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Globe className="h-4 w-4 text-muted-foreground" />
      
      {!isCustomMode ? (
        <>
          <Select value={selectedPort?.toString() || ''} onValueChange={handlePortChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a port" />
            </SelectTrigger>
            <SelectContent>
              {detectedPorts.map((port) => (
                <SelectItem key={port.port} value={port.port.toString()}>
                  <div className="flex items-center gap-2">
                    <span>localhost:{port.port}</span>
                    <Badge variant="secondary" className="text-xs">
                      {port.description}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCustomMode(true)}
            className="text-xs"
          >
            Custom URL
          </Button>
        </>
      ) : (
        <form onSubmit={handleCustomUrlSubmit} className="flex items-center gap-2 flex-1">
          <Input
            value={customUrl}
            onChange={(e) => onCustomUrlChange(e.target.value)}
            placeholder="http://localhost:3000 or custom URL"
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="default">
            Load
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCustomMode(false)}
          >
            Cancel
          </Button>
        </form>
      )}
      
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={openInBrowser}
          className="h-8 w-8 p-0"
          disabled={!selectedPort && !isCustomMode}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      
      {detectedPorts.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {detectedPorts.length} port{detectedPorts.length !== 1 ? 's' : ''} detected
          </Badge>
          {detectedPorts.some(p => p.description?.includes('(detected)')) && (
            <Badge variant="secondary" className="text-xs">
              From terminals
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
