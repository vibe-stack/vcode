import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { useTerminalStore } from '@/stores/terminal';
import { terminalRegistry } from './terminal-registry';
import 'xterm/css/xterm.css';

interface RegistryXTerminalProps {
  terminalId: string;
  isActive: boolean;
  onWrite: (data: string) => void;
  className?: string;
}

export function RegistryXTerminal({ terminalId, isActive, onWrite, className }: RegistryXTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { removeTab, removeSplit, getActiveTab, getTabSplits } = useTerminalStore();

  // Initialize terminal and register it
  useEffect(() => {
    if (!terminalRef.current) return;

    // Check if this terminal already exists in registry
    const existingTerminal = terminalRegistry.getTerminal(terminalId);
    if (existingTerminal && existingTerminal.terminalInstance) {
      // Terminal already exists, just move its DOM element here
      if (existingTerminal.domElement) {
        terminalRef.current.appendChild(existingTerminal.domElement);
        xtermRef.current = existingTerminal.terminalInstance;
        fitAddonRef.current = existingTerminal.terminalInstance._fitAddon; // Store fit addon reference
        setIsInitialized(true);
        
        // Fit the terminal to new container
        if (fitAddonRef.current) {
          setTimeout(() => {
            fitAddonRef.current?.fit();
          }, 100);
        }
      }
      return;
    }

    // Create new terminal instance
    const terminal = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#cccccc',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#3e3e3e',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Monaco", "Menlo", "Ubuntu Mono", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      letterSpacing: 0,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
      allowProposedApi: true
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const unicode11Addon = new Unicode11Addon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.loadAddon(unicode11Addon);

    // Activate unicode support
    terminal.unicode.activeVersion = '11';

    // Create a container for the terminal
    const terminalContainer = document.createElement('div');
    terminalContainer.style.width = '100%';
    terminalContainer.style.height = '100%';
    
    // Open terminal in the container
    terminal.open(terminalContainer);

    // Append to our ref
    terminalRef.current.appendChild(terminalContainer);

    // Handle resize
    terminal.onResize(({ cols, rows }) => {
      window.terminalApi?.resize(terminalId, cols, rows);
    });

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    (terminal as any)._fitAddon = fitAddon; // Store for registry access

    // Register the terminal
    terminalRegistry.createTerminal(terminalId);
    terminalRegistry.setTerminalElement(terminalId, terminalContainer, terminal);

    // Wait for terminal to be fully initialized before fitting
    setTimeout(() => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
          setIsInitialized(true);
        } catch (error) {
          console.warn('Failed to fit terminal:', error);
        }
      }
    }, 100);

    // Cleanup only when component unmounts (not when terminal moves)
    return () => {
      // Don't dispose here - let the registry handle cleanup
      // This allows terminals to persist across component unmounts
    };
  }, [terminalId]);

  // Handle user input
  useEffect(() => {
    if (!xtermRef.current) return;

    const disposable = xtermRef.current.onData(data => {
      onWrite(data);
    });

    return () => {
      disposable.dispose();
    };
  }, [onWrite]);

  // Handle data from backend
  useEffect(() => {
    const unsubscribeData = window.terminalApi.onData((data) => {
      if (data.terminalId === terminalId && xtermRef.current) {
        xtermRef.current.write(data.data);
      }
    });

    const unsubscribeExit = window.terminalApi.onExit((data) => {
      if (data.terminalId === terminalId) {
        if (xtermRef.current) {
          xtermRef.current.write(`\r\n\x1b[31m[Process exited with code ${data.exitCode}]\x1b[0m\r\n`);
        }
        
        // Remove from registry and store
        terminalRegistry.removeTerminal(terminalId);
        
        const activeTab = getActiveTab();
        const isMainTerminal = activeTab?.id === terminalId;
        
        if (isMainTerminal) {
          removeTab(terminalId);
        } else {
          const allTabs = useTerminalStore.getState().tabs;
          for (const tab of allTabs) {
            const splits = getTabSplits(tab.id);
            const split = splits.find(s => s.terminalId === terminalId);
            if (split) {
              removeSplit(tab.id, split.id);
              break;
            }
          }
        }
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeExit();
    };
  }, [terminalId, removeTab, removeSplit, getActiveTab, getTabSplits]);

  // Handle focus
  useEffect(() => {
    if (isActive && xtermRef.current && isInitialized) {
      xtermRef.current.focus();
      
      // Refit when becoming active
      if (fitAddonRef.current) {
        setTimeout(() => {
          fitAddonRef.current?.fit();
        }, 50);
      }
    }
  }, [isActive, isInitialized]);

  return (
    <div 
      ref={terminalRef}
      className={className || "h-full w-full"}
      style={{ position: 'relative' }}
    />
  );
}
