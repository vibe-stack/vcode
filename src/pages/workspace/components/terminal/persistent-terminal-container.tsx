import React, { useEffect, useRef } from 'react';
import { terminalRegistry } from './terminal-registry';
import { useTerminalStore } from '@/stores/terminal';

interface PersistentTerminalContainerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PersistentTerminalContainer: React.FC<PersistentTerminalContainerProps> = ({ 
  className = "h-full w-full", 
  style 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { tabs, activeTabId, isVisible } = useTerminalStore();

  useEffect(() => {
    if (!containerRef.current) return;

    // Show the active terminal in this container
    if (activeTabId && isVisible) {
      const success = terminalRegistry.showTerminal(activeTabId, containerRef.current);
      
      // If terminal doesn't exist yet, we might need to wait for it to be created
      if (!success) {
        console.warn('Terminal not found in registry:', activeTabId);
      }
    }

    // Hide all other terminals
    tabs.forEach(tab => {
      if (tab.id !== activeTabId) {
        terminalRegistry.hideTerminal(tab.id);
      }
    });

  }, [activeTabId, isVisible, tabs]);

  return (
    <div 
      ref={containerRef}
      className={className}
      style={style}
    />
  );
};

// Hidden container for keeping terminals alive
interface HiddenTerminalContainerProps {}

export const HiddenTerminalContainer: React.FC<HiddenTerminalContainerProps> = () => {
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hiddenContainerRef.current) {
      // Set this as the hidden container in the registry
      terminalRegistry.setContainer(hiddenContainerRef.current);
    }
  }, []);

  return (
    <div 
      ref={hiddenContainerRef}
      style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: '-9999px', 
        width: '1px', 
        height: '1px',
        overflow: 'hidden',
        visibility: 'hidden'
      }}
    />
  );
};
