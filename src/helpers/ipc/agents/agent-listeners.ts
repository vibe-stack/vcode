import { ipcMain, BrowserWindow } from 'electron';
import { agentManager } from '../../../api/agents/agent-system';
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
} from './agent-channels';

let mainWindow: BrowserWindow | null = null;

export function addAgentEventListeners(window: BrowserWindow) {
  mainWindow = window;

  // Agent Management IPC Handlers
  ipcMain.handle(AGENT_CREATE_CHANNEL, async (_, data) => {
    try {
      return await agentManager.createAgent(data);
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_LIST_CHANNEL, async (_, projectPath?: string, status?: string) => {
    try {
      return agentManager.listAgents(projectPath, status as any);
    } catch (error) {
      console.error('Error listing agents:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_GET_CHANNEL, async (_, sessionId: string) => {
    try {
      return agentManager.getAgent(sessionId);
    } catch (error) {
      console.error('Error getting agent:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_DELETE_CHANNEL, async (_, sessionId: string) => {
    try {
      return await agentManager.deleteAgent(sessionId);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  });

  // Execution Control IPC Handlers
  ipcMain.handle(AGENT_START_CHANNEL, async (_, sessionId: string, options?: any) => {
    try {
      return await agentManager.startAgent(sessionId, options);
    } catch (error) {
      console.error('Error starting agent:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_STOP_CHANNEL, async (_, sessionId: string, reason?: string) => {
    try {
      return await agentManager.stopAgent(sessionId, reason);
    } catch (error) {
      console.error('Error stopping agent:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_UPDATE_STATUS_CHANNEL, async (_, sessionId: string, status: string) => {
    try {
      return await agentManager.updateAgentStatus(sessionId, status as any);
    } catch (error) {
      console.error('Error updating agent status:', error);
      throw error;
    }
  });

  // Communication IPC Handlers
  ipcMain.handle(AGENT_ADD_MESSAGE_CHANNEL, async (_, sessionId: string, role: string, content: string) => {
    try {
      await agentManager.addMessage(sessionId, role as any, content);
      // Return the added message
      const messages = agentManager.getMessages(sessionId, 1);
      return messages[0];
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_GET_MESSAGES_CHANNEL, async (_, sessionId: string, limit?: number) => {
    try {
      return agentManager.getMessages(sessionId, limit);
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_GET_PROGRESS_CHANNEL, async (_, sessionId: string) => {
    try {
      return agentManager.getProgress(sessionId);
    } catch (error) {
      console.error('Error getting progress:', error);
      throw error;
    }
  });

  // Status Query IPC Handlers
  ipcMain.handle(AGENT_IS_RUNNING_CHANNEL, async (_, sessionId: string) => {
    try {
      return agentManager.isAgentRunning(sessionId);
    } catch (error) {
      console.error('Error checking if agent is running:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_GET_RUNNING_CHANNEL, async () => {
    try {
      const runningAgentIds = agentManager.getRunningAgents();
      return runningAgentIds.map(id => agentManager.getAgent(id)).filter(Boolean);
    } catch (error) {
      console.error('Error getting running agents:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_GET_PROJECT_SUMMARY_CHANNEL, async (_, projectPath: string) => {
    try {
      return await agentManager.getProjectAgentSummary(projectPath);
    } catch (error) {
      console.error('Error getting project summary:', error);
      throw error;
    }
  });

  // Multi-project IPC Handlers
  ipcMain.handle(AGENT_GET_ALL_PROJECTS_CHANNEL, async () => {
    try {
      return agentManager.getAllProjects();
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_SWITCH_PROJECT_CHANNEL, async (_, newProjectPath: string) => {
    try {
      return agentManager.switchProject(newProjectPath);
    } catch (error) {
      console.error('Error switching project:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_CHECK_FILE_CONFLICTS_CHANNEL, async (_, sessionId: string, filePaths: string[]) => {
    try {
      return agentManager.checkFileConflicts(sessionId, filePaths);
    } catch (error) {
      console.error('Error checking file conflicts:', error);
      throw error;
    }
  });

  ipcMain.handle(AGENT_CLEANUP_INACTIVE_PROJECTS_CHANNEL, async (_, daysInactive?: number) => {
    try {
      return agentManager.cleanupInactiveProjects(daysInactive);
    } catch (error) {
      console.error('Error cleaning up inactive projects:', error);
      throw error;
    }
  });

  // Set up event forwarding from agent manager to renderer
  setupEventForwarding();
}

function setupEventForwarding() {
  // Forward agent manager events to renderer process
  agentManager.on('agentStatusChanged', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_STATUS_CHANGED_EVENT, data);
    }
  });

  agentManager.on('agentStepStarted', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_STEP_STARTED_EVENT, data);
    }
  });

  agentManager.on('agentStepCompleted', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_STEP_COMPLETED_EVENT, data);
    }
  });

  agentManager.on('agentStepFailed', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_STEP_FAILED_EVENT, data);
    }
  });

  agentManager.on('agentLockConflict', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_LOCK_CONFLICT_EVENT, data);
    }
  });

  agentManager.on('agentNeedsClarification', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_NEEDS_CLARIFICATION_EVENT, data);
    }
  });

  agentManager.on('agentExecutionComplete', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_EXECUTION_COMPLETE_EVENT, data);
    }
  });

  agentManager.on('agentExecutionAborted', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_EXECUTION_ABORTED_EVENT, data);
    }
  });

  agentManager.on('agentCreated', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_CREATED_EVENT, data);
    }
  });

  agentManager.on('agentDeleted', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_DELETED_EVENT, data);
    }
  });

  agentManager.on('agentMessageAdded', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AGENT_MESSAGE_ADDED_EVENT, data);
    }
  });
}
