import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface TerminalToolDisplayProps {
  command: string;
  cwd?: string;
  result?: string;
  state: 'call' | 'result' | string;
  terminalId?: string;
  onCancel?: () => void;
}

export function TerminalToolDisplay({ command, cwd, result, state, terminalId, onCancel }: TerminalToolDisplayProps) {
  const [output, setOutput] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);

  // Listen for terminal output and completion if we have a terminalId
  useEffect(() => {
    if (!terminalId) return;

    let unsubscribeData: (() => void) | null = null;
    let unsubscribeExit: (() => void) | null = null;

    // Only set up listeners if the terminal is still running
    if (state === 'call' || (!isCompleted && !result)) {
      // Listen for output
      unsubscribeData = window.terminalApi.onData((data) => {
        if (data.terminalId === terminalId) {
          setOutput(prev => prev + data.data);
        }
      });

      // Listen for exit
      unsubscribeExit = window.terminalApi.onExit((data) => {
        if (data.terminalId === terminalId) {
          setIsCompleted(true);
          setExitCode(data.exitCode);
          setOutput(prev => prev + `\n[Process exited with code ${data.exitCode}]`);
          
          // Clean up the terminal
          window.terminalApi.kill(terminalId).catch(() => {
            // Ignore cleanup errors
          });
        }
      });
    }

    return () => {
      unsubscribeData?.();
      unsubscribeExit?.();
    };
  }, [terminalId, state, isCompleted, result]);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [output, result]);

  const handleCancel = () => {
    if (terminalId) {
      window.terminalApi.kill(terminalId).catch(() => {
        // Ignore cleanup errors
      });
      setIsCompleted(true);
      setOutput(prev => prev + '\n[Process terminated by user]');
    }
    onCancel?.();
  };

  const getStatusIcon = () => {
    if (state === 'result' || isCompleted) {
      if (exitCode === 0) {
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      } else if (exitCode !== null) {
        return <XCircle className="h-3 w-3 text-red-500" />;
      }
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
  };

  const getStatusText = () => {
    if (state === 'result' || isCompleted) {
      if (exitCode === 0) {
        return 'done';
      } else if (exitCode !== null) {
        return 'error';
      }
      return 'done';
    }
    return 'executing...';
  };

  // Use the collected output or fallback to result
  const displayOutput = output || result || '';

  // Clean up the output for display
  const cleanOutput = (output: string) => {
    if (!output) return '';
    
    // Remove ANSI escape codes for basic color removal
    const cleaned = output
      .replace(/\x1b\[[0-9;]*m/g, '') // Remove basic ANSI color codes
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n'); // Convert remaining \r to \n
    
    return cleaned;
  };

  const isRunning = state === 'call' && !isCompleted;

  return (
    <div className="border border-gray-600 rounded-lg bg-[#1e1e1e] text-gray-200 text-xs font-mono overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-[#2d2d2d] px-3 py-2 border-b border-gray-600">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-gray-400 truncate">
            {cwd ? `${cwd.split('/').pop()}` : 'terminal'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="text-xs text-gray-400">{getStatusText()}</span>
          </div>
          {isRunning && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-red-500/20"
              onClick={handleCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="bg-[#1e1e1e]">
        {/* Command line */}
        <div className="px-3 py-1 border-b border-gray-700">
          <span className="text-green-400">$ </span>
          <span className="text-gray-200">{command}</span>
        </div>

        {/* Output */}
        {displayOutput && (
          <div
            ref={terminalOutputRef}
            className={cn(
              "px-3 py-2 max-h-40 overflow-y-auto",
              "scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
            )}
          >
            <pre className="text-xs whitespace-pre-wrap text-gray-300 leading-relaxed">
              {cleanOutput(displayOutput)}
            </pre>
          </div>
        )}

        {/* Loading state */}
        {isRunning && !displayOutput && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Running command...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
