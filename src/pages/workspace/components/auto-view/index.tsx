import React, { useState, useEffect } from 'react';
import { PortSelector } from './port-selector';
import { usePortDetector } from './port-detector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Bug } from 'lucide-react';
import { useTerminalContentTracker } from './terminal-content-tracker';

export const AutoView: React.FC = () => {
  const { detectedPorts, selectedPort, selectPort, refreshPorts } = usePortDetector();
  const { terminalContents, getPortsFromAllTerminals } = useTerminalContentTracker();
  const [customUrl, setCustomUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const currentUrl = customUrl || (selectedPort ? `http://localhost:${selectedPort}` : '');

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setLoadError(null);
  };

  const handleIframeError = () => {
    setLoadError('Failed to load the application. Make sure the development server is running.');
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col">
        <PortSelector
          selectedPort={selectedPort}
          detectedPorts={detectedPorts}
          onPortSelect={selectPort}
          onRefresh={refreshPorts}
          customUrl={customUrl}
          onCustomUrlChange={setCustomUrl}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Scanning for development servers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUrl) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex items-center justify-between">
          <PortSelector
            selectedPort={selectedPort}
            detectedPorts={detectedPorts}
            onPortSelect={selectPort}
            onRefresh={refreshPorts}
            customUrl={customUrl}
            onCustomUrlChange={setCustomUrl}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="mr-2"
          >
            <Bug className="h-4 w-4" />
          </Button>
        </div>
        
        {showDebug && (
          <div className="p-4 bg-muted/50 border-b">
            <div className="text-xs space-y-2">
              <div>
                <strong>Terminal Sessions:</strong> {terminalContents.length}
              </div>
              <div>
                <strong>Ports from Terminals:</strong> {getPortsFromAllTerminals().join(', ') || 'None'}
              </div>
              <div>
                <strong>Recent Terminal Output:</strong>
                {terminalContents.map((tc, idx) => (
                  <div key={idx} className="ml-2 font-mono text-xs bg-background p-2 rounded max-h-20 overflow-y-auto">
                    {tc.recentOutput.slice(-200) || 'No output yet'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No development servers detected. Start your application's development server and it will appear automatically, or enter a custom URL above.
              {terminalContents.length === 0 && (
                <div className="mt-2 text-sm">
                  💡 Try opening a terminal and running a dev server (e.g., npm start, npm run dev).
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between">
        <PortSelector
          selectedPort={selectedPort}
          detectedPorts={detectedPorts}
          onPortSelect={selectPort}
          onRefresh={refreshPorts}
          customUrl={customUrl}
          onCustomUrlChange={setCustomUrl}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="mr-2"
        >
          <Bug className="h-4 w-4" />
        </Button>
      </div>
      
      {showDebug && (
        <div className="p-4 bg-muted/50 border-b">
          <div className="text-xs space-y-2">
            <div>
              <strong>Terminal Sessions:</strong> {terminalContents.length}
            </div>
            <div>
              <strong>Ports from Terminals:</strong> {getPortsFromAllTerminals().join(', ') || 'None'}
            </div>
            <div>
              <strong>Detected Ports:</strong> {detectedPorts.map(p => `${p.port}${p.description?.includes('(detected)') ? '*' : ''}`).join(', ')}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 relative">
        {loadError && (
          <div className="absolute top-0 left-0 right-0 z-10 p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          </div>
        )}
        
        <iframe
          src={currentUrl}
          className="w-full h-full border-0"
          title="Application Preview"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-top-navigation"
        />
      </div>
    </div>
  );
};
