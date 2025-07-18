import { create } from 'zustand';
import { IframeInspectionData, FrameworkInfo } from '@/pages/workspace/components/auto-view/iframe-inspector';
import { parseTerminalOutputForPorts } from '@/pages/workspace/components/auto-view/terminal-content-tracker';

export interface DetectedPort {
  port: number;
  description?: string;
  isActive: boolean;
}

export interface TerminalContent {
  terminalId: string;
  recentOutput: string;
}

// Store recent terminal output to parse for port information
const TERMINAL_CONTENT_MAP = new Map<string, string>();
const MAX_CONTENT_LENGTH = 10000; // Keep last 10KB of content per terminal

// Common development server ports to check
const COMMON_PORTS = [3000, 3001, 8080, 8000, 4200, 5000, 9000, 8888, 3333, 4000, 4321];

export interface AutoViewState {
  // Port detection state
  detectedPorts: DetectedPort[];
  selectedPort: number | null;
  customUrl: string;
  currentUrl: string;
  
  // UI state
  isLoading: boolean;
  loadError: string | null;
  showInspector: boolean;
  showDebug: boolean;
  showChat: boolean;
  
  // Inspector state
  isInspecting: boolean;
  detectedFramework: FrameworkInfo | null;
  selectedNode: IframeInspectionData | null;
  
  // Terminal content tracking
  terminalContents: TerminalContent[];
  
  // Actions
  setSelectedPort: (port: number | null) => void;
  setCustomUrl: (url: string) => void;
  updateCurrentUrl: () => void;
  setIsLoading: (loading: boolean) => void;
  setLoadError: (error: string | null) => void;
  setShowInspector: (show: boolean) => void;
  setShowDebug: (show: boolean) => void;
  setShowChat: (show: boolean) => void;
  setIsInspecting: (inspecting: boolean) => void;
  setDetectedFramework: (framework: FrameworkInfo | null) => void;
  setSelectedNode: (node: IframeInspectionData | null) => void;
  
  // Port detection actions
  checkPort: (port: number) => Promise<boolean>;
  scanPorts: () => Promise<void>;
  refreshPorts: () => Promise<void>;
  getPortsFromTerminals: () => number[];
  
  // Terminal content actions
  updateTerminalContent: (terminalId: string, data: string) => void;
  getPortsFromAllTerminals: () => number[];
  
  // Inspector actions
  toggleInspection: () => void;
  clearSelection: () => void;
  
  // Initialization
  initialize: () => void;
  cleanup: () => void;
}

