import React from 'react';
import { useAutoViewStore } from '@/stores/auto-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AutoViewDebugger: React.FC = () => {
  const {
    detectedPorts,
    selectedPort,
    customUrl,
    currentUrl,
    isLoading,
    loadError,
    terminalContents,
    refreshPorts
  } = useAutoViewStore();

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>AutoView Store Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
          <div><strong>Selected Port:</strong> {selectedPort || 'None'}</div>
          <div><strong>Custom URL:</strong> {customUrl || 'None'}</div>
          <div><strong>Current URL:</strong> {currentUrl || 'None'}</div>
          <div><strong>Load Error:</strong> {loadError || 'None'}</div>
          <div><strong>Terminal Contents:</strong> {terminalContents.length} items</div>
          <div><strong>Detected Ports:</strong> {detectedPorts.length} items</div>
          {detectedPorts.length > 0 && (
            <div className="ml-4">
              {detectedPorts.map(port => (
                <div key={port.port}>
                  Port {port.port}: {port.description} ({port.isActive ? 'Active' : 'Inactive'})
                </div>
              ))}
            </div>
          )}
          <button 
            onClick={refreshPorts}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Refresh Ports
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
