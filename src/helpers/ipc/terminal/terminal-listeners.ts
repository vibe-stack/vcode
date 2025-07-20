import { ipcMain, BrowserWindow } from 'electron';
import * as nodePty from 'node-pty';
import * as os from 'os';
import {
  TERMINAL_CREATE_CHANNEL,
  TERMINAL_WRITE_CHANNEL,
  TERMINAL_RESIZE_CHANNEL,
  TERMINAL_KILL_CHANNEL,
  TERMINAL_KILL_ALL_CHANNEL,
  TERMINAL_LIST_CHANNEL,
  TERMINAL_DATA_EVENT,
  TERMINAL_EXIT_EVENT,
  TERMINAL_ERROR_EVENT,
  TERMINAL_COMMAND_RESULT_EVENT
} from './terminal-channels';

const spawn = nodePty.spawn;
type IPty = typeof nodePty.spawn extends (...args: any[]) => infer R ? R : never;

interface PendingCommand {
  id: string;
  output: string;
  startTime: number;
  isActive: boolean;
}

interface TerminalInstance {
  id: string;
  pty: IPty;
  cwd: string;
  title: string;
  pid: number;
  windowId: number;
  pendingCommands: Map<string, PendingCommand>;
  currentCommand: PendingCommand | null;
}

const terminals = new Map<string, TerminalInstance>();
let mainWindow: BrowserWindow | null = null;

// Get the appropriate shell based on OS
function getShell(): string {
  const platform = os.platform();
  
  if (platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  } else if (platform === 'darwin') {
    return process.env.SHELL || '/bin/zsh';
  } else {
    return process.env.SHELL || '/bin/bash';
  }
}