export const useAutoViewStore = create<AutoViewState>((set, get) => ({
  // Initial state
  detectedPorts: [],
  selectedPort: null,
  customUrl: '',
  currentUrl: '',
  isLoading: true,
  loadError: null,
  showInspector: false,
  showDebug: true,
  showChat: false,
  isInspecting: false,
  detectedFramework: null,
  selectedNode: null,
  terminalContents: [],
  
  // Update current URL based on customUrl and selectedPort
  updateCurrentUrl: () => {
    const state = get();
    const newUrl = state.customUrl || (state.selectedPort ? `http://localhost:${state.selectedPort}` : '');
    set({ currentUrl: newUrl });
  },
  
  // Basic setters
  setSelectedPort: (port) => {
    set((state) => ({
      ...state,
      selectedPort: port,
      // Auto-populate URL when a port is selected and no custom URL is set
      customUrl: port && !state.customUrl ? `http://localhost:${port}` : state.customUrl
    }));
    get().updateCurrentUrl();
  },
  
  setCustomUrl: (url) => {
    set((state) => ({
      ...state,
      customUrl: url
    }));
    get().updateCurrentUrl();
  },
  
  setIsLoading: (loading) => set((state) => ({
    ...state,
    isLoading: loading
  })),
  
  setLoadError: (error) => set((state) => ({
    ...state,
    loadError: error
  })),
  
  setShowInspector: (show) => set((state) => ({
    ...state,
    showInspector: show
  })),
  
  setShowDebug: (show) => set((state) => ({
    ...state,
    showDebug: show
  })),
  
  setShowChat: (show) => set((state) => ({
    ...state,
    showChat: show
  })),
  
  setIsInspecting: (inspecting) => set((state) => ({
    ...state,
    isInspecting: inspecting
  })),
  
  setDetectedFramework: (framework) => set((state) => ({
    ...state,
    detectedFramework: framework
  })),
  
  setSelectedNode: (node) => set((state) => ({
    ...state,
    selectedNode: node,
    // Auto-show inspector when a node is selected
    showInspector: node ? true : state.showInspector
  })),
  
  // Port detection actions
  checkPort: async (port: number): Promise<boolean> => {
    try {
      // Use a simple fetch to check if the port is responsive
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`http://localhost:${port}`, {
        mode: 'no-cors',
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // In no-cors mode, any response (even opaque) means the server is running
      return true;
    } catch (error) {
      // Network error or timeout means port is not active
      return false;
    }
  },
  
  getPortsFromTerminals: (): number[] => {
    return get().getPortsFromAllTerminals();
  },
  
  scanPorts: async () => {
    const state = get();
    // Get ports from terminal output
    const terminalPorts = state.getPortsFromAllTerminals();
    
    // Always check common ports in addition to terminal-detected ports
    const commonPortsToCheck = [3000, 8080, 5000, 4200, 3001, 9000];
    const portsToCheck = [...new Set([...terminalPorts, ...commonPortsToCheck])];
    
    console.log('[GROK] AutoView Store - Scanning ports:', portsToCheck);
    
    const activePortsPromises = portsToCheck.map(async (port) => {
      const isActive = await state.checkPort(port);
      console.log(`[GROK] AutoView Store - Port ${port} active:`, isActive);
      return {
        port,
        isActive,
        description: getPortDescription(port, terminalPorts.includes(port))
      };
    });
    
    const allPorts = await Promise.all(activePortsPromises);
    const activePorts = allPorts.filter(p => p.isActive);
    
    console.log('[GROK] AutoView Store - Active ports found:', activePorts);
    
    set((state) => {
      const newState = {
        ...state,
        detectedPorts: activePorts
      };
      
      // Auto-select first detected port if none selected
      if (activePorts.length > 0 && !state.selectedPort) {
        const firstPort = activePorts[0].port;
        console.log('[GROK] AutoView Store - Auto-selecting port:', firstPort);
        newState.selectedPort = firstPort;
        if (!state.customUrl) {
          newState.customUrl = `http://localhost:${firstPort}`;
        }
      }
      
      return newState;
    });
    
    // Update current URL after port detection
    get().updateCurrentUrl();
  },
  
  refreshPorts: async () => {
    await get().scanPorts();
  },
  
  // Terminal content actions
  updateTerminalContent: (terminalId: string, data: string) => {
    // Get existing content or initialize
    const existingContent = TERMINAL_CONTENT_MAP.get(terminalId) || '';
    
    // Append new data and trim if too long
    const updatedContent = (existingContent + data).slice(-MAX_CONTENT_LENGTH);
    
    // Store updated content
    TERMINAL_CONTENT_MAP.set(terminalId, updatedContent);
    
    // Update state
    set((state) => {
      const existing = state.terminalContents.find(tc => tc.terminalId === terminalId);
      if (existing) {
        return {
          ...state,
          terminalContents: state.terminalContents.map(tc => 
            tc.terminalId === terminalId 
              ? { ...tc, recentOutput: updatedContent }
              : tc
          )
        };
      } else {
        return {
          ...state,
          terminalContents: [...state.terminalContents, { terminalId, recentOutput: updatedContent }]
        };
      }
    });
  },
  
  getPortsFromAllTerminals: (): number[] => {
    const allPorts: number[] = [];
    
    // Parse all terminal contents for ports
    Array.from(TERMINAL_CONTENT_MAP.values()).forEach(content => {
      const ports = parseTerminalOutputForPorts(content);
      allPorts.push(...ports);
    });
    
    return [...new Set(allPorts)]; // Remove duplicates
  },
  
  // Inspector actions
  toggleInspection: () => set((state) => {
    const newInspecting = !state.isInspecting;
    console.log('[GROK] AutoView Store - Toggle inspection:', newInspecting);
    return {
      ...state,
      isInspecting: newInspecting
    };
  }),
  
  clearSelection: () => set((state) => ({
    ...state,
    selectedNode: null
  })),
  
  // Initialization and cleanup
  initialize: () => {
    console.log('[GROK] AutoView Store - Initializing...');
    
    // Simulate initial loading
    setTimeout(() => {
      set((state) => ({
        ...state,
        isLoading: false
      }));
    }, 1000);
    
    // Set up terminal content tracking
    if ((window as any).terminalApi?.onData) {
      const unsubscribe = (window as any).terminalApi.onData((data: { terminalId: string; data: string }) => {
        get().updateTerminalContent(data.terminalId, data.data);
      });
      
      // Store unsubscribe function for cleanup
      (get() as any)._terminalUnsubscribe = unsubscribe;
    } else {
      console.warn('Terminal API not available for port detection');
    }
    
    // Initial port scan
    get().scanPorts();
  },
  
  cleanup: () => {
    // Clean up terminal subscription
    const unsubscribe = (get() as any)._terminalUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
    }
    
    // Clear terminal content map
    TERMINAL_CONTENT_MAP.clear();
  }
}));

// Helper function to get port descriptions
function getPortDescription(port: number, isFromTerminal: boolean): string {
  if (isFromTerminal) {
    return 'Detected from terminal';
  }
  
  const descriptions: Record<number, string> = {
    3000: 'React Dev Server',
    3001: 'React Dev Server (Alt)',
    8080: 'HTTP Server',
    8000: 'Python/Django Server',
    4200: 'Angular Dev Server',
    5000: 'Flask/Node Server',
    9000: 'Development Server',
    8888: 'Jupyter Notebook',
    3333: 'Development Server',
    4000: 'Development Server',
    4321: 'Astro Dev Server'
  };
  
  return descriptions[port] || 'Development Server';
}
