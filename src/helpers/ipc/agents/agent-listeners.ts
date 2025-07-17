import { ipcMain, webContents } from "electron";
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
  AGENT_WORKTREE_STATUS_CHANNEL,
} from "./agent-channels";
import { agentsApi } from "@/api/ai/agents";
import { AgentManager } from "@/services/agent-manager";
import { AgentWorktreeManager } from "@/services/agent-worktree-manager";
import { AgentStatusUpdate, AgentWorktreeInfo } from "./agent-context";

const agentManager = new AgentManager();
const worktreeManager = new AgentWorktreeManager();

export function addAgentEventListeners() {
  // Agent messaging
  ipcMain.handle(
    AGENT_SEND_MESSAGE_CHANNEL,
    async (event, { taskId, messages, requestId }) => {
      try {
        const response = await agentsApi({ messages });

        // Get the stream from the response body
        const stream = response.body;
        if (!stream) {
          throw new Error("No stream in response body");
        }

        const reader = stream.getReader();
        const webContents = event.sender;

        // Process stream chunks as they arrive
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                webContents.send(AGENT_STREAM_END_CHANNEL, {
                  taskId,
                  requestId,
                });
                break;
              }

              // Send chunk to renderer
              webContents.send(AGENT_STREAM_CHUNK_CHANNEL, {
                taskId,
                requestId,
                chunk: value,
              });
            }
          } catch (error) {
            webContents.send(AGENT_STREAM_ERROR_CHANNEL, {
              taskId,
              requestId,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        };

        // Start processing stream (don't await - let it run async)
        processStream();

        // Return immediately to indicate streaming has started
        return { success: true, requestId };
      } catch (error) {
        throw error;
      }
    },
  );

  // Agent lifecycle
  ipcMain.handle(AGENT_START_CHANNEL, async (event, { taskId }) => {
    try {
      const result = await agentManager.startAgent(taskId);
      return result;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle(AGENT_STOP_CHANNEL, async (event, { taskId }) => {
    try {
      const result = await agentManager.stopAgent(taskId);
      return result;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle(AGENT_PAUSE_CHANNEL, async (event, { taskId }) => {
    try {
      const result = await agentManager.pauseAgent(taskId);
      return result;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle(AGENT_RESUME_CHANNEL, async (event, { taskId }) => {
    try {
      const result = await agentManager.resumeAgent(taskId);
      return result;
    } catch (error) {
      throw error;
    }
  });

  // Git worktree management
  ipcMain.handle(
    AGENT_CREATE_WORKTREE_CHANNEL,
    async (event, { taskId, branchName }) => {
      try {
        const result = await worktreeManager.createWorktree(taskId, branchName);
        return result;
      } catch (error) {
        throw error;
      }
    },
  );

  ipcMain.handle(AGENT_DELETE_WORKTREE_CHANNEL, async (event, { taskId }) => {
    try {
      const result = await worktreeManager.deleteWorktree(taskId);
      return result;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle(AGENT_SWITCH_WORKTREE_CHANNEL, async (event, { taskId }) => {
    try {
      const result = await worktreeManager.switchToWorktree(taskId);
      return result;
    } catch (error) {
      throw error;
    }
  });

  // Setup status update forwarding
  agentManager.onStatusUpdate((update: AgentStatusUpdate) => {
    // Broadcast to all renderer processes
    // Note: In a real implementation, you'd want to track which renderer should receive updates
    const allWebContents = webContents.getAllWebContents();
    allWebContents.forEach((wc: any) => {
      if (!wc.isDestroyed()) {
        wc.send(AGENT_STATUS_UPDATE_CHANNEL, update);
      }
    });
  });

  worktreeManager.onWorktreeStatusChange((info: AgentWorktreeInfo) => {
    const allWebContents = webContents.getAllWebContents();
    allWebContents.forEach((wc: any) => {
      if (!wc.isDestroyed()) {
        wc.send(AGENT_WORKTREE_STATUS_CHANNEL, info);
      }
    });
  });
}
