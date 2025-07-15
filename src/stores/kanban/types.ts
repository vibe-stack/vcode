// Types for the kanban board

export type TaskStatus = 'ideas' | 'todo' | 'doing' | 'review' | 'done' | 'rejected';

export type WorkStatus = 'not-started' | 'in-progress' | 'paused' | 'blocked' | 'testing' | 'finalizing';

export interface TaskAttachment {
  id: string;
  type: 'file';
  name: string;
  path: string;
  size?: number;
  lastModified?: Date;
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  workStatus: WorkStatus;
  assignedAgent: string;
  attachments: TaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: KanbanTask[];
  canCreateTasks: boolean;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

export interface KanbanState {
  boards: Record<string, KanbanBoard>; // keyed by project path
  
  // Actions
  createTask: (projectPath: string, task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>) => KanbanTask;
  updateTask: (projectPath: string, taskId: string, updates: Partial<KanbanTask>) => void;
  deleteTask: (projectPath: string, taskId: string) => void;
  moveTask: (projectPath: string, taskId: string, newStatus: TaskStatus) => void;
  getBoard: (projectPath: string) => KanbanBoard;
  getTasks: (projectPath: string, status?: TaskStatus) => KanbanTask[];
  getTask: (projectPath: string, taskId: string) => KanbanTask | undefined;
}
