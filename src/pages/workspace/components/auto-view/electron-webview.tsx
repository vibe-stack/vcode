import React, { useRef, useEffect, useState } from 'react';

interface ElectronWebViewProps {
  src: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  onRef?: (ref: any) => void;
}

export const ElectronWebView: React.FC<ElectronWebViewProps> = ({
  src,
  className,
  onLoad,
  onError,
  onRef
}) => {
  const webviewRef = useRef<any>(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if we're in Electron
    setIsElectron(typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron'));
  }, []);

  useEffect(() => {
    if (webviewRef.current && onRef) {
      onRef(webviewRef.current);
    }
  }, [onRef]);

  useEffect(() => {
    if (!webviewRef.current || !isElectron) return;

    const webview = webviewRef.current;

    const handleLoad = () => {
      console.log('[GROK] ElectronWebView - Webview loaded');
      onLoad?.();
    };

    const handleLoadFail = () => {
      console.log('[GROK] ElectronWebView - Webview load failed');
      onError?.();
    };

    webview.addEventListener('dom-ready', handleLoad);
    webview.addEventListener('did-fail-load', handleLoadFail);

    return () => {
      webview.removeEventListener('dom-ready', handleLoad);
      webview.removeEventListener('did-fail-load', handleLoadFail);
    };
  }, [src, onLoad, onError, isElectron]);

  if (isElectron) {
    // Use Electron's webview for better cross-origin support
    return React.createElement('webview', {
      ref: webviewRef,
      src,
      className,
      style: { width: '100%', height: '100%' },
      webpreferences: 'nodeIntegration=false,contextIsolation=true,webSecurity=false',
      allowpopups: 'true',
      disablewebsecurity: 'true'
    });
  }

  // Fallback to iframe for non-Electron environments
  return (
    <iframe
      ref={(el) => {
        webviewRef.current = el;
        onRef?.(el);
      }}
      src={src}
      className={className}
      style={{ width: '100%', height: '100%', border: 'none' }}
      onLoad={onLoad}
      onError={onError}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-top-navigation allow-modals"
    />
  );
};
