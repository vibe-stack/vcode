import {
  AGENT_CREATE_CHANNEL,
  AGENT_LIST_CHANNEL,
  AGENT_GET_CHANNEL,
  AGENT_DELETE_CHANNEL,
  AGENT_START_CHANNEL,
  AGENT_STOP_CHANNEL,
  AGENT_UPDATE_STATUS_CHANNEL,
  AGENT_ADD_MESSAGE_CHANNEL,
  AGENT_GET_MESSAGES_CHANNEL,
  AGENT_GET_PROGRESS_CHANNEL,
  AGENT_IS_RUNNING_CHANNEL,
  AGENT_GET_RUNNING_CHANNEL,
  AGENT_GET_PROJECT_SUMMARY_CHANNEL,
  AGENT_GET_ALL_PROJECTS_CHANNEL,
  AGENT_SWITCH_PROJECT_CHANNEL,
  AGENT_CHECK_FILE_CONFLICTS_CHANNEL,
  AGENT_CLEANUP_INACTIVE_PROJECTS_CHANNEL,
  AGENT_STATUS_CHANGED_EVENT,
  AGENT_STEP_STARTED_EVENT,
  AGENT_STEP_COMPLETED_EVENT,
  AGENT_STEP_FAILED_EVENT,
  AGENT_LOCK_CONFLICT_EVENT,
  AGENT_NEEDS_CLARIFICATION_EVENT,
  AGENT_EXECUTION_COMPLETE_EVENT,
  AGENT_EXECUTION_ABORTED_EVENT,
  AGENT_CREATED_EVENT,
  AGENT_DELETED_EVENT,
  AGENT_MESSAGE_ADDED_EVENT,
} from "./agent-channels";

export function exposeAgentContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");
  
  contextBridge.exposeInMainWorld("agentApi", {
    // Agent Management
    createAgent: (data: {
      name: string;
      description: string;
      projectPath: string;
      projectName?: string;
      workspaceRoot?: string;
      initialPrompt?: string;
    }) => ipcRenderer.invoke(AGENT_CREATE_CHANNEL, data),
    
    listAgents: (projectPath?: string, status?: string) => 
      ipcRenderer.invoke(AGENT_LIST_CHANNEL, projectPath, status),
    
    getAgent: (sessionId: string) => 
      ipcRenderer.invoke(AGENT_GET_CHANNEL, sessionId),
    
    deleteAgent: (sessionId: string) => 
      ipcRenderer.invoke(AGENT_DELETE_CHANNEL, sessionId),

    // Execution Control
    startAgent: (sessionId: string, options?: {
      maxSteps?: number;
      stepTimeoutMs?: number;
      autoRetry?: boolean;
      retryAttempts?: number;
    }) => ipcRenderer.invoke(AGENT_START_CHANNEL, sessionId, options),
    
    stopAgent: (sessionId: string, reason?: string) => 
      ipcRenderer.invoke(AGENT_STOP_CHANNEL, sessionId, reason),
    
    updateAgentStatus: (sessionId: string, status: string) => 
      ipcRenderer.invoke(AGENT_UPDATE_STATUS_CHANNEL, sessionId, status),

    // Communication
    addMessage: (sessionId: string, role: 'user' | 'system', content: string) => 
      ipcRenderer.invoke(AGENT_ADD_MESSAGE_CHANNEL, sessionId, role, content),
    
    getMessages: (sessionId: string, limit?: number) => 
      ipcRenderer.invoke(AGENT_GET_MESSAGES_CHANNEL, sessionId, limit),
    
    getProgress: (sessionId: string) => 
      ipcRenderer.invoke(AGENT_GET_PROGRESS_CHANNEL, sessionId),

    // Status Queries
    isAgentRunning: (sessionId: string) => 
      ipcRenderer.invoke(AGENT_IS_RUNNING_CHANNEL, sessionId),
    
    getRunningAgents: () => 
      ipcRenderer.invoke(AGENT_GET_RUNNING_CHANNEL),
    
    getProjectSummary: (projectPath: string) => 
      ipcRenderer.invoke(AGENT_GET_PROJECT_SUMMARY_CHANNEL, projectPath),

    // Multi-project operations
    getAllProjects: () => 
      ipcRenderer.invoke(AGENT_GET_ALL_PROJECTS_CHANNEL),
    
    switchProject: (newProjectPath: string) => 
      ipcRenderer.invoke(AGENT_SWITCH_PROJECT_CHANNEL, newProjectPath),
    
    checkFileConflicts: (sessionId: string, filePaths: string[]) => 
      ipcRenderer.invoke(AGENT_CHECK_FILE_CONFLICTS_CHANNEL, sessionId, filePaths),
    
    cleanupInactiveProjects: (daysInactive?: number) => 
      ipcRenderer.invoke(AGENT_CLEANUP_INACTIVE_PROJECTS_CHANNEL, daysInactive),

    // Event Listeners
    onStatusChanged: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_STATUS_CHANGED_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_STATUS_CHANGED_EVENT, handler);
    },
    
    onStepStarted: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_STEP_STARTED_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_STEP_STARTED_EVENT, handler);
    },
    
    onStepCompleted: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_STEP_COMPLETED_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_STEP_COMPLETED_EVENT, handler);
    },
    
    onStepFailed: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_STEP_FAILED_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_STEP_FAILED_EVENT, handler);
    },
    
    onLockConflict: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_LOCK_CONFLICT_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_LOCK_CONFLICT_EVENT, handler);
    },
    
    onNeedsClarification: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_NEEDS_CLARIFICATION_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_NEEDS_CLARIFICATION_EVENT, handler);
    },
    
    onExecutionComplete: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_EXECUTION_COMPLETE_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_EXECUTION_COMPLETE_EVENT, handler);
    },
    
    onExecutionAborted: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_EXECUTION_ABORTED_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_EXECUTION_ABORTED_EVENT, handler);
    },
    
    onAgentCreated: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_CREATED_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_CREATED_EVENT, handler);
    },
    
    onAgentDeleted: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_DELETED_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_DELETED_EVENT, handler);
    },
    
    onMessageAdded: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(AGENT_MESSAGE_ADDED_EVENT, handler);
      return () => ipcRenderer.removeListener(AGENT_MESSAGE_ADDED_EVENT, handler);
    },

    removeAllListeners: () => {
      ipcRenderer.removeAllListeners(AGENT_STATUS_CHANGED_EVENT);
      ipcRenderer.removeAllListeners(AGENT_STEP_STARTED_EVENT);
      ipcRenderer.removeAllListeners(AGENT_STEP_COMPLETED_EVENT);
      ipcRenderer.removeAllListeners(AGENT_STEP_FAILED_EVENT);
      ipcRenderer.removeAllListeners(AGENT_LOCK_CONFLICT_EVENT);
      ipcRenderer.removeAllListeners(AGENT_NEEDS_CLARIFICATION_EVENT);
      ipcRenderer.removeAllListeners(AGENT_EXECUTION_COMPLETE_EVENT);
      ipcRenderer.removeAllListeners(AGENT_EXECUTION_ABORTED_EVENT);
      ipcRenderer.removeAllListeners(AGENT_CREATED_EVENT);
      ipcRenderer.removeAllListeners(AGENT_DELETED_EVENT);
      ipcRenderer.removeAllListeners(AGENT_MESSAGE_ADDED_EVENT);
    }
  });
}
