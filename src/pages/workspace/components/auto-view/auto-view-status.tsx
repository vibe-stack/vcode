import React from 'react';
import { useAutoViewStore } from '@/stores/auto-view';
import { Badge } from '@/components/ui/badge';

/**
 * Example component that demonstrates how easy it is to access
 * auto-view state from anywhere without prop drilling
 */
export const AutoViewStatus: React.FC = () => {
  const { 
    selectedPort, 
    detectedPorts, 
    isLoading, 
    currentUrl,
    terminalContents,
    showInspector,
    selectedNode 
  } = useAutoViewStore();

  if (isLoading) {
    return <Badge variant="secondary">Scanning...</Badge>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={selectedPort ? "default" : "destructive"}>
        {selectedPort ? `Port ${selectedPort}` : 'No server'}
      </Badge>
      
      {detectedPorts.length > 0 && (
        <Badge variant="secondary">
          {detectedPorts.length} server{detectedPorts.length > 1 ? 's' : ''} found
        </Badge>
      )}
      
      {terminalContents.length > 0 && (
        <Badge variant="outline">
          {terminalContents.length} terminal{terminalContents.length > 1 ? 's' : ''} tracked
        </Badge>
      )}
      
      {showInspector && selectedNode && (
        <Badge variant="default">
          Inspector active
        </Badge>
      )}
      
      {currentUrl && (
        <span className="text-muted-foreground truncate max-w-xs">
          {currentUrl}
        </span>
      )}
    </div>
  );
};
