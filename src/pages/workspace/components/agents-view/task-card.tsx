import React, { useRef } from "react";
import { KanbanTask } from "@/stores/kanban/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  Paperclip,
  User,
  Play,
  Pause,
  Check,
  X,
  Send,
  Bot,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useKanbanStore } from "@/stores/kanban";
import { useProjectStore } from "@/stores/project";
import { AgentChat, AgentChatRef } from "./agent-chat";

interface TaskCardProps {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  onClick?: (task: KanbanTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onClick,
}) => {
  const { currentProject } = useProjectStore();
  const { startAgent, stopAgent, pauseAgent, resumeAgent } = useKanbanStore();
  const agentChatRef = useRef<AgentChatRef>(null);

  // Subscribe specifically to this task's data to ensure re-renders
  const liveTask = useKanbanStore((state) =>
    currentProject ? state.getTask(currentProject, task.id) : null,
  );
  const currentTask = liveTask || task;

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(currentTask);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(currentTask);
  };

  // Helper for relative time
  const getRelativeTime = (date: string | number | Date) => {
    const now = new Date();
    const updated = new Date(date);
    const diffMs = now.getTime() - updated.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    const diffWk = Math.floor(diffDay / 7);
    return `${diffWk}w ago`;
  };

  // Agent status dot style
  const getAgentStatusDot = (status: string) => {
    switch (status) {
      case "running":
        return (
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
        );
      case "paused":
        return (
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-yellow-400" />
        );
      case "error":
        return (
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />
        );
      case "stopped":
        return (
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-gray-400" />
        );
      default:
        return (
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-gray-300" />
        );
    }
  };

  // Context menu actions
  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject && agentChatRef.current) {
      // Update task state first, then trigger execution via AgentChat
      await startAgent(currentProject, currentTask.id);
      await agentChatRef.current.executeAgent();
    }
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      pauseAgent(currentProject, currentTask.id);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject && agentChatRef.current) {
      agentChatRef.current.stopAgent();
      stopAgent(currentProject, currentTask.id);
    }
  };

  const handleResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject && agentChatRef.current) {
      await startAgent(currentProject, currentTask.id);
      await agentChatRef.current.executeAgent();
    }
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      // Accept moves task to done
      const { moveTask, updateTask } = useKanbanStore.getState();
      moveTask(currentProject, currentTask.id, "done");
      updateTask(currentProject, currentTask.id, {
        status: "done",
        workStatus: "done",
        updatedAt: new Date(),
      });
    }
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      // Reject moves task back to need clarification
      const { moveTask, updateTask } = useKanbanStore.getState();
      moveTask(currentProject, currentTask.id, "need_clarification");
      updateTask(currentProject, currentTask.id, {
        status: "rejected",
        workStatus: "paused",
        updatedAt: new Date(),
      });
    }
  };

  const handleSendTo =
    (destination: "ideas" | "todo") => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentProject) {
        const { moveTask, updateTask } = useKanbanStore.getState();
        moveTask(currentProject, currentTask.id, destination);
        updateTask(currentProject, currentTask.id, {
          status: destination,
          workStatus: "not-started",
          updatedAt: new Date(),
          // Reset agent execution when sending back to ideas/todo
          agentExecution: undefined,
        });
      }
    };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject && !isAgentRunning) {
      // Confirm deletion
      if (
        window.confirm(
          `Are you sure you want to delete the task "${currentTask.title}"? This action cannot be undone.`,
        )
      ) {
        const { deleteTask } = useKanbanStore.getState();
        deleteTask(currentProject, currentTask.id);
      }
    }
  };

  const agentExecution = currentTask.agentExecution;
  const isAgentRunning = agentExecution?.isRunning;
  const agentStatus = agentExecution?.status || "idle";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="dark:bg-accent/10 hover:bg-accent/20 dark:border-accent/30 group w-full max-w-md cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          onClick={handleCardClick}
        >
          {/* Header: Title & Edit */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex-1 truncate text-base font-semibold text-gray-900 dark:text-gray-100">
              {currentTask.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleEditClick}
              aria-label="Edit task"
            >
              <Edit2 className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          {/* Description */}
          {currentTask.description && (
            <p className="mb-3 line-clamp-2 text-xs text-gray-500">
              {currentTask.description}
            </p>
          )}

          {/* Agent Status & Step & Error */}
          {agentExecution && (
            <div className="mb-2 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Bot className="h-3 w-3 text-gray-500" />
                {getAgentStatusDot(agentStatus)}
                <span className="text-xs font-medium text-gray-700">
                  {agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
                </span>
                {agentExecution?.currentStep && (
                  <span className="ml-3 text-xs text-gray-500 italic">
                    {agentExecution.currentStep}
                  </span>
                )}
              </div>
              {agentExecution?.error && (
                <div className="mt-1 flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">{agentExecution.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Work Status */}
          {currentTask.status === "doing" && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium text-blue-700">
                {currentTask.workStatus.replace("-", " ")}
              </span>
              {currentTask.workStatus === "in-progress" && (
                <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              )}
            </div>
          )}


          {/* Agent & Attachments */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">
                {currentTask.assignedAgent}
              </span>
            </div>
            {currentTask.attachments.length > 0 && (
              <div className="flex items-center gap-2">
                <Paperclip className="h-3 w-3 text-gray-400" />
                <span className="text-xs font-medium text-gray-700">
                  {currentTask.attachments.length}
                </span>
              </div>
            )}
          </div>

          {/* Footer: Time & Status Badge */}
          <div className="dark:border-accent/20 mt-4 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-400">
            <span>{getRelativeTime(currentTask.updatedAt)}</span>
            {currentTask.status && (
              <Badge
                variant="secondary"
                className="ml-2 rounded px-2 py-0 text-xs font-normal"
              >
                {currentTask.status.charAt(0).toUpperCase() +
                  currentTask.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </ContextMenuTrigger>

      {/* Hidden AgentChat component for agent execution */}
      <AgentChat
        ref={agentChatRef}
        taskId={currentTask.id}
        className="hidden"
      />

      <ContextMenuContent className="w-56">
        {/* Agent controls - only show for tasks that can run agents */}
        {(currentTask.status === "todo" || currentTask.status === "doing") &&
          !isAgentRunning && (
            <ContextMenuItem onClick={handleRun} className="text-blue-50">
              Run Agent
              <Play className="ml-auto h-4 w-4 text-blue-600/70" />
            </ContextMenuItem>
          )}
        {isAgentRunning && agentStatus === "running" && (
          <ContextMenuItem onClick={handlePause} className="text-yellow-50">
            Pause Agent
            <Pause className="ml-auto h-4 w-4 text-yellow-600/70" />
          </ContextMenuItem>
        )}
        {agentStatus === "paused" && (
          <ContextMenuItem onClick={handleResume} className="text-green-50">
            Resume Agent
            <Play className="ml-auto h-4 w-4 text-green-600/70" />
          </ContextMenuItem>
        )}
        {isAgentRunning && (
          <ContextMenuItem onClick={handleStop} className="text-red-50">
            Stop Agent
            <X className="ml-auto h-4 w-4 text-red-600/70" />
          </ContextMenuItem>
        )}

        {/* Review actions - only show for tasks in review */}
        {currentTask.status === "review" && (
          <>
            <ContextMenuItem onClick={handleAccept} className="text-green-50">
              Accept
              <Check className="ml-auto h-4 w-4 text-green-600/70" />
            </ContextMenuItem>
            <ContextMenuItem onClick={handleReject} className="text-red-50">
              Reject
              <X className="ml-auto h-4 w-4 text-red-600/70" />
            </ContextMenuItem>
          </>
        )}

        {/* Send to - only show for tasks that can be moved */}
        {(currentTask.status === "need_clarification" ||
          currentTask.status === "review" ||
          currentTask.status === "rejected") && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Send to</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={handleSendTo("ideas")}>
                Ideas
                <Send className="text-muted-foreground ml-auto h-4 w-4" />
              </ContextMenuItem>
              <ContextMenuItem onClick={handleSendTo("todo")}>
                Todo
                <Send className="text-muted-foreground ml-auto h-4 w-4" />
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {/* Delete - only show when agent is not running */}
        {!isAgentRunning && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleDelete} className="text-red-50">
              Delete Task
              <Trash2 className="ml-auto h-4 w-4 text-red-600/70" />
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
