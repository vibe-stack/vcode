import React, { useState, useEffect } from 'react';
import { PortSelector } from './port-selector';
import { usePortDetector } from './port-detector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Bug, Target, Eye, EyeOff } from 'lucide-react';
import { useTerminalContentTracker } from './terminal-content-tracker';
import { NoServerState } from './no-server-state';
import { useIframeInspector } from './use-iframe-inspector';
import { ComponentInspectorPanel } from './component-inspector-panel';
import { InspectorDebugPanel } from './inspector-debug-panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export const AutoView: React.FC = () => {
  const { detectedPorts, selectedPort, selectPort, refreshPorts } = usePortDetector();
  const { terminalContents, getPortsFromAllTerminals } = useTerminalContentTracker();
  const [customUrl, setCustomUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [showDebug, setShowDebug] = useState(true); // Enable debug by default for now

  const currentUrl = customUrl || (selectedPort ? `http://localhost:${selectedPort}` : '');

  const {
    iframeRef,
    isInspecting,
    toggleInspection,
    detectedFramework,
    selectedNode,
    clearSelection
  } = useIframeInspector({
    onNodeSelect: (data) => {
      console.log('[GROK] AutoView - Selected node:', {
        tagName: data.domNode?.tagName,
        framework: data.framework?.type,
        hasComponent: !!data.component,
        componentName: data.component?.componentName
      });
      if (!showInspector) {
        setShowInspector(true);
      }
    },
    onFrameworkDetected: (framework) => {
      console.log('[GROK] AutoView - Detected framework:', framework.type, framework.version);
    }
  });

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = event.currentTarget;
    console.log('[GROK] AutoView - Iframe loaded:', currentUrl);
    // Don't log the iframe element directly - it has React fiber properties that cause circular refs
    
    try {
      console.log('[GROK] AutoView - Can access iframe document:', {
        hasContentDocument: !!iframe.contentDocument,
        hasContentWindow: !!iframe.contentWindow,
        // Don't access origin/URL as they might trigger CORS errors
        documentReady: iframe.contentDocument?.readyState
      });
    } catch (e) {
      const error = e as Error;
      console.log('[GROK] AutoView - Cannot access iframe due to CORS:', error.message);
    }
    
    setLoadError(null);
  };

  const handleIframeError = () => {
    console.log('[GROK] AutoView - Iframe error for:', currentUrl);
    setLoadError('Failed to load the application. Make sure the development server is running.');
  };

  const handleOpenSourceFile = (filePath: string, lineNumber?: number) => {
    // TODO: Integrate with VS Code file opening API
    console.log('[GROK] AutoView - Open source file:', filePath, lineNumber);
  };

  // Add effect to log when inspection state changes
  useEffect(() => {
    console.log('[GROK] AutoView - Inspection state changed:', {
      isInspecting,
      hasSelectedNode: !!selectedNode,
      framework: detectedFramework,
      showInspector,
      currentUrl
    });
  }, [isInspecting, selectedNode, detectedFramework, showInspector, currentUrl]);

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
        </div>
        <NoServerState terminalContentsLength={terminalContents.length} />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <PortSelector
          selectedPort={selectedPort}
          detectedPorts={detectedPorts}
          onPortSelect={selectPort}
          onRefresh={refreshPorts}
          customUrl={customUrl}
          onCustomUrlChange={setCustomUrl}
        />
        
        <div className="flex items-center gap-2">
          {detectedFramework && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{detectedFramework.type}</span>
              {detectedFramework.version && <span>v{detectedFramework.version}</span>}
            </div>
          )}
          
          <Button
            variant={isInspecting ? "default" : "outline"}
            size="sm"
            onClick={() => {
              console.log('[GROK] AutoView - Toggle inspection clicked, current state:', isInspecting);
              console.log('[GROK] AutoView - Current iframe URL:', currentUrl);
              toggleInspection();
            }}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            {isInspecting ? 'Stop Inspecting' : 'Inspect Element'}
          </Button>
          
          <Button
            variant={showDebug ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Debug
          </Button>
          
          {selectedNode && (
            <Button
              variant={showInspector ? "default" : "outline"}
              size="sm"
              onClick={() => setShowInspector(!showInspector)}
              className="flex items-center gap-2"
            >
              {showInspector ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showInspector ? 'Hide Inspector' : 'Show Inspector'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {showDebug && (
          <div className="border-b">
            <InspectorDebugPanel />
          </div>
        )}
        
        {showInspector && selectedNode ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="h-full relative">
                {isInspecting && (
                  <div className="absolute top-2 left-2 z-20 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                    🎯 Inspection Mode Active - Click any element
                  </div>
                )}
                {loadError && (
                  <div className="absolute top-0 left-0 right-0 z-10 p-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{loadError}</AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <iframe
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full h-full border-0"
                  title="Application Preview"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-top-navigation allow-modals"
                  // Electron-specific attributes to bypass CORS
                  allow="cross-origin-isolated"
                  style={{ isolation: 'isolate' }}
                />
              </div>
            </ResizablePanel>
            
            <ResizableHandle />
            
            <ResizablePanel defaultSize={40} minSize={30}>
              <ComponentInspectorPanel
                inspectionData={selectedNode}
                framework={detectedFramework}
                onOpenSourceFile={handleOpenSourceFile}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full relative">
            {isInspecting && (
              <div className="absolute top-2 left-2 z-20 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                🎯 Inspection Mode Active - Click any element
              </div>
            )}
            {loadError && (
              <div className="absolute top-0 left-0 right-0 z-10 p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loadError}</AlertDescription>
                </Alert>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0"
              title="Application Preview"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-top-navigation allow-modals"
              // Electron-specific attributes to bypass CORS
              allow="cross-origin-isolated"
              style={{ isolation: 'isolate' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
