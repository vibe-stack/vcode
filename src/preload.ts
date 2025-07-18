import exposeContexts from "./helpers/ipc/context-exposer";

exposeContexts();

// Add iframe inspection capabilities for Electron
if (typeof window !== 'undefined') {
  (window as any).electronIframeHelper = {
    canAccessIframe: (iframe: HTMLIFrameElement) => {
      try {
        return !!iframe.contentDocument;
      } catch (e) {
        return false;
      }
    },
    
    injectScript: (iframe: HTMLIFrameElement, script: string) => {
      try {
        if (iframe.contentDocument) {
          const scriptElement = iframe.contentDocument.createElement('script');
          scriptElement.textContent = script;
          iframe.contentDocument.head.appendChild(scriptElement);
          return true;
        }
        return false;
      } catch (e) {
        console.error('Failed to inject script:', e);
        return false;
      }
    },
    
    executeScript: (iframe: HTMLIFrameElement, script: string) => {
      try {
        if (iframe.contentWindow) {
          return (iframe.contentWindow as any).eval(script);
        }
        return false;
      } catch (e) {
        console.error('Failed to execute script:', e);
        return false;
      }
    }
  };
}
