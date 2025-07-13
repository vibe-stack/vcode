import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import 'xterm/css/xterm.css';

interface XTerminalProps {
  terminalId: string;
  isActive: boolean;
  onWrite: (data: string) => void;
  className?: string;
}

export function XTerminal({ terminalId, isActive, onWrite, className }: XTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize terminal only once per terminalId
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Create terminal instance with VSCode-like theme
    const terminal = new Terminal({
      theme: {
        background: '#1e1e1e', // VSCode dark theme background
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

    // Handle user input
    terminal.onData(data => {
      onWrite(data);
    });

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
  }, [terminalId]); // Only depend on terminalId, not onWrite

  // Handle onWrite callback changes
  useEffect(() => {
    if (xtermRef.current) {
      // Remove previous listener and add new one
      xtermRef.current.onData(data => {
        onWrite(data);
      });
    }
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
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeExit();
    };
  }, [terminalId]);

  // Handle resize when container size changes or when becoming active
  useEffect(() => {
    if (!isInitialized || !fitAddonRef.current) return;

    const handleResize = () => {
      if (fitAddonRef.current && isActive) {
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

    window.addEventListener('resize', handleResize);
    
    // Also fit when becoming active
    if (isActive) {
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
    };
  }, [isActive, isInitialized]);

  // Handle focus when active
  useEffect(() => {
    if (isActive && xtermRef.current && isInitialized) {
      xtermRef.current.focus();
    }
  }, [isActive, isInitialized]);

  return (
    <div 
      ref={terminalRef} 
      className={`h-full w-full ${className || ''}`}
      style={{ 
        backgroundColor: '#1e1e1e', // Match terminal background
        display: isActive ? 'block' : 'none'
      }}
    />
  );
}
