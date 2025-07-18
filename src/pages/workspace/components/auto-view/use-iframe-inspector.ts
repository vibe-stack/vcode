import { useEffect, useRef, useState, useCallback } from 'react';
import { IframeInspector, IframeInspectionData, FrameworkInfo } from './iframe-inspector';
import { ElectronIframeInspector } from './electron-iframe-inspector';

export interface UseIframeInspectorOptions {
  onNodeSelect?: (data: IframeInspectionData) => void;
  onFrameworkDetected?: (framework: FrameworkInfo) => void;
}

export const useIframeInspector = (options: UseIframeInspectorOptions = {}) => {
  const inspectorRef = useRef<IframeInspector | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [detectedFramework, setDetectedFramework] = useState<FrameworkInfo | null>(null);
  const [selectedNode, setSelectedNode] = useState<IframeInspectionData | null>(null);

  // Initialize inspector
  useEffect(() => {
    // Check if we're in Electron
    const isElectron = typeof window !== 'undefined' && 
                      (window.navigator.userAgent.includes('Electron') || 
                       (window as any).electronAPI);
    
    if (isElectron) {
      console.log('[GROK] useIframeInspector - Using Electron-optimized inspector');
      inspectorRef.current = new ElectronIframeInspector();
    } else {
      console.log('[GROK] useIframeInspector - Using standard iframe inspector');
      inspectorRef.current = new IframeInspector();
    }

    return () => {
      if (inspectorRef.current) {
        inspectorRef.current.destroy();
      }
    };
  }, []);

  // Set iframe reference
  const setIframeRef = useCallback((iframe: HTMLIFrameElement | null) => {
    iframeRef.current = iframe;
    if (iframe && inspectorRef.current) {
      inspectorRef.current.setIframe(iframe);
    }
  }, []);

  // Start inspection
  const startInspection = useCallback(() => {
    console.log('[GROK] useIframeInspector - startInspection called');
    console.log('[GROK] useIframeInspector - Has inspector:', !!inspectorRef.current);
    console.log('[GROK] useIframeInspector - Has iframe:', !!iframeRef.current);
    
    if (!inspectorRef.current) {
      console.error('[GROK] useIframeInspector - No inspector available');
      return;
    }
    
    if (!iframeRef.current) {
      console.error('[GROK] useIframeInspector - No iframe available');
      return;
    }
    
    // Test iframe access
    const canAccess = (inspectorRef.current as any).testIframeAccess?.();
    console.log('[GROK] useIframeInspector - Can access iframe:', canAccess);

    setIsInspecting(true);
    inspectorRef.current.startInspection((data) => {
      console.log('[GROK] useIframeInspector - Node selected:', data);
      setSelectedNode(data);
      options.onNodeSelect?.(data);
    });
  }, [options.onNodeSelect]);

  // Stop inspection
  const stopInspection = useCallback(() => {
    console.log('[GROK] useIframeInspector - stopInspection called');
    console.log('[GROK] useIframeInspector - Has inspector:', !!inspectorRef.current);
    
    if (!inspectorRef.current) return;

    setIsInspecting(false);
    inspectorRef.current.stopInspection();
  }, []);

  // Toggle inspection
  const toggleInspection = useCallback(() => {
    if (isInspecting) {
      stopInspection();
    } else {
      startInspection();
    }
  }, [isInspecting, startInspection, stopInspection]);

  // Listen for framework detection
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      console.log('[GROK] useIframeInspector - Received message:', event.data);

      if (event.data.type === 'GROK_INSPECTOR_READY') {
        const framework = event.data.framework as FrameworkInfo;
        console.log('[GROK] useIframeInspector - Inspector ready, framework:', framework);
        setDetectedFramework(framework);
        options.onFrameworkDetected?.(framework);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [options.onFrameworkDetected]);

  return {
    iframeRef: setIframeRef,
    isInspecting,
    startInspection,
    stopInspection,
    toggleInspection,
    detectedFramework,
    selectedNode,
    clearSelection: () => setSelectedNode(null)
  };
};
