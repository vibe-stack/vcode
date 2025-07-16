import { agentManager } from './manager';
import { agentExecutionEngine } from './execution-engine';
import { agentDB } from './database';

/**
 * Agent API endpoints for frontend integration
 * These would typically be exposed via IPC in an Electron app
 */

export const agentEndpoints = {
  // Agent Management
  async createAgent(data: {
    name: string;
    description: string;
    projectPath: string;
    projectName?: string;
    workspaceRoot?: string;
    initialPrompt?: string;
  }) {
    return await agentManager.createAgent(data);
  },

  async listAgents(projectPath?: string, status?: string) {
    return agentManager.listAgents(projectPath, status as any);
  },

  async getAgent(sessionId: string) {
    return agentManager.getAgent(sessionId);
  },

  async deleteAgent(sessionId: string) {
    return await agentManager.deleteAgent(sessionId);
  },

  // Execution Control
  async startAgent(sessionId: string, options?: {
    maxSteps?: number;
    stepTimeoutMs?: number;
    autoRetry?: boolean;
    retryAttempts?: number;
  }) {
    return await agentManager.startAgent(sessionId, options);
  },

  async stopAgent(sessionId: string, reason?: string) {
    return await agentManager.stopAgent(sessionId, reason);
  },

  async updateAgentStatus(sessionId: string, status: string) {
    return await agentManager.updateAgentStatus(sessionId, status as any);
  },

  // Communication
  async addMessage(sessionId: string, role: 'user' | 'system', content: string) {
    return await agentManager.addMessage(sessionId, role, content);
  },

  async getMessages(sessionId: string, limit?: number) {
    return agentManager.getMessages(sessionId, limit);
  },

  async getProgress(sessionId: string) {
    return agentManager.getProgress(sessionId);
  },

  // Status Queries
  async isAgentRunning(sessionId: string) {
    return agentManager.isAgentRunning(sessionId);
  },

  async getRunningAgents() {
    return agentManager.getRunningAgents();
  },

  async getProjectSummary(projectPath: string) {
    return await agentManager.getProjectAgentSummary(projectPath);
  },

  // Multi-project operations
  async getAllProjects() {
    return agentManager.getAllProjects();
  },

  async switchProject(newProjectPath: string) {
    return await agentManager.switchProject(newProjectPath);
  },

  async cleanupInactiveProjects(daysInactive?: number) {
    return await agentManager.cleanupInactiveProjects(daysInactive);
  },

  // File Conflict Management
  async checkFileConflicts(sessionId: string, filePaths: string[]) {
    return await agentManager.checkFileConflicts(sessionId, filePaths);
  },

  // Real-time Updates (for polling)
  async getUpdates(since?: string) {
    // Get recent updates since timestamp
    const recentSessions = agentDB.listSessions().filter(session => {
      if (!since) return true;
      return new Date(session.updatedAt) > new Date(since);
    });

    const runningAgents = agentManager.getRunningAgents();

    return {
      timestamp: new Date().toISOString(),
      sessions: recentSessions,
      runningAgents,
    };
  },

  // Event listeners setup (for real-time updates)
  setupEventListeners(callbacks: {
    onStatusChanged?: (event: any) => void;
    onStepCompleted?: (event: any) => void;
    onLockConflict?: (event: any) => void;
    onExecutionComplete?: (event: any) => void;
    onNeedsClarification?: (event: any) => void;
  }) {
    if (callbacks.onStatusChanged) {
      agentManager.on('agentStatusChanged', callbacks.onStatusChanged);
    }
    if (callbacks.onStepCompleted) {
      agentManager.on('agentStepCompleted', callbacks.onStepCompleted);
    }
    if (callbacks.onLockConflict) {
      agentManager.on('agentLockConflict', callbacks.onLockConflict);
    }
    if (callbacks.onExecutionComplete) {
      agentManager.on('agentExecutionComplete', callbacks.onExecutionComplete);
    }
    if (callbacks.onNeedsClarification) {
      agentManager.on('agentNeedsClarification', callbacks.onNeedsClarification);
    }

    return () => {
      // Cleanup function
      agentManager.removeAllListeners();
    };
  },
};

/**
 * Example IPC setup for Electron main process:
 * 
 * ```typescript
 * import { ipcMain } from 'electron';
 * import { agentEndpoints } from './api/agents/endpoints';
 * 
 * // Register IPC handlers
 * Object.entries(agentEndpoints).forEach(([name, handler]) => {
 *   ipcMain.handle(`agent:${name}`, async (event, ...args) => {
 *     try {
 *       return await handler(...args);
 *     } catch (error) {
 *       console.error(`Agent API error in ${name}:`, error);
 *       throw error;
 *     }
 *   });
 * });
 * 
 * // Setup real-time events
 * agentEndpoints.setupEventListeners({
 *   onStatusChanged: (event) => {
 *     // Broadcast to all renderer processes
 *     BrowserWindow.getAllWindows().forEach(window => {
 *       window.webContents.send('agent:statusChanged', event);
 *     });
 *   },
 *   // ... other event handlers
 * });
 * ```
 */
