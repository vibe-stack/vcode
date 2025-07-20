import { Agent, CreateAgentRequest, AgentMessage, AgentProgress } from './types';

// Get the agent API exposed via contextBridge
declare global {
  interface Window {
    agentApi?: {
      createAgent: (data: {
        name: string;
        description: string;
        projectPath: string;
        projectName?: string;
        workspaceRoot?: string;
        initialPrompt?: string;
      }) => Promise<Agent>;
      listAgents: (projectPath?: string, status?: string) => Promise<Agent[]>;
      getAgent: (sessionId: string) => Promise<Agent | null>;
      deleteAgent: (sessionId: string) => Promise<boolean>;
      startAgent: (sessionId: string, options?: {
        maxSteps?: number;
        stepTimeoutMs?: number;
        autoRetry?: boolean;
        retryAttempts?: number;
      }) => Promise<boolean>;
      stopAgent: (sessionId: string, reason?: string) => Promise<boolean>;
      updateAgentStatus: (sessionId: string, status: string) => Promise<boolean>;
      addMessage: (sessionId: string, role: 'user' | 'system', content: string) => Promise<AgentMessage>;
      getMessages: (sessionId: string, limit?: number) => Promise<AgentMessage[]>;
      getProgress: (sessionId: string) => Promise<AgentProgress[]>;
      isAgentRunning: (sessionId: string) => Promise<boolean>;
      getRunningAgents: () => Promise<Agent[]>;
      onStatusChanged: (callback: (data: any) => void) => () => void;
      onStepStarted: (callback: (data: any) => void) => () => void;
      onStepCompleted: (callback: (data: any) => void) => () => void;
      onStepFailed: (callback: (data: any) => void) => () => void;
      onExecutionComplete: (callback: (data: any) => void) => () => void;
      onExecutionAborted: (callback: (data: any) => void) => () => void;
      onNeedsClarification: (callback: (data: any) => void) => () => void;
      onAgentCreated: (callback: (data: any) => void) => () => void;
      onAgentDeleted: (callback: (data: any) => void) => () => void;
      onMessageAdded: (callback: (data: any) => void) => () => void;
      removeAllListeners: () => void;
    };
  }
}

const isAgentApiAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.agentApi;
};

const noOpCleanup = () => {};

export const agentIpc = {
  // Agent Management
  async createAgent(request: CreateAgentRequest): Promise<Agent> {
    if (!isAgentApiAvailable()) {
      throw new Error('Agent API not available. Please ensure the application is running in Electron context.');
    }
    return window.agentApi!.createAgent(request);
  },

  async listAgents(projectPath?: string): Promise<Agent[]> {
    if (!isAgentApiAvailable()) {
      return [];
    }
    return window.agentApi!.listAgents(projectPath);
  },

  async getAgent(sessionId: string): Promise<Agent | null> {
    if (!isAgentApiAvailable()) {
      return null;
    }
    return window.agentApi!.getAgent(sessionId);
  },

  async deleteAgent(sessionId: string): Promise<boolean> {
    if (!isAgentApiAvailable()) {
      return false;
    }
    return window.agentApi!.deleteAgent(sessionId);
  },

  // Execution Control
  async startAgent(sessionId: string): Promise<boolean> {
    if (!isAgentApiAvailable()) {
      return false;
    }
    return window.agentApi!.startAgent(sessionId);
  },

  async stopAgent(sessionId: string): Promise<boolean> {
    if (!isAgentApiAvailable()) {
      return false;
    }
    return window.agentApi!.stopAgent(sessionId);
  },

  async updateAgentStatus(sessionId: string, status: string): Promise<boolean> {
    if (!isAgentApiAvailable()) {
      return false;
    }
    return window.agentApi!.updateAgentStatus(sessionId, status);
  },

  // Communication
  async addMessage(sessionId: string, role: 'user' | 'system', content: string): Promise<AgentMessage> {
    if (!isAgentApiAvailable()) {
      throw new Error('Agent API not available');
    }
    return window.agentApi!.addMessage(sessionId, role, content);
  },

  async getMessages(sessionId: string, limit?: number): Promise<AgentMessage[]> {
    if (!isAgentApiAvailable()) {
      return [];
    }
    return window.agentApi!.getMessages(sessionId, limit);
  },

  async getProgress(sessionId: string): Promise<AgentProgress[]> {
    if (!isAgentApiAvailable()) {
      return [];
    }
    return window.agentApi!.getProgress(sessionId);
  },

  // Status Queries
  async isAgentRunning(sessionId: string): Promise<boolean> {
    if (!isAgentApiAvailable()) {
      return false;
    }
    return window.agentApi!.isAgentRunning(sessionId);
  },

  async getRunningAgents(): Promise<Agent[]> {
    if (!isAgentApiAvailable()) {
      return [];
    }
    return window.agentApi!.getRunningAgents();
  },

  // Event Subscriptions
  onStatusChanged(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      console.warn('Agent API not available, event listeners will not work');
      return noOpCleanup;
    }
    return window.agentApi!.onStatusChanged(callback);
  },

  onStepStarted(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onStepStarted(callback);
  },

  onStepCompleted(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onStepCompleted(callback);
  },

  onStepFailed(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onStepFailed(callback);
  },

  onAgentCreated(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onAgentCreated(callback);
  },

  onAgentDeleted(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onAgentDeleted(callback);
  },

  onMessageAdded(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onMessageAdded(callback);
  },

  onExecutionComplete(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onExecutionComplete(callback);
  },

  onExecutionAborted(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onExecutionAborted(callback);
  },

  onNeedsClarification(callback: (data: any) => void): () => void {
    if (!isAgentApiAvailable()) {
      return noOpCleanup;
    }
    return window.agentApi!.onNeedsClarification(callback);
  },

  removeAllListeners(): void {
    if (!isAgentApiAvailable()) {
      return;
    }
    window.agentApi!.removeAllListeners();
  }
};
