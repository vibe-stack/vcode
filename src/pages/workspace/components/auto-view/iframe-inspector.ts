/**
 * Deep iframe integration system for web framework introspection
 * Supports React, Vue, Angular, and other frameworks with DOM node selection
 * and source code mapping capabilities.
 */

export interface DOMNodeInfo {
  element: HTMLElement;
  tagName: string;
  classList: string[];
  attributes: Record<string, string>;
  xpath: string;
  cssSelector: string;
  boundingRect: DOMRect;
}

export interface ReactComponentInfo {
  componentName: string;
  displayName?: string;
  props: Record<string, any>;
  state?: Record<string, any>;
  sourceLocation?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
  fiberNode?: any;
}

export interface FrameworkInfo {
  type: 'react' | 'vue' | 'angular' | 'svelte' | 'unknown';
  version?: string;
  devtools?: boolean;
}

export interface IframeInspectionData {
  domNode: DOMNodeInfo;
  framework: FrameworkInfo;
  component?: ReactComponentInfo;
  // Additional framework-specific data will be added here
}

export class IframeInspector {
  private iframe: HTMLIFrameElement | null = null;
  private highlightOverlay: HTMLElement | null = null;
  private isInspecting = false;
  private onNodeSelect?: (data: IframeInspectionData) => void;

  constructor() {
    this.createHighlightOverlay();
  }

  public setIframe(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.setupIframeListeners();
  }

  public startInspection(onNodeSelect: (data: IframeInspectionData) => void) {
    this.onNodeSelect = onNodeSelect;
    this.isInspecting = true;
    this.injectInspectionScript();
  }

  public stopInspection() {
    this.isInspecting = false;
    this.hideHighlight();
    this.removeInspectionScript();
  }

