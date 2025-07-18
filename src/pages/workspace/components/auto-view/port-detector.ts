import { useTerminalStore } from '@/stores/terminal';
import { useEffect, useState } from 'react';
import { useTerminalContentTracker } from './terminal-content-tracker';

export interface DetectedPort {
  port: number;
  description?: string;
  isActive: boolean;
}

// Common development server ports to check (excluding 5173 as it's likely this app)
const COMMON_PORTS = [3000, 3001, 8080, 8000, 4200, 5000, 9000, 8888, 3333, 4000, 4321, 8888];

export const usePortDetector = () => {
  const [detectedPorts, setDetectedPorts] = useState<DetectedPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const { tabs } = useTerminalStore();
  const { getPortsFromAllTerminals } = useTerminalContentTracker();

  // Function to check if a port is accessible
  const checkPort = async (port: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        mode: 'no-cors',
        method: 'GET'
      });
      return true;
    } catch (error) {
      // Silently fail - this is expected for most ports
      return false;
    }
  };

  // Get ports from terminal output
  const getPortsFromTerminals = (): number[] => {
    return getPortsFromAllTerminals();
  };

  // Scan for active ports
  const scanPorts = async () => {
    // Get ports from terminal output
    const terminalPorts = getPortsFromTerminals();
    
    // Only check terminal-detected ports and a few common ones to reduce console errors
    const commonPortsToCheck = terminalPorts.length > 0 ? [] : [3000, 8080, 5000];
    const portsToCheck = [...new Set([...terminalPorts, ...commonPortsToCheck])];
    
    const activePortsPromises = portsToCheck.map(async (port) => {
      const isActive = await checkPort(port);
      return {
        port,
        isActive,
        description: getPortDescription(port, terminalPorts.includes(port))
      };
    });

    const results = await Promise.all(activePortsPromises);
    const activePorts = results.filter(p => p.isActive);
    
    // Sort ports: terminal-detected first, then by port number
    activePorts.sort((a, b) => {
      const aFromTerminal = terminalPorts.includes(a.port);
      const bFromTerminal = terminalPorts.includes(b.port);
      
      if (aFromTerminal && !bFromTerminal) return -1;
      if (!aFromTerminal && bFromTerminal) return 1;
      return a.port - b.port;
    });
    
    setDetectedPorts(activePorts);
    
    // Auto-select the first active port if none selected
    if (activePorts.length > 0 && !selectedPort) {
      setSelectedPort(activePorts[0].port);
    }
  };

  // Get description for common ports
  const getPortDescription = (port: number, fromTerminal: boolean = false): string => {
    const descriptions: Record<number, string> = {
      3000: 'React/Next.js Dev Server',
      3001: 'React Dev Server (Alt)',
      8080: 'Webpack Dev Server',
      8000: 'Python/Django Server',
      4200: 'Angular Dev Server',
      5000: 'Flask/Express Server',
      9000: 'SvelteKit Dev Server',
      8888: 'Jupyter Notebook',
      3333: 'Remix Dev Server',
      4000: 'Development Server',
      4321: 'Astro Dev Server'
    };
    
    const baseDescription = descriptions[port] || 'Development Server';
    return fromTerminal ? `${baseDescription} (detected)` : baseDescription;
  };

  useEffect(() => {
    // Initial scan
    scanPorts();
    
    // Set up periodic scanning
    // const interval = setInterval(scanPorts, 5000); // Check every 5 seconds
    
    // return () => clearInterval(interval);
  }, [selectedPort, tabs.length]); // Re-scan when terminal count changes

  const refreshPorts = () => {
    scanPorts();
  };

  const selectPort = (port: number) => {
    setSelectedPort(port);
  };

  return {
    detectedPorts,
    selectedPort,
    selectPort,
    refreshPorts
  };
};
