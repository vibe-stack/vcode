import React, { useEffect, useRef } from 'react';
import { PortSelector } from './port-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Monitor, Target, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { NoServerState } from './no-server-state';
import { useIframeInspector } from './use-iframe-inspector';
import { ComponentInspectorPanel } from './component-inspector-panel';
import { DraggableDebugOverlay } from './draggable-debug-overlay';
import { AutoViewDebugger } from './auto-view-debugger';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAutoViewStore } from '@/stores/auto-view';
import { ChatOverlay } from './chat-overlay';

export const AutoView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    // State
    detectedPorts,
    selectedPort,
    customUrl,
    currentUrl,
    isLoading,
    loadError,
    showInspector,
    showDebug,
    isInspecting,
    detectedFramework,
    selectedNode,
    terminalContents,
    showChat, // Add showChat state
    
    // Actions
    setSelectedPort,
    setCustomUrl,
    setLoadError,
    setShowInspector,
    setShowDebug,
    toggleInspection,
    refreshPorts,
    setDetectedFramework,
    setSelectedNode,
    initialize,
    cleanup,
    setShowChat // Add setShowChat action
  } = useAutoViewStore();

  const {
    iframeRef,
    isInspecting: hookIsInspecting,
    toggleInspection: hookToggleInspection,
    detectedFramework: hookDetectedFramework,
    selectedNode: hookSelectedNode,
    clearSelection
  } = useIframeInspector({
    onNodeSelect: (data) => {
      console.log('[GROK] AutoView - Selected node:', {
        tagName: data.domNode?.tagName,
        framework: data.framework?.type,
        hasComponent: !!data.component,
        componentName: data.component?.componentName
      });
      setSelectedNode(data);
    },
    onFrameworkDetected: (framework) => {
      console.log('[GROK] AutoView - Detected framework:', framework.type, framework.version);
      setDetectedFramework(framework);
    }
  });

  // Initialize store on mount
  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  // Sync selected node from hook to store
  useEffect(() => {
    if (hookSelectedNode !== selectedNode) {
      setSelectedNode(hookSelectedNode);
    }
  }, [hookSelectedNode, selectedNode, setSelectedNode]);

  // Sync detected framework from hook to store
  useEffect(() => {
    if (hookDetectedFramework !== detectedFramework) {
      setDetectedFramework(hookDetectedFramework);
    }
  }, [hookDetectedFramework, detectedFramework, setDetectedFramework]);

  // Handle iframe events
  const handleIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = event.currentTarget;
    console.log('[GROK] AutoView - Iframe loaded:', currentUrl);
    
    try {
      console.log('[GROK] AutoView - Can access iframe document:', {
        hasContentDocument: !!iframe.contentDocument,
        hasContentWindow: !!iframe.contentWindow,
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

  // Log when inspection state changes
  useEffect(() => {
    console.log('[GROK] AutoView - Inspection state changed:', {
      isInspecting: hookIsInspecting,
      hasSelectedNode: !!selectedNode,
      framework: detectedFramework,
      showInspector,
      currentUrl
    });
  }, [hookIsInspecting, selectedNode, detectedFramework, showInspector, currentUrl]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="p-3 border-b">
          <PortSelector />
        </div>
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
        <div className="flex items-center justify-between p-3 border-b">
          <PortSelector />
        </div>
        <NoServerState terminalContentsLength={terminalContents.length} />
      </div>
    );
  }    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <PortSelector />
          
          <div className="flex items-center gap-2">
            <Button
              variant={hookIsInspecting ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                console.log('[GROK] AutoView - Toggle inspection clicked, current state:', hookIsInspecting);
                console.log('[GROK] AutoView - Current iframe URL:', currentUrl);
                hookToggleInspection();
              }}
              className="h-8 w-8 p-0"
              title="Inspect Element"
            >
              <Target className="h-4 w-4" />
            </Button>
            
            <Button
              variant={showDebug ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="h-8 w-8 p-0"
              title="Console"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            
            {selectedNode && (
              <Button
                variant={showInspector ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowInspector(!showInspector)}
                className="h-8 w-8 p-0"
                title={showInspector ? 'Hide Inspector' : 'Show Inspector'}
              >
                {showInspector ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            
            {/* Add button to toggle chat overlay */}
            <Button
              variant={showChat ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="h-8 w-8 p-0"
              title={showChat ? 'Hide Chat' : 'Show Chat'}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        {showInspector && selectedNode ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="h-full relative">
                {hookIsInspecting && (
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
            {hookIsInspecting && (
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
        
        {/* Draggable Debug Overlay */}
        <DraggableDebugOverlay
          isVisible={showDebug}
          onClose={() => setShowDebug(false)}
          containerRef={containerRef}
        />
        
        {/* Chat Overlay */}
        <ChatOverlay
          isVisible={showChat}
          onClose={() => setShowChat(false)}
        />
      </div>
    </div>
  );
};
