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
} from "./terminal-channels";

export interface TerminalCreateOptions {
  cwd?: string;
  title?: string;
}

export interface TerminalInfo {
  id: string;
  title: string;
  cwd: string;
  pid: number;
}

export interface TerminalDataEvent {
  terminalId: string;
  data: string;
}

export interface TerminalExitEvent {
  terminalId: string;
  exitCode: number;
}

export interface TerminalErrorEvent {
  terminalId: string;
  error: string;
}

export function exposeTerminalContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");

  contextBridge.exposeInMainWorld("terminalApi", {
    // Terminal management
    create: (options?: TerminalCreateOptions) =>
      ipcRenderer.invoke(TERMINAL_CREATE_CHANNEL, options),
    write: (terminalId: string, data: string) =>
      ipcRenderer.invoke(TERMINAL_WRITE_CHANNEL, terminalId, data),
    resize: (terminalId: string, cols: number, rows: number) =>
      ipcRenderer.invoke(TERMINAL_RESIZE_CHANNEL, terminalId, cols, rows),
    kill: (terminalId: string) =>
      ipcRenderer.invoke(TERMINAL_KILL_CHANNEL, terminalId),
    killAll: () => ipcRenderer.invoke(TERMINAL_KILL_ALL_CHANNEL),
    list: (): Promise<TerminalInfo[]> =>
      ipcRenderer.invoke(TERMINAL_LIST_CHANNEL),

    // Event listeners
    onData: (callback: (data: TerminalDataEvent) => void) => {
      const handler = (_: any, data: TerminalDataEvent) => callback(data);
      ipcRenderer.on(TERMINAL_DATA_EVENT, handler);
      return () => ipcRenderer.removeListener(TERMINAL_DATA_EVENT, handler);
    },

    onExit: (callback: (data: TerminalExitEvent) => void) => {
      const handler = (_: any, data: TerminalExitEvent) => callback(data);
      ipcRenderer.on(TERMINAL_EXIT_EVENT, handler);
      return () => ipcRenderer.removeListener(TERMINAL_EXIT_EVENT, handler);
    },

    onError: (callback: (data: TerminalErrorEvent) => void) => {
      const handler = (_: any, data: TerminalErrorEvent) => callback(data);
      ipcRenderer.on(TERMINAL_ERROR_EVENT, handler);
      return () => ipcRenderer.removeListener(TERMINAL_ERROR_EVENT, handler);
    },

    // Cleanup
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners(TERMINAL_DATA_EVENT);
      ipcRenderer.removeAllListeners(TERMINAL_EXIT_EVENT);
      ipcRenderer.removeAllListeners(TERMINAL_ERROR_EVENT);
    },
  });
}
