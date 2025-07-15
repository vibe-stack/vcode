import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { KanbanState, KanbanTask, TaskStatus, KanbanBoard, KanbanColumn } from './types';

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
