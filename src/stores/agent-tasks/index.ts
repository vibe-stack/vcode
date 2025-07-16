import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AgentStatusUpdate, AgentWorktreeInfo } from '@/helpers/ipc/agents/agent-context';

export interface AgentTaskState {
  agentStatuses: Record<string, AgentStatusUpdate>;
  worktreeInfo: Record<string, AgentWorktreeInfo>;
  
  // Actions
  updateAgentStatus: (update: AgentStatusUpdate) => void;
  updateWorktreeInfo: (info: AgentWorktreeInfo) => void;
  getAgentStatus: (taskId: string) => AgentStatusUpdate | undefined;
  getWorktreeInfo: (taskId: string) => AgentWorktreeInfo | undefined;
  clearAgentData: (taskId: string) => void;
}

export const useAgentTaskStore = create<AgentTaskState>()(
  persist(
    immer((set, get) => ({
      agentStatuses: {},
      worktreeInfo: {},

      updateAgentStatus: (update: AgentStatusUpdate) => {
        set((state) => {
          state.agentStatuses[update.taskId] = update;
        });
      },

      updateWorktreeInfo: (info: AgentWorktreeInfo) => {
        set((state) => {
          state.worktreeInfo[info.taskId] = info;
        });
      },

      getAgentStatus: (taskId: string) => {
        const state = get();
        return state.agentStatuses[taskId];
      },

      getWorktreeInfo: (taskId: string) => {
        const state = get();
        return state.worktreeInfo[taskId];
      },

      clearAgentData: (taskId: string) => {
        set((state) => {
          delete state.agentStatuses[taskId];
          delete state.worktreeInfo[taskId];
        });
      }
    })),
    {
      name: 'agent-tasks-store',
      partialize: (state) => ({
        agentStatuses: state.agentStatuses,
        worktreeInfo: state.worktreeInfo
      })
    }
  )
);