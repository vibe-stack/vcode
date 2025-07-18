/**
 * Deep iframe integration system for web framework introspection
 * Supports React, Vue, Angular, and other frameworks with DOM node selection
 * and source code mapping capabilities.
 */

export interface DOMNodeInfo {
  element?: HTMLElement; // Made optional to avoid circular references
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
  fiberNode?: any; // Made optional to avoid circular references
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
    console.log('[GROK] IframeInspector - Starting inspection mode');
    this.onNodeSelect = onNodeSelect;
    this.isInspecting = true;
    
    // Always inject the script when starting inspection to ensure it's there
    console.log('[GROK] IframeInspector - Injecting script on inspection start');
    this.injectInspectionScript();
    
    // As a fallback, add mouse listeners to the iframe itself
    this.setupFallbackInspection();
    
    // Start inspection mode after a delay to ensure script is loaded
    setTimeout(() => {
      console.log('[GROK] IframeInspector - Sending start inspection message');
      this.iframe?.contentWindow?.postMessage({
        type: 'GROK_START_INSPECTION'
      }, '*');
    }, 1000); // Increased delay to ensure script injection
  }

  public stopInspection() {
    this.isInspecting = false;
    this.hideHighlight();
    this.removeInspectionScript();
    this.removeFallbackInspection();
  }
  
  private setupFallbackInspection() {
    if (!this.iframe) return;
    
    console.log('[GROK] IframeInspector - Setting up fallback inspection on iframe');
    
    // Add pointer events to show we're in inspection mode
    this.iframe.style.cursor = 'crosshair';
    
    // Add click handler to iframe itself
    this.iframe.addEventListener('click', this.handleFallbackClick, true);
    this.iframe.addEventListener('mousemove', this.handleFallbackMouseMove, true);
  }
  
  private removeFallbackInspection() {
    if (!this.iframe) return;
    
    console.log('[GROK] IframeInspector - Removing fallback inspection');
    
    this.iframe.style.cursor = '';
    this.iframe.removeEventListener('click', this.handleFallbackClick, true);
    this.iframe.removeEventListener('mousemove', this.handleFallbackMouseMove, true);
  }
  
  private handleFallbackClick = (event: MouseEvent) => {
    if (!this.isInspecting) return;
    
    console.log('[GROK] IframeInspector - Fallback click detected');
    event.preventDefault();
    event.stopPropagation();
    
    // Flash the highlight to show something happened
    const rect = this.iframe!.getBoundingClientRect();
    this.showHighlight(rect);
    
    setTimeout(() => {
      this.hideHighlight();
    }, 200);
    
    // Create basic inspection data
    const inspectionData: IframeInspectionData = {
      domNode: {
        tagName: 'iframe-fallback',
        classList: ['fallback-inspection'],
        attributes: { 'data-fallback': 'true' },
        xpath: 'iframe',
        cssSelector: 'iframe',
        boundingRect: rect
      },
      framework: { 
        type: 'unknown',
        version: 'Cross-origin iframe - inspector script injection failed'
      }
    };
    
    console.log('[GROK] IframeInspector - Fallback inspection data:', inspectionData);
    
    if (this.onNodeSelect) {
      this.onNodeSelect(inspectionData);
    }
  };
  
  private handleFallbackMouseMove = (event: MouseEvent) => {
    if (!this.isInspecting) return;
    
    // Show highlight over the entire iframe as fallback
    const rect = this.iframe!.getBoundingClientRect();
    this.showHighlight(rect);
  };

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
      console.log('[GROK] IframeInspector - Iframe loaded, setting up communication');
      this.setupFrameCommunication();
      // Only inject script if we're currently inspecting
      if (this.isInspecting) {
        console.log('[GROK] IframeInspector - Currently inspecting, injecting script after iframe load');
        setTimeout(() => {
          this.injectInspectionScript();
        }, 100);
      }
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
      } else if (event.data.type === 'GROK_REQUEST_INSPECTION_STATE') {
        console.log('[GROK] IframeInspector - Inspector requesting current state, isInspecting:', this.isInspecting);
        // Respond with current inspection state
        if (this.isInspecting) {
          this.iframe?.contentWindow?.postMessage({
            type: 'GROK_START_INSPECTION'
          }, '*');
        }
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

    try {
      console.log('[GROK] IframeInspector - Processing node click data:', {
        hasData: !!data,
        hasDomNode: !!data.domNode,
        hasFramework: !!data.framework,
        hasComponent: !!data.component
      });

      const inspectionData: IframeInspectionData = {
        domNode: data.domNode,
        framework: data.framework,
        component: data.component
      };

      console.log('[GROK] IframeInspector - Calling onNodeSelect with:', inspectionData);
      this.onNodeSelect(inspectionData);
    } catch (error) {
      console.error('[GROK] IframeInspector - Error processing node click:', error);
    }
  }

  protected injectInspectionScript() {
    if (!this.iframe?.contentWindow) {
      console.log('[GROK] IframeInspector - No iframe content window available');
      return;
    }

    console.log('[GROK] IframeInspector - Injecting inspection script');

    const script = `
      (function() {
        console.log('[GROK] Inspection script starting execution...');
        
        if (window.__GROK_INSPECTOR_INJECTED__) {
          console.log('[GROK] Inspector already injected, skipping');
          return;
        }
        
        console.log('[GROK] Setting up inspector...');
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

          console.log('[GROK] Starting React component detection for element type:', element.tagName);

          // Try multiple approaches to find React fiber
          let fiber = null;
          
          // Get a reference to React if available
          const ReactRef = window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.values()?.next()?.value?.React;

          // Method 1: Check for React 18+ fiber keys (most common)
          const fiberKeys = Object.keys(element).filter(key => 
            key.startsWith('__reactFiber') ||
            key.startsWith('__reactInternalFiber') ||
            key.startsWith('__reactInternalInstance')
          );
          
          console.log('[GROK] Found fiber keys:', fiberKeys);
          
          if (fiberKeys.length > 0) {
            fiber = element[fiberKeys[0]];
            console.log('[GROK] Found fiber via key:', fiberKeys[0]);
          }

          // Method 2: Direct property access (legacy React versions)
          if (!fiber) {
            fiber = element._reactInternalFiber || 
                    element.__reactInternalFiber || 
                    element.__reactInternalInstance ||
                    element._reactInternalInstance;
            console.log('[GROK] Found fiber via direct access:', !!fiber);
          }

          // Method 3: React DevTools global hook (most reliable for production)
          if (!fiber && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            try {
              const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
              
              // Try all available renderers
              if (hook.renderers && hook.renderers.size > 0) {
                for (const renderer of hook.renderers.values()) {
                  if (renderer.findFiberByHostInstance) {
                    fiber = renderer.findFiberByHostInstance(element);
                    if (fiber) {
                      console.log('[GROK] Found fiber via DevTools renderer');
                      break;
                    }
                  }
                }
              }
              
              // Try alternative DevTools methods
              if (!fiber && hook.getFiberRoots) {
                const roots = Array.from(hook.getFiberRoots(1) || []);
                for (const root of roots) {
                  if (root.current) {
                    // Walk down from root to find our element
                    fiber = findFiberForElement(root.current, element);
                    if (fiber) {
                      console.log('[GROK] Found fiber by walking from DevTools root');
                      break;
                    }
                  }
                }
              }
            } catch (e) {
              console.log('[GROK] DevTools method failed:', e.message);
            }
          }

          // Method 4: Search parent and child elements for fibers
          if (!fiber) {
            console.log('[GROK] Searching parent elements for React fiber');
            let parent = element.parentElement;
            let depth = 0;
            while (parent && !fiber && depth < 15) {
              // Check parent for fiber keys
              const parentFiberKeys = Object.keys(parent).filter(key => 
                key.startsWith('__reactFiber') ||
                key.startsWith('__reactInternalFiber') ||
                key.startsWith('__reactInternalInstance')
              );
              
              if (parentFiberKeys.length > 0) {
                const parentFiber = parent[parentFiberKeys[0]];
                // Find the specific child fiber for our element
                fiber = findChildFiberForElement(parentFiber, element);
                if (fiber) {
                  console.log('[GROK] Found child fiber from parent at depth', depth);
                  break;
                } else {
                  // Use parent fiber as fallback but mark it
                  fiber = parentFiber;
                  console.log('[GROK] Using parent fiber as fallback at depth', depth);
                  break;
                }
              }
              
              parent = parent.parentElement;
              depth++;
            }
          }

          // Method 5: Try to find fiber in child elements (for composite components)
          if (!fiber) {
            console.log('[GROK] Searching child elements for React fiber');
            const children = element.querySelectorAll('*');
            for (let i = 0; i < Math.min(children.length, 10); i++) {
              const child = children[i];
              const childFiberKeys = Object.keys(child).filter(key => 
                key.startsWith('__reactFiber') ||
                key.startsWith('__reactInternalFiber') ||
                key.startsWith('__reactInternalInstance')
              );
              
              if (childFiberKeys.length > 0) {
                const childFiber = child[childFiberKeys[0]];
                // Walk up from child to find component responsible for our element
                let currentFiber = childFiber;
                while (currentFiber && currentFiber.return) {
                  if (currentFiber.stateNode === element || 
                      (currentFiber.stateNode && currentFiber.stateNode.contains && currentFiber.stateNode.contains(element))) {
                    fiber = currentFiber;
                    console.log('[GROK] Found fiber by walking up from child');
                    break;
                  }
                  currentFiber = currentFiber.return;
                }
                if (fiber) break;
              }
            }
          }

          if (!fiber) {
            console.log('[GROK] No React fiber found for element after all methods');
            return null;
          }

          console.log('[GROK] Working with fiber:', {
            type: typeof fiber.type,
            hasStateNode: !!fiber.stateNode,
            hasReturn: !!fiber.return,
            hasChild: !!fiber.child
          });
          
          // Helper function to find specific fiber for an element by walking the tree
          function findFiberForElement(rootFiber, targetElement) {
            if (!rootFiber) return null;
            
            const visited = new Set();
            const queue = [rootFiber];
            
            while (queue.length > 0) {
              const currentFiber = queue.shift();
              
              if (visited.has(currentFiber) || visited.size > 1000) break;
              visited.add(currentFiber);
              
              // Check if this fiber's DOM node matches our target
              if (currentFiber.stateNode === targetElement) {
                return currentFiber;
              }
              
              // Add children to queue
              if (currentFiber.child) queue.push(currentFiber.child);
              if (currentFiber.sibling) queue.push(currentFiber.sibling);
            }
            
            return null;
          }
          
          // Helper function to find child fiber for element
          function findChildFiberForElement(parentFiber, targetElement) {
            if (!parentFiber) return null;
            
            const visited = new Set();
            const queue = [parentFiber];
            
            while (queue.length > 0) {
              const currentFiber = queue.shift();
              
              if (visited.has(currentFiber) || visited.size > 500) break;
              visited.add(currentFiber);
              
              // Check if this fiber corresponds to our target element
              if (currentFiber.stateNode === targetElement ||
                  (currentFiber.stateNode && currentFiber.stateNode.contains && currentFiber.stateNode.contains(targetElement))) {
                return currentFiber;
              }
              
              // Add children to search
              if (currentFiber.child) queue.push(currentFiber.child);
              if (currentFiber.sibling) queue.push(currentFiber.sibling);
            }
            
            return null;
          }

          // Navigate up the fiber tree to find the most specific component
          let componentFiber = null;
          let searchDepth = 0;
          let currentFiber = fiber;
          let candidates = [];
          
          // First, collect all component candidates going up the tree
          while (currentFiber && searchDepth < 15) {
            const type = currentFiber.type || currentFiber.elementType;
            
            if (type) {
              // Check if this is a component (function or class)
              const isComponent = typeof type === 'function' || 
                                (typeof type === 'object' && type.render);
              
              // Skip DOM elements (string types like 'div', 'span', etc.)
              const isDOMElement = typeof type === 'string';
              
              // Skip React built-ins and fragments
              const isBuiltIn = type === React?.Fragment || 
                              type === React?.StrictMode ||
                              type?.$$typeof === Symbol.for('react.fragment') ||
                              type?.$$typeof === Symbol.for('react.strict_mode');
              
              if (isComponent && !isDOMElement && !isBuiltIn) {
                const componentName = type.name || type.displayName || 'Anonymous';
                
                // Skip generic names that indicate wrapper/layout components
                const isGenericWrapper = [
                  'Layout', 'RootLayout', 'PageLayout', 'AppLayout',
                  'Router', 'Route', 'Routes', 'BrowserRouter', 'HashRouter',
                  'Provider', 'Context', 'ContextProvider',
                  'App', 'Root', 'Main', 'Container', 'Wrapper',
                  'Page', 'Template', 'Shell', 'Frame',
                  'ErrorBoundary', 'Suspense', 'Boundary',
                  'Anonymous', 'ForwardRef', 'memo', 'withRouter'
                ].some(generic => componentName.includes(generic));
                
                // Also check if this component's DOM node is significantly larger than the clicked element
                // This helps avoid parent containers that wrap the actual component
                let isDOMContainerLikelyParent = false;
                if (currentFiber.stateNode && currentFiber.stateNode !== element) {
                  try {
                    const fiberRect = currentFiber.stateNode.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();
                    
                    // If the fiber's DOM node is much larger than clicked element, it's likely a parent container
                    const areaRatio = (fiberRect.width * fiberRect.height) / (elementRect.width * elementRect.height);
                    isDOMContainerLikelyParent = areaRatio > 10; // 10x larger area suggests parent container
                    
                    console.log('[GROK] DOM size comparison - fiber:', fiberRect.width + 'x' + fiberRect.height, 
                                'vs element:', elementRect.width + 'x' + elementRect.height, 
                                'ratio:', areaRatio.toFixed(2), 'isParent:', isDOMContainerLikelyParent);
                  } catch (e) {
                    // Ignore errors in size calculation
                  }
                }
                
                candidates.push({
                  fiber: currentFiber,
                  type: type,
                  name: componentName,
                  depth: searchDepth,
                  isGenericWrapper,
                  isDOMContainerLikelyParent,
                  hasSourceLocation: !!(currentFiber._debugSource || type.__source),
                  isDirectMatch: currentFiber.stateNode === element
                });
                
                console.log('[GROK] Found component candidate at depth', searchDepth, ':', componentName, {
                  isGenericWrapper,
                  isDOMContainerLikelyParent,
                  hasSourceLocation: !!(currentFiber._debugSource || type.__source),
                  isDirectMatch: currentFiber.stateNode === element
                });
              }
            }

            currentFiber = currentFiber.return || currentFiber._debugOwner;
            searchDepth++;
          }
          
          console.log('[GROK] Found', candidates.length, 'component candidates:');
          candidates.forEach((c, i) => {
            console.log('[GROK] ' + i + ': ' + c.name + ' (depth: ' + c.depth + ', generic: ' + c.isGenericWrapper + ', directMatch: ' + c.isDirectMatch + ', hasSource: ' + c.hasSourceLocation + ', largeContainer: ' + c.isDOMContainerLikelyParent + ')');
          });
          
          // Now select the best candidate
          if (candidates.length > 0) {
            // Strategy 1: Prefer direct DOM matches (component that renders exactly this element)
            const directMatches = candidates.filter(c => c.isDirectMatch);
            
            if (directMatches.length > 0) {
              // Among direct matches, prefer specific components with source location
              const specificDirectMatches = directMatches.filter(c => !c.isGenericWrapper && c.hasSourceLocation);
              
              if (specificDirectMatches.length > 0) {
                componentFiber = specificDirectMatches[0].fiber;
                console.log('[GROK] Selected direct match with source:', specificDirectMatches[0].name);
              } else {
                componentFiber = directMatches[0].fiber;
                console.log('[GROK] Selected direct match:', directMatches[0].name);
              }
            } else {
              // Strategy 2: Prefer specific components that aren't large DOM containers
              const specificComponents = candidates.filter(c => 
                !c.isGenericWrapper && 
                !c.isDOMContainerLikelyParent
              );
              
              if (specificComponents.length > 0) {
                // Among specific components, prefer those with source location info
                const componentsWithSource = specificComponents.filter(c => c.hasSourceLocation);
                
                if (componentsWithSource.length > 0) {
                  componentFiber = componentsWithSource[0].fiber;
                  console.log('[GROK] Selected specific component with source:', componentsWithSource[0].name);
                } else {
                  componentFiber = specificComponents[0].fiber;
                  console.log('[GROK] Selected specific component:', specificComponents[0].name);
                }
              } else {
                // Strategy 3: Use any component that's not a large DOM container
                const nonContainerComponents = candidates.filter(c => !c.isDOMContainerLikelyParent);
                
                if (nonContainerComponents.length > 0) {
                  componentFiber = nonContainerComponents[0].fiber;
                  console.log('[GROK] Selected non-container component:', nonContainerComponents[0].name);
                } else {
                  // Fallback: use the most specific component available
                  componentFiber = candidates[0].fiber;
                  console.log('[GROK] Fallback to first candidate:', candidates[0].name);
                }
              }
            }
          }

          if (!componentFiber || !componentFiber.type) {
            console.log('[GROK] No component fiber found');
            return null;
          }

          const componentType = componentFiber.type;
          console.log('[GROK] Component type name:', componentType.name || componentType.displayName || 'Anonymous');

          // Safe prop extraction to avoid circular references
          let safeProps = {};
          try {
            const rawProps = componentFiber.memoizedProps || componentFiber.pendingProps || {};
            // Create a safe copy of props, avoiding functions and complex objects
            for (const [key, value] of Object.entries(rawProps)) {
              if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
                safeProps[key] = value;
              } else if (Array.isArray(value)) {
                safeProps[key] = '[Array]';
              } else if (typeof value === 'object') {
                safeProps[key] = '[Object]';
              } else if (typeof value === 'function') {
                safeProps[key] = '[Function]';
              } else {
                safeProps[key] = '[Unknown]';
              }
            }
          } catch (e) {
            console.warn('[GROK] Error extracting props:', e);
            safeProps = {};
          }

          // Safe state extraction
          let safeState = null;
          try {
            const rawState = componentFiber.memoizedState;
            if (rawState && typeof rawState === 'object') {
              safeState = '[State Object]';
            } else {
              safeState = rawState;
            }
          } catch (e) {
            console.warn('[GROK] Error extracting state:', e);
            safeState = null;
          }

          const component = {
            componentName: componentType.name || 
                         componentType.displayName || 
                         (componentType.render && componentType.render.name) ||
                         'Anonymous',
            displayName: componentType.displayName,
            props: safeProps,
            state: safeState,
            // Don't include fiberNode to avoid circular references
            fiberNode: null
          };

          console.log('[GROK] Extracted component info:', {
            componentName: component.componentName,
            hasProps: Object.keys(component.props).length > 0,
            hasState: !!component.state,
            hasSourceLocation: !!component.sourceLocation
          });

          // Enhanced source location detection
          let sourceLocation = null;
          
          // Method 1: React DevTools debug source
          if (componentFiber._debugSource) {
            sourceLocation = {
              fileName: componentFiber._debugSource.fileName,
              lineNumber: componentFiber._debugSource.lineNumber,
              columnNumber: componentFiber._debugSource.columnNumber
            };
            console.log('[GROK] Found source via _debugSource:', sourceLocation);
          }
          
          // Method 2: Component type __source (Babel transform)
          if (!sourceLocation && componentType.__source) {
            sourceLocation = {
              fileName: componentType.__source.fileName,
              lineNumber: componentType.__source.lineNumber,
              columnNumber: componentType.__source.columnNumber
            };
            console.log('[GROK] Found source via __source:', sourceLocation);
          }
          
          // Method 3: Check elementType for source info
          if (!sourceLocation && componentFiber.elementType && componentFiber.elementType.__source) {
            sourceLocation = {
              fileName: componentFiber.elementType.__source.fileName,
              lineNumber: componentFiber.elementType.__source.lineNumber,
              columnNumber: componentFiber.elementType.__source.columnNumber
            };
            console.log('[GROK] Found source via elementType.__source:', sourceLocation);
          }
          
          // Method 4: Try to extract from stack trace
          if (!sourceLocation) {
            try {
              // Create a temporary error to get stack trace
              const tempError = new Error();
              const stack = tempError.stack;
              
              if (stack) {
                // Look for React component files in the stack
                const lines = stack.split('\\n');
                for (const line of lines) {
                  // Match patterns like "at ComponentName (file:///path/file.tsx:123:45)"
                  const match = line.match(/at\\s+([^\\s]+)\\s+\\((.+?):(\\d+):(\\d+)\\)/);
                  if (match && (match[2].includes('.tsx') || match[2].includes('.jsx') || match[2].includes('.js') || match[2].includes('.ts'))) {
                    // Skip node_modules and common framework files
                    if (!match[2].includes('node_modules') && 
                        !match[2].includes('react-dom') && 
                        !match[2].includes('next/dist')) {
                      sourceLocation = {
                        fileName: match[2],
                        lineNumber: parseInt(match[3]),
                        columnNumber: parseInt(match[4])
                      };
                      console.log('[GROK] Found source via stack trace:', sourceLocation);
                      break;
                    }
                  }
                }
              }
            } catch (e) {
              console.log('[GROK] Stack trace method failed:', e.message);
            }
          }
          
          // Method 5: Check React DevTools global hook for fiber source mapping
          if (!sourceLocation && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            try {
              const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
              if (hook.getFiberRoots) {
                // Try to get source mapping from DevTools
                const roots = Array.from(hook.getFiberRoots(1) || []);
                for (const root of roots) {
                  if (root.current && root.current._debugSource) {
                    // This is a fallback - not ideal but better than nothing
                    console.log('[GROK] Found fallback source from root:', root.current._debugSource);
                  }
                }
              }
            } catch (e) {
              console.log('[GROK] DevTools source mapping failed:', e.message);
            }
          }
          
          // Method 6: Next.js specific source mapping
          if (!sourceLocation) {
            // Check for Next.js webpack source maps
            if (componentType.__nextSourceMap) {
              console.log('[GROK] Found Next.js source map:', componentType.__nextSourceMap);
              // Next.js source maps might be in a different format
            }
            
            // Check for Next.js hot reload info
            if (componentType.__hmrId) {
              console.log('[GROK] Found Next.js HMR ID:', componentType.__hmrId);
            }
            
            // Check global Next.js info
            if (window.__NEXT_DATA__) {
              console.log('[GROK] Next.js app detected, buildId:', window.__NEXT_DATA__.buildId);
            }
          }
          
          // Method 7: Try to resolve source maps for better file paths
          if (!sourceLocation || sourceLocation.fileName.includes('webpack://') || sourceLocation.fileName.includes('.next/')) {
            try {
              // Look for source maps in the page
              const scripts = Array.from(document.querySelectorAll('script'));
              const sourceMapScript = scripts.find(script => 
                script.src && (script.src.includes('.map') || script.textContent?.includes('sourceMappingURL'))
              );
              
              if (sourceMapScript) {
                console.log('[GROK] Found potential source map:', sourceMapScript.src || 'inline');
              }
              
              // Check for webpack source maps in global scope
              if (window.__webpack_require__ && componentType.name) {
                console.log('[GROK] Webpack detected, component name:', componentType.name);
                
                // Try to find the module using webpack's module system
                try {
                  const modules = window.__webpack_require__.cache;
                  if (modules) {
                    for (const [moduleId, moduleInfo] of Object.entries(modules)) {
                      if (moduleInfo && moduleInfo.exports && typeof moduleInfo.exports === 'object') {
                        // Check if this module exports our component
                        for (const [exportName, exportValue] of Object.entries(moduleInfo.exports)) {
                          if (exportValue === componentType || 
                              (exportValue && exportValue.name === componentType.name)) {
                            console.log('[GROK] Found component in webpack module:', moduleId, 'export:', exportName);
                            // The module ID might give us hints about the file
                            if (typeof moduleId === 'string' && moduleId.includes('/')) {
                              sourceLocation = {
                                fileName: moduleId,
                                lineNumber: 1,
                                columnNumber: 1
                              };
                            }
                            break;
                          }
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.log('[GROK] Webpack module search failed:', e.message);
                }
              }
              
              // Check for Vite source maps
              if (window.__vite_plugin_react_preamble_installed__) {
                console.log('[GROK] Vite detected');
                
                // Vite often puts original file info in different places
                if (componentType.__vite_hmr_id) {
                  console.log('[GROK] Found Vite HMR ID:', componentType.__vite_hmr_id);
                }
              }
              
            } catch (e) {
              console.log('[GROK] Source map resolution failed:', e.message);
            }
          }
          
          if (sourceLocation) {
            component.sourceLocation = sourceLocation;
            
            // Clean up the file path for better display
            if (component.sourceLocation.fileName) {
              let cleanPath = component.sourceLocation.fileName;
              
              // Remove file:// protocol
              cleanPath = cleanPath.replace(/^file:\\/\\/\\//, '');
              
              // Convert Windows paths
              cleanPath = cleanPath.replace(/\\\\/g, '/');
              
              // Try to make path relative to common project roots
              const commonRoots = ['/src/', '/app/', '/components/', '/pages/', '/lib/', '/utils/'];
              for (const root of commonRoots) {
                const rootIndex = cleanPath.indexOf(root);
                if (rootIndex > 0) {
                  cleanPath = cleanPath.substring(rootIndex + 1);
                  break;
                }
              }
              
              component.sourceLocation.fileName = cleanPath;
            }
          } else {
            console.log('[GROK] No source location found for component:', component.componentName);
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

        // Create overlay element for highlighting
        function createOverlay() {
          const overlay = document.createElement('div');
          overlay.id = '__grok_inspector_overlay__';
          overlay.style.cssText = \`
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 0 !important;
            height: 0 !important;
            background: rgba(59, 130, 246, 0.3) !important;
            border: 2px solid rgb(59, 130, 246) !important;
            pointer-events: none !important;
            z-index: 999999 !important;
            transition: all 0.1s ease !important;
            box-sizing: border-box !important;
            display: none !important;
          \`;
          document.body.appendChild(overlay);
          return overlay;
        }

        // Get or create overlay
        function getOverlay() {
          let overlay = document.getElementById('__grok_inspector_overlay__');
          if (!overlay) {
            overlay = createOverlay();
          }
          return overlay;
        }

        // Update overlay position and size
        function updateOverlay(element) {
          const overlay = getOverlay();
          const rect = element.getBoundingClientRect();
          
          overlay.style.display = 'block';
          overlay.style.left = rect.left + 'px';
          overlay.style.top = rect.top + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
        }

        // Hide overlay
        function hideOverlay() {
          const overlay = document.getElementById('__grok_inspector_overlay__');
          if (overlay) {
            overlay.style.display = 'none';
          }
        }

        // Event handlers
        function handleMouseOver(event) {
          if (!isInspecting) return;
          
          event.preventDefault();
          event.stopPropagation();

          // Update overlay to highlight the hovered element
          updateOverlay(event.target);

          // Also send message to parent for debug purposes
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
          
          // Hide the overlay when mouse leaves element
          hideOverlay();
          
          window.parent.postMessage({
            type: 'GROK_INSPECT_LEAVE'
          }, '*');
        }

        function handleClick(event) {
          if (!isInspecting) return;
          
          event.preventDefault();
          event.stopPropagation();

          console.log('[GROK] Click detected on element type:', event.target.tagName);

          const framework = detectFramework();
          const domNode = getDOMNodeInfo(event.target);
          let component = null;

          console.log('[GROK] Framework detected:', framework);
          console.log('[GROK] DOM node info - tag:', domNode.tagName, 'classes:', domNode.classList);

          if (framework.type === 'react') {
            try {
              component = getReactComponentInfo(event.target);
              console.log('[GROK] React component info:', component ? component.componentName : 'none found');
            } catch (error) {
              console.error('[GROK] Error getting React component info:', error.message);
            }
          }
          // Add other framework component detection here

          const result = {
            type: 'GROK_INSPECT_CLICK',
            domNode,
            framework,
            component
          };

          console.log('[GROK] Sending inspection result:', {
            type: result.type,
            domNodeTag: result.domNode.tagName,
            frameworkType: result.framework.type,
            hasComponent: !!result.component
          });

          window.parent.postMessage(result, '*');
        }

        // Start/stop inspection
        window.addEventListener('message', (event) => {
          if (event.data.type === 'GROK_START_INSPECTION') {
            console.log('[GROK] Starting inspection mode');
            isInspecting = true;
            document.addEventListener('mouseover', handleMouseOver, true);
            document.addEventListener('mouseout', handleMouseOut, true);
            document.addEventListener('click', handleClick, true);
            document.body.style.cursor = 'crosshair';
            
            // Create overlay if it doesn't exist
            getOverlay();
          } else if (event.data.type === 'GROK_STOP_INSPECTION') {
            console.log('[GROK] Stopping inspection mode');
            isInspecting = false;
            document.removeEventListener('mouseover', handleMouseOver, true);
            document.removeEventListener('mouseout', handleMouseOut, true);
            document.removeEventListener('click', handleClick, true);
            document.body.style.cursor = '';
            
            // Hide and clean up overlay
            hideOverlay();
          }
        });

        // Signal that the script is ready
        console.log('[GROK] Inspector script ready, sending ready message');
        window.parent.postMessage({
          type: 'GROK_INSPECTOR_READY',
          framework: detectFramework()
        }, '*');
        
        // Auto-start inspection if parent is already in inspection mode
        setTimeout(() => {
          window.parent.postMessage({
            type: 'GROK_REQUEST_INSPECTION_STATE'
          }, '*');
        }, 100);
      })();
    `;

    console.log('[GROK] IframeInspector - Injecting script into iframe');

    // Test if we can access the iframe document
    try {
      const doc = this.iframe.contentDocument;
      console.log('[GROK] IframeInspector - Can access iframe document:', !!doc);
      console.log('[GROK] IframeInspector - Document readyState:', doc?.readyState);
      console.log('[GROK] IframeInspector - Document URL:', doc?.URL);
    } catch (e) {
      const error = e as Error;
      console.log('[GROK] IframeInspector - Cannot access iframe document (CORS):', error.message);
    }

    // Try multiple injection strategies
    let injectionSuccess = false;

    // Strategy 1: Use Electron helper if available
    const electronHelper = (window as any).electronIframeHelper;
    if (electronHelper) {
      console.log('[GROK] IframeInspector - Trying Electron helper injection');
      if (electronHelper.canAccessIframe(this.iframe)) {
        console.log('[GROK] IframeInspector - Electron can access iframe');
        injectionSuccess = electronHelper.injectScript(this.iframe, script);
        if (injectionSuccess) {
          console.log('[GROK] IframeInspector - Script injected successfully via Electron helper');
        }
      } else {
        console.log('[GROK] IframeInspector - Electron cannot access iframe, trying executeScript');
        injectionSuccess = electronHelper.executeScript(this.iframe, script);
        if (injectionSuccess) {
          console.log('[GROK] IframeInspector - Script executed successfully via Electron helper');
        }
      }
    }

    // Strategy 2: Direct DOM injection (works for same-origin)
    if (!injectionSuccess) {
      try {
        const doc = this.iframe.contentDocument;
        if (doc) {
          console.log('[GROK] IframeInspector - Injecting via DOM');
          const scriptElement = doc.createElement('script');
          scriptElement.textContent = script;
          doc.head.appendChild(scriptElement);
          console.log('[GROK] IframeInspector - Script injected successfully via DOM');
          injectionSuccess = true;
        }
      } catch (e) {
        const error = e as Error;
        console.warn('[GROK] IframeInspector - Could not inject script via DOM (this is normal for CORS):', error.message);
      }
    }

    // Strategy 3: Try to execute script via iframe's eval (if same-origin)
    if (!injectionSuccess) {
      try {
        (this.iframe.contentWindow as any)?.eval?.(script);
        console.log('[GROK] IframeInspector - Script injected via eval');
        injectionSuccess = true;
      } catch (e) {
        const error = e as Error;
        console.warn('[GROK] IframeInspector - Could not inject via eval:', error.message);
      }
    }

    // Strategy 4: PostMessage (requires the iframe to listen - which it probably doesn't)
    if (!injectionSuccess) {
      console.log('[GROK] IframeInspector - Trying postMessage injection (likely won\'t work)');
      this.iframe.contentWindow.postMessage({
        type: 'GROK_INJECT_SCRIPT',
        script
      }, '*');
    }

    if (!injectionSuccess) {
      console.error('[GROK] IframeInspector - Could not inject inspection script. This app may be cross-origin.');
      console.log('[GROK] IframeInspector - For cross-origin iframes, you may need to add inspection capabilities to the target app itself.');
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
  
  // Debug method to test iframe access
  public testIframeAccess(): boolean {
    if (!this.iframe) {
      console.log('[GROK] IframeInspector - No iframe set');
      return false;
    }
    
    try {
      const doc = this.iframe.contentDocument;
      const win = this.iframe.contentWindow;
      console.log('[GROK] IframeInspector - Iframe access test:', {
        hasDocument: !!doc,
        hasWindow: !!win,
        docReady: doc?.readyState,
        // Don't log iframe element or access URL/origin - causes circular refs
        iframeSrc: this.iframe.src
      });
      return !!doc && !!win;
    } catch (e) {
      const error = e as Error;
      console.log('[GROK] IframeInspector - Cannot access iframe:', error.message);
      return false;
    }
  }
}
