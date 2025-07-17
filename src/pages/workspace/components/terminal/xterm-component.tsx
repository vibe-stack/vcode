import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { useTerminalStore } from '@/stores/terminal';
import 'xterm/css/xterm.css';

interface XTerminalProps {
  terminalId: string;
  isActive: boolean;
  onWrite: (data: string) => void;
  className?: string;
  layoutVersion?: number; // Used to trigger refit when layout changes
}

export function XTerminal({ terminalId, isActive, onWrite, className, layoutVersion }: XTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { removeTab, removeSplit, getActiveTab, getTabSplits } = useTerminalStore();

  // Initialize terminal only once per terminalId
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Create terminal instance with VSCode-like theme
    const terminal = new Terminal({
      theme: {
        background: '#000000', // VSCode dark theme background
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

    // Open terminal in DOM
    terminal.open(terminalRef.current);

    // Handle resize
    terminal.onResize(({ cols, rows }) => {
      window.terminalApi?.resize(terminalId, cols, rows);
    });

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Wait for terminal to be fully initialized before fitting
    setTimeout(() => {
      if (fitAddonRef.current && terminalRef.current) {
        try {
          fitAddonRef.current.fit();
          setIsInitialized(true);
        } catch (error) {
          console.warn('Failed to fit terminal:', error);
        }
      }
    }, 100);

    return () => {
      if (terminal) {
        terminal.dispose();
      }
      xtermRef.current = null;
      fitAddonRef.current = null;
      setIsInitialized(false);
    };
  }, [terminalId]); // Only depend on terminalId

  // Handle user input - separate effect to manage the data listener properly
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
      if (data.terminalId === terminalId && xtermRef.current) {
        xtermRef.current.write(`\r\n\x1b[31m[Process exited with code ${data.exitCode}]\x1b[0m\r\n`);
        
        // Clean up terminal from store
        // First check if this is a main tab terminal
        const activeTab = getActiveTab();
        const isMainTerminal = activeTab?.id === terminalId;
        
        if (isMainTerminal) {
          // This is a main tab terminal, remove the entire tab
          removeTab(terminalId);
        } else {
          // This might be a split terminal, find which tab it belongs to
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

  // Handle resize when container size changes or when becoming active
  useEffect(() => {
    if (!isInitialized || !fitAddonRef.current) return;

    const handleResize = () => {
      if (fitAddonRef.current) {
        // Small delay to ensure container has finished resizing
        setTimeout(() => {
          try {
            fitAddonRef.current?.fit();
          } catch (error) {
            console.warn('Failed to fit terminal on resize:', error);
          }
        }, 100);
      }
    };

    // Create a ResizeObserver to watch the terminal container
    let resizeObserver: ResizeObserver | null = null;
    if (terminalRef.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(terminalRef.current);
    }

    window.addEventListener('resize', handleResize);
    
    // Also fit when becoming active or when initialized
    if (isActive || isInitialized) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (error) {
          console.warn('Failed to fit terminal on activate:', error);
        }
      }, 100);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isActive, isInitialized]);

  // Handle focus when active
  useEffect(() => {
    if (isActive && xtermRef.current && isInitialized) {
      xtermRef.current.focus();
    }
  }, [isActive, isInitialized]);

  // Fit terminal when layout might have changed
  useEffect(() => {
    if (isInitialized && fitAddonRef.current) {
      const timer = setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (error) {
          console.warn('Failed to fit terminal on layout change:', error);
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, layoutVersion]);

  return (
    <div 
      ref={terminalRef} 
      className={`h-full w-full ${className || ''}`}
      style={{ 
        backgroundColor: '#1e1e1e', // Match terminal background
        overflow: 'hidden' // Prevent scrollbars
      }}
    />
  );
}