// Generate unique terminal ID
function generateTerminalId(): string {
  return `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to detect when a command has finished
function isCommandFinished(latestData: string, fullOutput: string): boolean {
  // Look for common shell prompt patterns that indicate command completion
  const promptPatterns = [
    /\$\s*$/,           // Basic $ prompt
    /%\s*$/,            // Zsh % prompt  
    />\s*$/,            // Windows > prompt
    /[#$%>]\s*$/,       // Any of the common prompt endings
    /~\s*[#$%>]\s*$/,   // Prompt with ~ (home directory)
    /.*[#$%>]\s*$/      // Any path ending with prompt symbol
  ];

  // Split into lines and check the last non-empty line
  const lines = latestData.split(/\r?\n/);
  const lastLine = lines[lines.length - 1] || '';
  
  // Check if the last line contains a prompt pattern
  return promptPatterns.some(pattern => pattern.test(lastLine));
}

export function addTerminalEventListeners(window: BrowserWindow): void {
  mainWindow = window;

  // Create new terminal
  ipcMain.handle(TERMINAL_CREATE_CHANNEL, async (_, options?: { cwd?: string; title?: string }) => {
    try {
      const terminalId = generateTerminalId();
      const shell = getShell();
      const cwd = options?.cwd || process.cwd();
      const title = options?.title || 'Terminal';

      const pty = spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: cwd,
        env: {
          ...process.env,
          TERM: 'xterm-color',
          COLORTERM: 'truecolor',
        },
        encoding: 'utf8',
      });

      const terminal: TerminalInstance = {
        id: terminalId,
        pty,
        cwd,
        title,
        pid: pty.pid,
        windowId: window.id,
        pendingCommands: new Map(),
        currentCommand: null
      };

      terminals.set(terminalId, terminal);

      // Handle data from terminal
      pty.onData((data: string) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(TERMINAL_DATA_EVENT, {
            terminalId,
            data
          });
        }

        // Track command output if there's a current command
        if (terminal.currentCommand && terminal.currentCommand.isActive) {
          terminal.currentCommand.output += data;
          
          // Check if command has finished (look for shell prompt patterns)
          if (isCommandFinished(data, terminal.currentCommand.output)) {
            const command = terminal.currentCommand;
            terminal.currentCommand.isActive = false;
            
            // Send command result
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send(TERMINAL_COMMAND_RESULT_EVENT, {
                terminalId,
                commandId: command.id,
                result: command.output,
                exitCode: 0 // We'll get the real exit code from the command parsing
              });
            }
            
            // Clean up
            terminal.pendingCommands.delete(command.id);
            terminal.currentCommand = null;
          }
        }
      });

      // Handle terminal exit
      pty.onExit((exitCode: { exitCode: number; signal?: number }) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(TERMINAL_EXIT_EVENT, {
            terminalId,
            exitCode: exitCode.exitCode
          });
        }
        terminals.delete(terminalId);
      });

      return {
        id: terminalId,
        title,
        cwd,
        pid: pty.pid
      };
    } catch (error) {
      console.error('Failed to create terminal:', error);
      throw new Error(`Failed to create terminal: ${(error as Error).message}`);
    }
  });

  // Write to terminal
  ipcMain.handle(TERMINAL_WRITE_CHANNEL, async (_, terminalId: string, data: string, commandId?: string) => {
    try {
      const terminal = terminals.get(terminalId);
      if (!terminal) {
        throw new Error(`Terminal ${terminalId} not found`);
      }

      // If a commandId is provided, start tracking this command
      if (commandId) {
        const pendingCommand: PendingCommand = {
          id: commandId,
          output: '',
          startTime: Date.now(),
          isActive: true
        };
        
        terminal.pendingCommands.set(commandId, pendingCommand);
        terminal.currentCommand = pendingCommand;
      }

      terminal.pty.write(data);
      return true;
    } catch (error) {
      console.error('Failed to write to terminal:', error);
      throw new Error(`Failed to write to terminal: ${(error as Error).message}`);
    }
  });

  // Resize terminal
  ipcMain.handle(TERMINAL_RESIZE_CHANNEL, async (_, terminalId: string, cols: number, rows: number) => {
    try {
      const terminal = terminals.get(terminalId);
      if (!terminal) {
        throw new Error(`Terminal ${terminalId} not found`);
      }

      terminal.pty.resize(cols, rows);
      return true;
    } catch (error) {
      console.error('Failed to resize terminal:', error);
      throw new Error(`Failed to resize terminal: ${(error as Error).message}`);
    }
  });

  // Kill specific terminal
  ipcMain.handle(TERMINAL_KILL_CHANNEL, async (_, terminalId: string) => {
    try {
      const terminal = terminals.get(terminalId);
      if (!terminal) {
        throw new Error(`Terminal ${terminalId} not found`);
      }

      terminal.pty.kill();
      terminals.delete(terminalId);
      return true;
    } catch (error) {
      console.error('Failed to kill terminal:', error);
      throw new Error(`Failed to kill terminal: ${(error as Error).message}`);
    }
  });

  // Kill all terminals
  ipcMain.handle(TERMINAL_KILL_ALL_CHANNEL, async () => {
    try {
      const terminalsToKill = Array.from(terminals.values());
      
      for (const terminal of terminalsToKill) {
        try {
          terminal.pty.kill();
        } catch (error) {
          console.error(`Failed to kill terminal ${terminal.id}:`, error);
        }
      }
      
      terminals.clear();
      return true;
    } catch (error) {
      console.error('Failed to kill all terminals:', error);
      throw new Error(`Failed to kill all terminals: ${(error as Error).message}`);
    }
  });

  // List all terminals
  ipcMain.handle(TERMINAL_LIST_CHANNEL, async () => {
    try {
      return Array.from(terminals.values()).map(terminal => ({
        id: terminal.id,
        title: terminal.title,
        cwd: terminal.cwd,
        pid: terminal.pid
      }));
    } catch (error) {
      console.error('Failed to list terminals:', error);
      throw new Error(`Failed to list terminals: ${(error as Error).message}`);
    }
  });

  // Clean up terminals when window closes
  window.on('closed', () => {
    const terminalsToKill = Array.from(terminals.values()).filter(t => t.windowId === window.id);
    terminalsToKill.forEach(terminal => {
      try {
        terminal.pty.kill();
        terminals.delete(terminal.id);
      } catch (error) {
        console.error(`Failed to cleanup terminal ${terminal.id}:`, error);
      }
    });
  });
}

// Cleanup function for app shutdown
export function cleanupTerminals() {
  const terminalsToKill = Array.from(terminals.values());
  terminalsToKill.forEach(terminal => {
    try {
      terminal.pty.kill();
    } catch (error) {
      console.error(`Failed to cleanup terminal ${terminal.id}:`, error);
    }
  });
  terminals.clear();
}
