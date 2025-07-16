import React from 'react';
import { KanbanTask } from '@/stores/kanban/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Paperclip, User, Play, Pause, Check, X, Send, Bot, AlertCircle } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '@/components/ui/context-menu';
import { useKanbanStore } from '@/stores/kanban';
import { useProjectStore } from '@/stores/project';

interface TaskCardProps {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  onClick?: (task: KanbanTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onClick }) => {
  const { currentProject } = useProjectStore();
  const { startAgent, stopAgent, pauseAgent, resumeAgent } = useKanbanStore();

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(task);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
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
      case 'running':
        return (
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1" />
        );
      case 'paused':
        return (
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 mr-1" />
        );
      case 'error':
        return (
          <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1" />
        );
      case 'stopped':
        return (
          <span className="inline-block h-2 w-2 rounded-full bg-gray-400 mr-1" />
        );
      default:
        return (
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300 mr-1" />
        );
    }
  };

  // Context menu actions
  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      startAgent(currentProject, task.id);
    }
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      pauseAgent(currentProject, task.id);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      stopAgent(currentProject, task.id);
    }
  };

  const handleResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      resumeAgent(currentProject, task.id);
    }
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement accept action
    if (currentProject) {

    }
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement reject action
  };

  const handleSendTo = (destination: 'ideas' | 'todo') => (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement send to destination
  };

  const agentExecution = task.agentExecution;
  const isAgentRunning = agentExecution?.isRunning;
  const agentStatus = agentExecution?.status || 'idle';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="bg-white dark:bg-accent/10 hover:bg-accent/20 border border-gray-200 dark:border-accent/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group w-full max-w-md"
          onClick={handleCardClick}
        >
          {/* Header: Title & Edit */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base truncate text-gray-900 dark:text-gray-100 flex-1">
              {task.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
              onClick={handleEditClick}
              aria-label="Edit task"
            >
              <Edit2 className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Agent Status & Step & Error */}
          {agentExecution && (
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-3 w-3 text-gray-500" />
                {getAgentStatusDot(agentStatus)}
                <span className="text-xs text-gray-700 font-medium">
                  {agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
                </span>
                {agentExecution?.currentStep && (
                  <span className="ml-3 text-xs text-gray-500 italic">
                    {agentExecution.currentStep}
                  </span>
                )}
              </div>
              {agentExecution?.error && (
                <div className="flex items-center gap-1 text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">{agentExecution.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Work Status */}
          {task.status === 'doing' && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-blue-700 font-medium">
                {task.workStatus.replace('-', ' ')}
              </span>
              {task.workStatus === 'in-progress' && (
                <span className="ml-2 animate-spin inline-block h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full" />
              )}
            </div>
          )}

          {/* Agent & Attachments */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-700 font-medium">{task.assignedAgent}</span>
            </div>
            {task.attachments.length > 0 && (
              <div className="flex items-center gap-2">
                <Paperclip className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-700 font-medium">{task.attachments.length}</span>
              </div>
            )}
          </div>

          {/* Footer: Time & Status Badge */}
          <div className="mt-4 pt-2 border-t border-gray-100 dark:border-accent/20 flex items-center justify-between text-xs text-gray-400">
            <span>{getRelativeTime(task.updatedAt)}</span>
            {task.status && (
              <Badge variant="secondary" className="ml-2 px-2 py-0 text-xs font-normal rounded">
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {!isAgentRunning && (
          <ContextMenuItem onClick={handleRun} className='text-blue-50'>
            Run Agent
            <Play className="ml-auto h-4 w-4 text-blue-600/70" />
          </ContextMenuItem>
        )}
        {isAgentRunning && agentStatus === 'running' && (
          <ContextMenuItem onClick={handlePause} className='text-yellow-50'>
            Pause Agent
            <Pause className="ml-auto h-4 w-4 text-yellow-600/70" />
          </ContextMenuItem>
        )}
        {agentStatus === 'paused' && (
          <ContextMenuItem onClick={handleResume} className='text-green-50'>
            Resume Agent
            <Play className="ml-auto h-4 w-4 text-green-600/70" />
          </ContextMenuItem>
        )}
        {isAgentRunning && (
          <ContextMenuItem onClick={handleStop} className='text-red-50'>
            Stop Agent
            <X className="ml-auto h-4 w-4 text-red-600/70" />
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={handleAccept} className='text-green-50'>
          Accept
          <Check className="ml-auto h-4 w-4 text-green-600/70" />
        </ContextMenuItem>
        <ContextMenuItem onClick={handleReject} className='text-red-50'>
          Reject
          <X className="ml-auto h-4 w-4 text-red-600/70" />
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            Send to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={handleSendTo('ideas')}>
              Ideas
              <Send className="ml-auto h-4 w-4 text-muted-foreground" />
            </ContextMenuItem>
            <ContextMenuItem onClick={handleSendTo('todo')}>
              Todo
              <Send className="ml-auto h-4 w-4 text-muted-foreground" />
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};
