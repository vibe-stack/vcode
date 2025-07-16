import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { KanbanState, KanbanTask, TaskStatus, KanbanBoard, KanbanColumn, AgentExecution } from './types';

const createEmptyBoard = (): KanbanBoard => ({
  columns: [
    {
      id: 'ideas',
      title: 'Ideas',
      tasks: [],
      canCreateTasks: true
    },
    {
      id: 'todo',
      title: 'To Do',
      tasks: [],
      canCreateTasks: true
    },
    {
      id: 'doing',
      title: 'Doing',
      tasks: [],
      canCreateTasks: false
    },
    {
      id: 'need_clarification',
      title: 'Need Clarification',
      tasks: [],
      canCreateTasks: false
    },
    {
      id: 'review',
      title: 'Review',
      tasks: [],
      canCreateTasks: false
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [],
      canCreateTasks: false
    },
    {
      id: 'rejected',
      title: 'Rejected',
      tasks: [],
      canCreateTasks: false
    }
  ]
});

export const useKanbanStore = create<KanbanState>()(
  persist(
    immer((set, get) => ({
      boards: {},

      createTask: (projectPath: string, taskData: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTask: KanbanTask = {
          ...taskData,
          id: nanoid(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => {
          if (!state.boards[projectPath]) {
            state.boards[projectPath] = createEmptyBoard();
          }
          
          const board = state.boards[projectPath];
          const column = board.columns.find(col => col.id === taskData.status);
          
          if (column) {
            column.tasks.push(newTask);
          }
        });

        return newTask;
      },

      updateTask: (projectPath: string, taskId: string, updates: Partial<KanbanTask>) => {
        set((state) => {
          if (!state.boards[projectPath]) return;
          const board = state.boards[projectPath];
          let updatedTask: KanbanTask | undefined;
          let currentStatus: TaskStatus | undefined;
          let currentColumn: KanbanColumn | undefined;
          // Find and update the task
          board.columns.forEach(column => {
            const taskIndex = column.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
              currentStatus = column.tasks[taskIndex].status;
              updatedTask = {
                ...column.tasks[taskIndex],
                ...updates,
                updatedAt: new Date()
              };
              currentColumn = column;
              // If status changed, remove from current column
              if (updates.status && updates.status !== currentStatus) {
                column.tasks.splice(taskIndex, 1);
              } else {
                column.tasks[taskIndex] = updatedTask;
              }
            }
          });
          // If status changed, add updated task to new column
          if (updatedTask && updates.status && updates.status !== currentStatus) {
            const newColumn = board.columns.find(col => col.id === updates.status);
            if (newColumn) {
              newColumn.tasks.push(updatedTask);
            }
          }
        });
      },

      deleteTask: (projectPath: string, taskId: string) => {
        set((state) => {
          if (!state.boards[projectPath]) return;
          
          const board = state.boards[projectPath];
          board.columns.forEach(column => {
            column.tasks = column.tasks.filter(task => task.id !== taskId);
          });
        });
      },

      moveTask: (projectPath: string, taskId: string, newStatus: TaskStatus) => {
        set((state) => {
          if (!state.boards[projectPath]) return;
          
          const board = state.boards[projectPath];
          let taskToMove: KanbanTask | undefined;
          
          // Find and remove task from current column
          board.columns.forEach(column => {
            const taskIndex = column.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
              taskToMove = column.tasks.splice(taskIndex, 1)[0];
            }
          });
          
          // Add task to new column
          if (taskToMove) {
            taskToMove.status = newStatus;
            taskToMove.updatedAt = new Date();
            
            const newColumn = board.columns.find(col => col.id === newStatus);
            if (newColumn) {
              newColumn.tasks.push(taskToMove);
            }
          }
        });
      },

      getBoard: (projectPath: string) => {
        const state = get();
        if (!state.boards[projectPath]) {
          return createEmptyBoard();
        }
        return state.boards[projectPath];
      },

      getTasks: (projectPath: string, status?: TaskStatus) => {
        const board = get().getBoard(projectPath);
        if (status) {
          const column = board.columns.find(col => col.id === status);
          return column ? column.tasks : [];
        }
        return board.columns.flatMap(col => col.tasks);
      },

      getTask: (projectPath: string, taskId: string) => {
        const tasks = get().getTasks(projectPath);
        return tasks.find(task => task.id === taskId);
      },

      // Agent-specific actions
      updateAgentExecution: (projectPath: string, taskId: string, execution: Partial<AgentExecution>) => {
        set((state) => {
          if (!state.boards[projectPath]) return;
          
          const board = state.boards[projectPath];
          board.columns.forEach(column => {
            const task = column.tasks.find(t => t.id === taskId);
            if (task) {
              if (!task.agentExecution) {
                task.agentExecution = {
                  isRunning: false,
                  status: 'idle'
                };
              }
              Object.assign(task.agentExecution, execution);
              task.updatedAt = new Date();
            }
          });
        });
      },

      startAgent: (projectPath: string, taskId: string) => {
        // Update agentExecution, workStatus, and status together
        const currentTask = get().getTask(projectPath, taskId);
        if (currentTask) {
          const agentExecution = {
            ...(currentTask.agentExecution || { isRunning: false, status: 'idle' }),
            isRunning: true,
            status: 'running' as const,
            startTime: new Date(),
            lastUpdateTime: new Date()
          };
          get().moveTask(projectPath, taskId, 'doing');
          get().updateTask(projectPath, taskId, {
            agentExecution,
            workStatus: 'in-progress',
            status: 'doing',
            updatedAt: new Date()
          });
        }
      },

      stopAgent: (projectPath: string, taskId: string) => {
        const currentTask = get().getTask(projectPath, taskId);
        if (currentTask) {
          const agentExecution = {
            ...(currentTask.agentExecution || { isRunning: false, status: 'idle' }),
            isRunning: false,
            status: 'stopped' as const,
            lastUpdateTime: new Date()
          };
          get().moveTask(projectPath, taskId, 'done');
          get().updateTask(projectPath, taskId, {
            agentExecution,
            workStatus: 'done' as const,
            status: 'done',
            updatedAt: new Date()
          });
        }
      },

      pauseAgent: (projectPath: string, taskId: string) => {
        const currentTask = get().getTask(projectPath, taskId);
        if (currentTask) {
          const agentExecution = {
            ...(currentTask.agentExecution || { isRunning: false, status: 'idle' }),
            isRunning: false,
            status: 'paused' as const,
            lastUpdateTime: new Date()
          };
          get().moveTask(projectPath, taskId, 'need_clarification');
          get().updateTask(projectPath, taskId, {
            agentExecution,
            workStatus: 'paused',
            status: 'need_clarification',
            updatedAt: new Date()
          });
        }
      },

      resumeAgent: (projectPath: string, taskId: string) => {
        const currentTask = get().getTask(projectPath, taskId);
        if (currentTask) {
          const agentExecution = {
            ...(currentTask.agentExecution || { isRunning: false, status: 'idle' }),
            isRunning: true,
            status: 'running' as const,
            lastUpdateTime: new Date()
          };
          get().moveTask(projectPath, taskId, 'doing');
          get().updateTask(projectPath, taskId, {
            agentExecution,
            workStatus: 'in-progress',
            status: 'doing',
            updatedAt: new Date()
          });
        }
      },

      addMessage: (projectPath: string, taskId: string, message: { role: 'user' | 'assistant'; content: string }) => {
        set((state) => {
          if (!state.boards[projectPath]) return;
          
          const board = state.boards[projectPath];
          board.columns.forEach(column => {
            const task = column.tasks.find(t => t.id === taskId);
            if (task) {
              if (!task.messages) {
                task.messages = [];
              }
              task.messages.push({
                id: nanoid(),
                role: message.role,
                content: message.content,
                timestamp: new Date()
              });
              task.updatedAt = new Date();
            }
          });
        });
      },

      getMessages: (projectPath: string, taskId: string) => {
        const task = get().getTask(projectPath, taskId);
        return task?.messages || [];
      }
    })),
    {
      name: 'kanban-store',
      partialize: (state) => ({
        boards: state.boards
      })
    }
  )
);
