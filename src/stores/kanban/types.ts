// Types for the kanban board

export type TaskStatus =
  | "ideas"
  | "todo"
  | "doing"
  | "review"
  | "done"
  | "rejected"
  | "need_clarification";

export type WorkStatus =
  | "not-started"
  | "in-progress"
  | "paused"
  | "blocked"
  | "testing"
  | "finalizing"
  | "done";

export type AgentStatus = "idle" | "running" | "paused" | "stopped" | "error";

export interface TaskAttachment {
  id: string;
  type: "file";
  name: string;
  path: string;
  size?: number;
  lastModified?: Date;
}

export interface AgentExecution {
  isRunning: boolean;
  status: AgentStatus;
  progress?: number;
  currentStep?: string;
  error?: string;
  startTime?: Date;
  lastUpdateTime?: Date;
  worktreePath?: string;
  branchName?: string;
  sessionId?: string; // For chat session tracking
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
  // Agent-specific fields
  agentExecution?: AgentExecution;
  messages?: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }[];
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
  createTask: (
    projectPath: string,
    task: Omit<KanbanTask, "id" | "createdAt" | "updatedAt">,
  ) => KanbanTask;
  updateTask: (
    projectPath: string,
    taskId: string,
    updates: Partial<KanbanTask>,
  ) => void;
  deleteTask: (projectPath: string, taskId: string) => void;
  moveTask: (
    projectPath: string,
    taskId: string,
    newStatus: TaskStatus,
  ) => void;
  getBoard: (projectPath: string) => KanbanBoard;
  getTasks: (projectPath: string, status?: TaskStatus) => KanbanTask[];
  getTask: (projectPath: string, taskId: string) => KanbanTask | undefined;

  // Agent-specific actions
  updateAgentExecution: (
    projectPath: string,
    taskId: string,
    execution: Partial<AgentExecution>,
  ) => void;
  executeAgent: (projectPath: string, taskId: string) => Promise<void>;
  startAgent: (projectPath: string, taskId: string) => Promise<void>;
  stopAgent: (projectPath: string, taskId: string) => void;
  pauseAgent: (projectPath: string, taskId: string) => void;
  resumeAgent: (projectPath: string, taskId: string) => void;
  addMessage: (
    projectPath: string,
    taskId: string,
    message: { role: "user" | "assistant"; content: string },
  ) => void;
  getMessages: (projectPath: string, taskId: string) => KanbanTask["messages"];

  // Utility functions for agent execution management (used by useAgentExecution hook)
  updateAgentStep: (projectPath: string, taskId: string, step: string) => void;
  completeAgentTask: (
    projectPath: string,
    taskId: string,
    status: "review" | "need_clarification",
    message?: string,
  ) => void;
  handleAgentError: (
    projectPath: string,
    taskId: string,
    error: string,
  ) => void;
}