  private createHighlightOverlay() {
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #007acc;
      background: rgba(0, 122, 204, 0.1);
      z-index: 9999;
      display: none;
      box-sizing: border-box;
    `;
    document.body.appendChild(this.highlightOverlay);
  }

  private setupIframeListeners() {
    if (!this.iframe) return;

    this.iframe.addEventListener('load', () => {
      this.setupFrameCommunication();
    });
  }

  private setupFrameCommunication() {
    if (!this.iframe?.contentWindow) return;

    console.log('[GROK] IframeInspector - Setting up frame communication');

    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
      if (event.source !== this.iframe?.contentWindow) return;

      console.log('[GROK] IframeInspector - Received message:', event.data);

      if (event.data.type === 'GROK_INSPECT_HOVER') {
        this.showHighlight(event.data.rect);
      } else if (event.data.type === 'GROK_INSPECT_CLICK') {
        this.handleNodeClick(event.data);
      } else if (event.data.type === 'GROK_INSPECT_LEAVE') {
        this.hideHighlight();
      } else if (event.data.type === 'GROK_INSPECTOR_READY') {
        console.log('[GROK] IframeInspector - Inspector script is ready');
      }
    });
  }

  private showHighlight(rect: DOMRect) {
    if (!this.highlightOverlay || !this.iframe) return;

    const iframeRect = this.iframe.getBoundingClientRect();
    
    this.highlightOverlay.style.display = 'block';
    this.highlightOverlay.style.left = `${iframeRect.left + rect.left}px`;
    this.highlightOverlay.style.top = `${iframeRect.top + rect.top}px`;
    this.highlightOverlay.style.width = `${rect.width}px`;
    this.highlightOverlay.style.height = `${rect.height}px`;
  }

  private hideHighlight() {
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';
    }
  }

  private handleNodeClick(data: any) {
    if (!this.onNodeSelect) return;

    const inspectionData: IframeInspectionData = {
      domNode: data.domNode,
      framework: data.framework,
      component: data.component
    };

    this.onNodeSelect(inspectionData);
  }

  private injectInspectionScript() {
    if (!this.iframe?.contentWindow) return;

    console.log('[GROK] IframeInspector - Injecting inspection script');

    const script = `
      (function() {
        console.log('[GROK] Inspection script starting...');
        
        if (window.__GROK_INSPECTOR_INJECTED__) {
          console.log('[GROK] Inspector already injected, skipping');
          return;
        }
        window.__GROK_INSPECTOR_INJECTED__ = true;

        let isInspecting = false;
        let currentHighlight = null;

        // Framework detection
        function detectFramework() {
          const framework = { type: 'unknown', version: undefined, devtools: false };
          
          console.log('[GROK] Starting framework detection');
          
          // React detection with multiple strategies
          const reactIndicators = {
            globalReact: !!window.React,
            reactRoot: !!document.querySelector('[data-reactroot]'),
            nextjsRoot: !!document.querySelector('#__next'),
            reactElements: Array.from(document.querySelectorAll('*')).some(el => 
              Object.keys(el).some(key => 
                key.startsWith('__reactFiber') || 
                key.startsWith('__reactInternalFiber') ||
                key.startsWith('__reactInternalInstance')
              )
            ),
            devtools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
          };

          console.log('[GROK] React indicators:', reactIndicators);

          if (reactIndicators.globalReact || 
              reactIndicators.reactRoot || 
              reactIndicators.nextjsRoot ||
              reactIndicators.reactElements ||
              reactIndicators.devtools) {
            
            framework.type = 'react';
            framework.devtools = reactIndicators.devtools;
            
            // Try to get React version
            if (window.React && window.React.version) {
              framework.version = window.React.version;
            } else if (reactIndicators.nextjsRoot) {
              // Check for Next.js version
              const nextScript = document.querySelector('script[src*="next"]');
              if (nextScript) {
                framework.version = 'Next.js';
              }
            }
            
            console.log('[GROK] Detected React framework:', framework);
          }
          // Vue detection
          else if (window.Vue || document.querySelector('[data-v-]') || window.__VUE__) {
            framework.type = 'vue';
            framework.version = window.Vue?.version;
            framework.devtools = !!window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
            console.log('[GROK] Detected Vue framework:', framework);
          }
          // Angular detection
          else if (window.ng || window.angular || document.querySelector('[ng-version]')) {
            framework.type = 'angular';
            const ngVersion = document.querySelector('[ng-version]');
            framework.version = ngVersion?.getAttribute('ng-version');
            console.log('[GROK] Detected Angular framework:', framework);
          }
          // Svelte detection
          else if (window.__SVELTE__ || document.querySelector('[data-svelte-h]')) {
            framework.type = 'svelte';
            console.log('[GROK] Detected Svelte framework:', framework);
          }

          console.log('[GROK] Final framework detection result:', framework);
          return framework;
        }

        // Get XPath for element
        function getXPath(element) {
          if (element.id !== '') {
            return \`id("\${element.id}")\`;
          }
          if (element === document.body) {
            return element.tagName;
          }

          let ix = 0;
          const siblings = element.parentNode.childNodes;
          for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
              return getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
              ix++;
            }
          }
        }

        // Get CSS selector for element
        function getCSSSelector(element) {
          if (element.id) {
            return '#' + element.id;
          }
          if (element.className) {
            return element.tagName.toLowerCase() + '.' + element.className.split(' ').join('.');
          }
          return element.tagName.toLowerCase();
        }

        // React component introspection
        function getReactComponentInfo(element) {
          if (!element) return null;

          console.log('[GROK] Starting React component detection for element:', element);

          // Try multiple approaches to find React fiber
          let fiber = null;

          // Method 1: Check for React 18+ fiber keys
          const fiberKeys = Object.keys(element).filter(key => 
            key.startsWith('__reactFiber') ||
            key.startsWith('__reactInternalFiber') ||
            key.startsWith('__reactInternalInstance')
          );
          
          console.log('[GROK] Found fiber keys:', fiberKeys);
          
          if (fiberKeys.length > 0) {
            fiber = element[fiberKeys[0]];
            console.log('[GROK] Found fiber via key:', fiberKeys[0], fiber);
          }

          // Method 2: Direct property access
          if (!fiber) {
            fiber = element._reactInternalFiber || 
                    element.__reactInternalFiber || 
                    element.__reactInternalInstance ||
                    element._reactInternalInstance;
            console.log('[GROK] Found fiber via direct access:', fiber);
          }

          // Method 3: Check React DevTools global hook
          if (!fiber && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            try {
              const renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers;
              if (renderers && renderers.size > 0) {
                for (const renderer of renderers.values()) {
                  if (renderer.findFiberByHostInstance) {
                    fiber = renderer.findFiberByHostInstance(element);
                    if (fiber) {
                      console.log('[GROK] Found fiber via DevTools:', fiber);
                      break;
                    }
                  }
                }
              }
            } catch (e) {
              console.log('[GROK] DevTools method failed:', e);
            }
          }

          // Method 4: Search parent elements
          if (!fiber) {
            let parent = element.parentElement;
            let depth = 0;
            while (parent && !fiber && depth < 10) {
              const parentFiberKeys = Object.keys(parent).filter(key => 
                key.startsWith('__reactFiber') ||
                key.startsWith('__reactInternalFiber') ||
                key.startsWith('__reactInternalInstance')
              );
              
              if (parentFiberKeys.length > 0) {
                fiber = parent[parentFiberKeys[0]];
                console.log('[GROK] Found fiber in parent at depth', depth, ':', fiber);
                break;
              }
              
              parent = parent.parentElement;
              depth++;
            }
          }

          if (!fiber) {
            console.log('[GROK] No React fiber found for element');
            return null;
          }

          console.log('[GROK] Working with fiber:', fiber);

          // Navigate up the fiber tree to find the component
          let componentFiber = fiber;
          let searchDepth = 0;
          
          while (componentFiber && searchDepth < 20) {
            console.log('[GROK] Checking fiber at depth', searchDepth, ':', {
              type: componentFiber.type,
              typeOf: typeof componentFiber.type,
              elementType: componentFiber.elementType,
              tag: componentFiber.tag
            });

            // Check if this is a function component or class component
            if (componentFiber.type && 
                (typeof componentFiber.type === 'function' || 
                 (typeof componentFiber.type === 'object' && componentFiber.type.render))) {
              console.log('[GROK] Found component fiber:', componentFiber);
              break;
            }

            // Also check elementType for some React patterns
            if (componentFiber.elementType && typeof componentFiber.elementType === 'function') {
              componentFiber.type = componentFiber.elementType;
              console.log('[GROK] Found component via elementType:', componentFiber);
              break;
            }

            componentFiber = componentFiber.return || componentFiber._debugOwner;
            searchDepth++;
          }

          if (!componentFiber || !componentFiber.type) {
            console.log('[GROK] No component fiber found');
            return null;
          }

          const componentType = componentFiber.type;
          console.log('[GROK] Component type:', componentType);

          const component = {
            componentName: componentType.name || 
                         componentType.displayName || 
                         (componentType.render && componentType.render.name) ||
                         'Anonymous',
            displayName: componentType.displayName,
            props: componentFiber.memoizedProps || componentFiber.pendingProps || {},
            state: componentFiber.memoizedState,
            fiberNode: componentFiber
          };

          console.log('[GROK] Extracted component info:', component);

          // Try to get source location from React DevTools
          if (componentFiber._debugSource) {
            component.sourceLocation = {
              fileName: componentFiber._debugSource.fileName,
              lineNumber: componentFiber._debugSource.lineNumber,
              columnNumber: componentFiber._debugSource.columnNumber
            };
            console.log('[GROK] Found source location:', component.sourceLocation);
          } else {
            console.log('[GROK] No _debugSource found on fiber');
          }

          // Try alternative source location methods
          if (!component.sourceLocation) {
            // Check for source in the component type
            if (componentType.__source) {
              component.sourceLocation = {
                fileName: componentType.__source.fileName,
                lineNumber: componentType.__source.lineNumber,
                columnNumber: componentType.__source.columnNumber
              };
              console.log('[GROK] Found source via __source:', component.sourceLocation);
            }

            // Check for Next.js specific source info
            if (!component.sourceLocation && componentType.__nextSourceMap) {
              console.log('[GROK] Found Next.js source map:', componentType.__nextSourceMap);
            }
          }

          return component;
        }

        // DOM node information extraction
        function getDOMNodeInfo(element) {
          const rect = element.getBoundingClientRect();
          const attributes = {};
          for (let attr of element.attributes) {
            attributes[attr.name] = attr.value;
          }

          return {
            tagName: element.tagName.toLowerCase(),
            classList: Array.from(element.classList),
            attributes,
            xpath: getXPath(element),
            cssSelector: getCSSSelector(element),
            boundingRect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left
            }
          };
        }

        // Event handlers
        function handleMouseOver(event) {
          if (!isInspecting) return;
          
          event.preventDefault();
          event.stopPropagation();

          const rect = event.target.getBoundingClientRect();
          window.parent.postMessage({
            type: 'GROK_INSPECT_HOVER',
            rect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left
            }
          }, '*');
        }

        function handleMouseOut(event) {
          if (!isInspecting) return;
          
          window.parent.postMessage({
            type: 'GROK_INSPECT_LEAVE'
          }, '*');
        }

        function handleClick(event) {
          if (!isInspecting) return;
          
          event.preventDefault();
          event.stopPropagation();

          console.log('[GROK] Click detected on element:', event.target);

          const framework = detectFramework();
          const domNode = getDOMNodeInfo(event.target);
          let component = null;

          console.log('[GROK] Framework detected:', framework);
          console.log('[GROK] DOM node info:', domNode);

          if (framework.type === 'react') {
            try {
              component = getReactComponentInfo(event.target);
              console.log('[GROK] React component info:', component);
            } catch (error) {
              console.error('[GROK] Error getting React component info:', error);
            }
          }
          // Add other framework component detection here

          const result = {
            type: 'GROK_INSPECT_CLICK',
            domNode,
            framework,
            component
          };

          console.log('[GROK] Sending inspection result:', result);

          window.parent.postMessage(result, '*');
        }

        // Start/stop inspection
        window.addEventListener('message', (event) => {
          if (event.data.type === 'GROK_START_INSPECTION') {
            isInspecting = true;
            document.addEventListener('mouseover', handleMouseOver, true);
            document.addEventListener('mouseout', handleMouseOut, true);
            document.addEventListener('click', handleClick, true);
            document.body.style.cursor = 'crosshair';
          } else if (event.data.type === 'GROK_STOP_INSPECTION') {
            isInspecting = false;
            document.removeEventListener('mouseover', handleMouseOver, true);
            document.removeEventListener('mouseout', handleMouseOut, true);
            document.removeEventListener('click', handleClick, true);
            document.body.style.cursor = '';
          }
        });

        // Signal that the script is ready
        console.log('[GROK] Inspector script ready, sending ready message');
        window.parent.postMessage({
          type: 'GROK_INSPECTOR_READY',
          framework: detectFramework()
        }, '*');
      })();
    `;

    console.log('[GROK] IframeInspector - Injecting script into iframe');

    // Inject the script
    this.iframe.contentWindow.postMessage({
      type: 'GROK_INJECT_SCRIPT',
      script
    }, '*');

    // Alternative injection method using script tag
    try {
      const doc = this.iframe.contentDocument;
      if (doc) {
        console.log('[GROK] IframeInspector - Injecting via DOM');
        const scriptElement = doc.createElement('script');
        scriptElement.textContent = script;
        doc.head.appendChild(scriptElement);
        console.log('[GROK] IframeInspector - Script injected successfully');
      } else {
        console.log('[GROK] IframeInspector - No access to iframe document');
      }
    } catch (e) {
      console.warn('[GROK] IframeInspector - Could not inject script via DOM:', e);
      console.log('[GROK] IframeInspector - Trying postMessage approach');
    }

    // Start inspection
    setTimeout(() => {
      console.log('[GROK] IframeInspector - Starting inspection mode');
      this.iframe?.contentWindow?.postMessage({
        type: 'GROK_START_INSPECTION'
      }, '*');
    }, 500); // Increased timeout to ensure script is loaded
  }

  private removeInspectionScript() {
    if (!this.iframe?.contentWindow) return;

    this.iframe.contentWindow.postMessage({
      type: 'GROK_STOP_INSPECTION'
    }, '*');
  }

  public destroy() {
    this.stopInspection();
    if (this.highlightOverlay) {
      document.body.removeChild(this.highlightOverlay);
    }
  }
}
