/**
 * Electron-optimized iframe inspector that bypasses CORS restrictions
 */

import { IframeInspector, IframeInspectionData } from './iframe-inspector';

export class ElectronIframeInspector extends IframeInspector {
  
  protected injectInspectionScript() {
    if (!this.iframe?.contentWindow) {
      console.log('[GROK] ElectronIframeInspector - No iframe content window available');
      return;
    }

    console.log('[GROK] ElectronIframeInspector - Injecting inspection script with Electron bypass');
    console.log('[GROK] ElectronIframeInspector - Iframe URL:', this.iframe.src);
    console.log('[GROK] ElectronIframeInspector - Document ready state:', this.iframe.contentDocument?.readyState);

    const script = `
      (function() {
        console.log('[GROK] Electron inspection script starting execution...');
        console.log('[GROK] Current URL:', window.location.href);
        console.log('[GROK] Document ready state:', document.readyState);
        
        // Wait for document to be fully loaded
        function waitForReady(callback) {
          if (document.readyState === 'complete') {
            callback();
          } else {
            window.addEventListener('load', callback);
          }
        }
        
        waitForReady(function() {
          console.log('[GROK] Document is ready, starting inspector setup');
          
          if (window.__GROK_INSPECTOR_INJECTED__) {
            console.log('[GROK] Inspector already injected, skipping');
            return;
          }
          
          console.log('[GROK] Setting up Electron-optimized inspector...');
          window.__GROK_INSPECTOR_INJECTED__ = true;

          let isInspecting = false;
          let currentHighlight = null;

          // Framework detection (same as before)
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
                framework.version = 'Next.js';
              }
              
              console.log('[GROK] Detected React framework:', framework);
            }

            console.log('[GROK] Final framework detection result:', framework);
            return framework;
          }

          // Enhanced React component introspection for Electron
          function getReactComponentInfo(element) {
            if (!element) return null;

            console.log('[GROK] Starting React component detection for element:', element);

            let fiber = null;

            // Method 1: Check for React 18+ fiber keys (more thorough)
            const allKeys = Object.keys(element);
            console.log('[GROK] Element keys:', allKeys.filter(k => k.includes('react')));
            
            const fiberKeys = allKeys.filter(key => 
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

            // Method 3: Check React DevTools global hook (Electron-safe)
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

            // Method 4: Search parent elements (more aggressive in Electron)
            if (!fiber) {
              let parent = element.parentElement;
              let depth = 0;
              while (parent && !fiber && depth < 20) { // Increased depth for Electron
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
            
            while (componentFiber && searchDepth < 30) { // Increased depth for better detection
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
            }

            return component;
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

            console.log('[GROK] Mouse over element:', event.target.tagName);

            // Update overlay to highlight the hovered element
            updateOverlay(event.target);

            // Also send message to parent for external highlight
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

            console.log('[GROK] Click detected on element:', event.target.tagName, event.target.className);

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
              hasComponent: !!result.component,
              componentName: result.component?.componentName
            });

            window.parent.postMessage(result, '*');

            // Flash the highlight to show selection
            const overlay = getOverlay();
            const originalBorder = overlay.style.borderColor;
            overlay.style.borderColor = '#22c55e';
            overlay.style.background = 'rgba(34, 197, 94, 0.2)';
            
            setTimeout(() => {
              overlay.style.borderColor = originalBorder;
              overlay.style.background = 'rgba(59, 130, 246, 0.3)';
            }, 300);
          }

          // Start/stop inspection message handlers
          window.addEventListener('message', (event) => {
            if (event.data.type === 'GROK_START_INSPECTION') {
              console.log('[GROK] Starting inspection mode via message');
              isInspecting = true;
              document.addEventListener('mouseover', handleMouseOver, true);
              document.addEventListener('mouseout', handleMouseOut, true);
              document.addEventListener('click', handleClick, true);
              document.body.style.cursor = 'crosshair';
              
              // Create overlay if it doesn't exist
              getOverlay();
              
              console.log('[GROK] Inspection mode active - event listeners attached');
            } else if (event.data.type === 'GROK_STOP_INSPECTION') {
              console.log('[GROK] Stopping inspection mode via message');
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
          console.log('[GROK] Electron inspector script ready, sending ready message');
          try {
            window.parent.postMessage({
              type: 'GROK_INSPECTOR_READY',
              framework: detectFramework()
            }, '*');
          } catch (e) {
            console.log('[GROK] Could not send ready message (this may be normal):', e);
          }

          // Auto-request inspection state from parent
          setTimeout(() => {
            try {
              window.parent.postMessage({
                type: 'GROK_REQUEST_INSPECTION_STATE'
              }, '*');
            } catch (e) {
              console.log('[GROK] Could not request inspection state:', e);
            }
          }, 100);
        });
      })();
    `;

    // Try Electron-specific injection methods
    let injectionSuccess = false;

    // Strategy 1: Direct DOM injection (should work in Electron with webSecurity: false)
    try {
      const doc = this.iframe.contentDocument;
      if (doc) {
        console.log('[GROK] ElectronIframeInspector - Injecting via DOM');
        const scriptElement = doc.createElement('script');
        scriptElement.textContent = script;
        (doc.head || doc.body || doc.documentElement).appendChild(scriptElement);
        console.log('[GROK] ElectronIframeInspector - Script injected successfully via DOM');
        injectionSuccess = true;
      }
    } catch (e) {
      const error = e as Error;
      console.warn('[GROK] ElectronIframeInspector - Could not inject script via DOM:', error.message);
    }

    // Strategy 2: Use Electron's executeJavaScript if available
    if (!injectionSuccess && (this.iframe as any).executeJavaScript) {
      try {
        (this.iframe as any).executeJavaScript(script);
        console.log('[GROK] ElectronIframeInspector - Script injected via executeJavaScript');
        injectionSuccess = true;
      } catch (e) {
        const error = e as Error;
        console.warn('[GROK] ElectronIframeInspector - Could not inject via executeJavaScript:', error.message);
      }
    }

    // Strategy 3: Try eval injection
    if (!injectionSuccess) {
      try {
        const contentWindow = this.iframe.contentWindow as any;
        if (contentWindow && contentWindow.eval) {
          contentWindow.eval(script);
          console.log('[GROK] ElectronIframeInspector - Script injected via eval');
          injectionSuccess = true;
        }
      } catch (e) {
        const error = e as Error;
        console.warn('[GROK] ElectronIframeInspector - Could not inject via eval:', error.message);
      }
    }

    if (!injectionSuccess) {
      console.error('[GROK] ElectronIframeInspector - Could not inject inspection script');
      // Fall back to parent class implementation
      console.log('[GROK] ElectronIframeInspector - Falling back to parent implementation');
      super.injectInspectionScript();
      return;
    }

    // Start inspection mode with longer timeout for Electron
    setTimeout(() => {
      console.log('[GROK] ElectronIframeInspector - Starting inspection mode');
      this.iframe?.contentWindow?.postMessage({
        type: 'GROK_START_INSPECTION'
      }, '*');
    }, 1500); // Even longer timeout for Electron
  }
}
