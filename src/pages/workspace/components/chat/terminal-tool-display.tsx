import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import 'xterm/css/xterm.css';

interface TerminalToolDisplayProps {
  terminalId: string;
  command: string;
  cwd?: string;
  state: 'call' | 'result' | string;
  onCancel?: () => void;
}

export function TerminalToolDisplay({ terminalId, command, cwd, state, onCancel }: TerminalToolDisplayProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasExited, setHasExited] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);

  // Initialize read-only terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    console.log('[TerminalToolDisplay] Initializing read-only XTerm for terminal:', terminalId);

    // Create terminal instance with VSCode-like theme
    const terminal = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
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
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 12,
      fontWeight: 'normal',
      fontWeightBold: 'bold',
      lineHeight: 1.2,
      letterSpacing: 0,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      rows: 12,
      cols: 80,
      allowProposedApi: true,
      disableStdin: true, // Make terminal read-only
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const unicode11Addon = new Unicode11Addon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.loadAddon(unicode11Addon);
    terminal.unicode.activeVersion = '11';

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    setIsInitialized(true);

    // Write the command prompt initially
    terminal.write(`$ ${command}\r\n`);

    console.log('[TerminalToolDisplay] Read-only XTerm initialized successfully');

    return () => {
      console.log('[TerminalToolDisplay] Cleaning up XTerm');
      terminal.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      setIsInitialized(false);
    };
  }, [terminalId, command]);

  // Listen for terminal data and write to XTerm
  useEffect(() => {
    if (!isInitialized || !xtermRef.current) return;

    console.log('[TerminalToolDisplay] Setting up data listener for terminal:', terminalId);

    const unsubscribeData = window.terminalApi.onData((data) => {
      if (data.terminalId === terminalId && xtermRef.current) {
        console.log('[TerminalToolDisplay] Writing data to XTerm:', data.data.substring(0, 50), '...');
        xtermRef.current.write(data.data);
      }
    });

    const unsubscribeExit = window.terminalApi.onExit((data) => {
      if (data.terminalId === terminalId && xtermRef.current) {
        console.log('[TerminalToolDisplay] Terminal exited with code:', data.exitCode);
        setHasExited(true);
        setExitCode(data.exitCode);
        xtermRef.current.write(`\r\n\x1b[${data.exitCode === 0 ? '32' : '31'}m[Process exited with code ${data.exitCode}]\x1b[0m\r\n`);
      }
    });

    const unsubscribeError = window.terminalApi.onError((data) => {
      if (data.terminalId === terminalId && xtermRef.current) {
        console.log('[TerminalToolDisplay] Terminal error:', data.error);
        xtermRef.current.write(`\r\n\x1b[31m[Error: ${data.error}]\x1b[0m\r\n`);
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeExit();
      unsubscribeError();
    };
  }, [terminalId, isInitialized]);

  // Fit terminal when state changes
  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 100);
    }
  }, [state]);

  const getStatusIcon = () => {
    if (state === 'result' || hasExited) {
      if (exitCode === 0) {
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      } else if (exitCode !== null && exitCode !== 0) {
        return <XCircle className="h-3 w-3 text-red-500" />;
      }
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
  };

  const getStatusText = () => {
    if (state === 'result' || hasExited) {
      if (exitCode === 0) {
        return 'done';
      } else if (exitCode !== null && exitCode !== 0) {
        return `error (${exitCode})`;
      }
      return 'done';
    }
    return 'executing...';
  };

  const isRunning = state === 'call' && !hasExited;

  return (
    <div className="border border-gray-600 rounded-lg bg-[#1e1e1e] text-gray-200 overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-[#2d2d2d] px-3 py-2 border-b border-gray-600">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-gray-400 truncate text-xs">
            Agent Terminal: {command.slice(0, 30)}{command.length > 30 ? '...' : ''}
          </span>
          {cwd && (
            <span className="text-gray-500 text-xs">
              • {cwd.split('/').pop()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="text-xs text-gray-400">{getStatusText()}</span>
          </div>
          {isRunning && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-red-500/20"
              onClick={onCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* XTerm Terminal */}
      <div 
        ref={terminalRef}
        className="bg-[#1e1e1e] h-48 overflow-hidden"
        style={{ height: '192px' }} // Fixed height for consistent display
      />
    </div>
  );
}
