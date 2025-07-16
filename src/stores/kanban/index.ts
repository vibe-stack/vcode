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
          let taskFound = false;
          let currentStatus: TaskStatus | undefined;
          
          // Find and update the task
          board.columns.forEach(column => {
            const taskIndex = column.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
              currentStatus = column.tasks[taskIndex].status;
              column.tasks[taskIndex] = {
                ...column.tasks[taskIndex],
                ...updates,
                updatedAt: new Date()
              };
              taskFound = true;
            }
          });
          
          // If status changed, move task to new column
          if (taskFound && updates.status && updates.status !== currentStatus) {
            get().moveTask(projectPath, taskId, updates.status);
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
              task.agentExecution.isRunning = true;
              task.agentExecution.status = 'running';
              task.agentExecution.startTime = new Date();
              task.agentExecution.lastUpdateTime = new Date();
              task.updatedAt = new Date();
              
              // Move to doing if not already there
              if (task.status !== 'doing') {
                task.status = 'doing';
                task.workStatus = 'in-progress';
              }
            }
          });
        });
      },

      stopAgent: (projectPath: string, taskId: string) => {
        set((state) => {
          if (!state.boards[projectPath]) return;
          
          const board = state.boards[projectPath];
          board.columns.forEach(column => {
            const task = column.tasks.find(t => t.id === taskId);
            if (task && task.agentExecution) {
              task.agentExecution.isRunning = false;
              task.agentExecution.status = 'stopped';
              task.agentExecution.lastUpdateTime = new Date();
              task.updatedAt = new Date();
            }
          });
        });
      },

      pauseAgent: (projectPath: string, taskId: string) => {
        set((state) => {
          if (!state.boards[projectPath]) return;
          
          const board = state.boards[projectPath];
          board.columns.forEach(column => {
            const task = column.tasks.find(t => t.id === taskId);
            if (task && task.agentExecution) {
              task.agentExecution.isRunning = false;
              task.agentExecution.status = 'paused';
              task.agentExecution.lastUpdateTime = new Date();
              task.workStatus = 'paused';
              task.updatedAt = new Date();
            }
          });
        });
      },

      resumeAgent: (projectPath: string, taskId: string) => {
        set((state) => {
          if (!state.boards[projectPath]) return;
          
          const board = state.boards[projectPath];
          board.columns.forEach(column => {
            const task = column.tasks.find(t => t.id === taskId);
            if (task && task.agentExecution) {
              task.agentExecution.isRunning = true;
              task.agentExecution.status = 'running';
              task.agentExecution.lastUpdateTime = new Date();
              task.workStatus = 'in-progress';
              task.updatedAt = new Date();
            }
          });
        });
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
