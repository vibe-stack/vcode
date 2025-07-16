import { CoreMessage } from "ai";
import { 
  AGENT_SEND_MESSAGE_CHANNEL, 
  AGENT_STREAM_CHUNK_CHANNEL, 
  AGENT_STREAM_END_CHANNEL, 
  AGENT_STREAM_ERROR_CHANNEL,
  AGENT_START_CHANNEL,
  AGENT_STOP_CHANNEL,
  AGENT_PAUSE_CHANNEL,
  AGENT_RESUME_CHANNEL,
  AGENT_STATUS_UPDATE_CHANNEL,
  AGENT_CREATE_WORKTREE_CHANNEL,
  AGENT_DELETE_WORKTREE_CHANNEL,
  AGENT_SWITCH_WORKTREE_CHANNEL,
  AGENT_WORKTREE_STATUS_CHANNEL
} from "./agent-channels";

export interface AgentStatusUpdate {
  taskId: string;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'error';
  workStatus?: 'not-started' | 'in-progress' | 'paused' | 'blocked' | 'testing' | 'finalizing';
  progress?: number;
  currentStep?: string;
  error?: string;
}

export interface AgentWorktreeInfo {
  taskId: string;
  worktreePath: string;
  branchName: string;
  isActive: boolean;
}

export function exposeAgentContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");

  contextBridge.exposeInMainWorld("agents", {
    // Agent messaging
    sendMessage: (payload: { 
      taskId: string; 
      messages: CoreMessage[]; 
      requestId: string; 
    }) => ipcRenderer.invoke(AGENT_SEND_MESSAGE_CHANNEL, payload),
    
    onStreamChunk: (callback: (data: { 
      taskId: string; 
      requestId: string; 
      chunk: Uint8Array; 
    }) => void) => {
      ipcRenderer.on(AGENT_STREAM_CHUNK_CHANNEL, (_event: any, data: any) => callback(data));
    },
    
    onStreamEnd: (callback: (data: { 
      taskId: string; 
      requestId: string; 
    }) => void) => {
      ipcRenderer.on(AGENT_STREAM_END_CHANNEL, (_event: any, data: any) => callback(data));
    },
    
    onStreamError: (callback: (data: { 
      taskId: string; 
      requestId: string; 
      error: string; 
    }) => void) => {
      ipcRenderer.on(AGENT_STREAM_ERROR_CHANNEL, (_event: any, data: any) => callback(data));
    },

    // Agent lifecycle
    startAgent: (taskId: string) => ipcRenderer.invoke(AGENT_START_CHANNEL, { taskId }),
    stopAgent: (taskId: string) => ipcRenderer.invoke(AGENT_STOP_CHANNEL, { taskId }),
    pauseAgent: (taskId: string) => ipcRenderer.invoke(AGENT_PAUSE_CHANNEL, { taskId }),
    resumeAgent: (taskId: string) => ipcRenderer.invoke(AGENT_RESUME_CHANNEL, { taskId }),
    
    onStatusUpdate: (callback: (data: AgentStatusUpdate) => void) => {
      ipcRenderer.on(AGENT_STATUS_UPDATE_CHANNEL, (_event: any, data: any) => callback(data));
    },

    // Git worktree management
    createWorktree: (taskId: string, branchName: string) => 
      ipcRenderer.invoke(AGENT_CREATE_WORKTREE_CHANNEL, { taskId, branchName }),
    
    deleteWorktree: (taskId: string) => 
      ipcRenderer.invoke(AGENT_DELETE_WORKTREE_CHANNEL, { taskId }),
    
    switchWorktree: (taskId: string) => 
      ipcRenderer.invoke(AGENT_SWITCH_WORKTREE_CHANNEL, { taskId }),
    
    onWorktreeStatusChange: (callback: (data: AgentWorktreeInfo) => void) => {
      ipcRenderer.on(AGENT_WORKTREE_STATUS_CHANNEL, (_event: any, data: any) => callback(data));
    },
    
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners(AGENT_STREAM_CHUNK_CHANNEL);
      ipcRenderer.removeAllListeners(AGENT_STREAM_END_CHANNEL);
      ipcRenderer.removeAllListeners(AGENT_STREAM_ERROR_CHANNEL);
      ipcRenderer.removeAllListeners(AGENT_STATUS_UPDATE_CHANNEL);
      ipcRenderer.removeAllListeners(AGENT_WORKTREE_STATUS_CHANNEL);
    }
  });
}
