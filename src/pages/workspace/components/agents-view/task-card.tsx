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

  const getWorkStatusColor = (workStatus: string) => {
    switch (workStatus) {
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-purple-100 text-purple-800';
      case 'finalizing':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Context menu actions
  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      startAgent(currentProject, task.id);
      // Also start the agent via IPC
      window.agents.startAgent(task.id);
    }
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      pauseAgent(currentProject, task.id);
      window.agents.pauseAgent(task.id);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      stopAgent(currentProject, task.id);
      window.agents.stopAgent(task.id);
    }
  };

  const handleResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProject) {
      resumeAgent(currentProject, task.id);
      window.agents.resumeAgent(task.id);
    }
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement accept action
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
          className="bg-accent/10 hover:bg-accent/20 border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-default group"
          onClick={handleCardClick}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-sm flex-1 overflow-hidden text-ellipsis">{task.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={handleEditClick}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
          {task.description && (
            <p className="text-xs text-gray-600 mb-3 overflow-hidden text-ellipsis">
              {task.description}
            </p>
          )}
          <div className="space-y-2">
            {/* Agent Status */}
            {agentExecution && (
              <div className="flex items-center gap-2">
                <Bot className="h-3 w-3 text-gray-500" />
                <Badge variant="secondary" className={`text-xs ${getAgentStatusColor(agentStatus)}`}>
                  {agentStatus}
                </Badge>
                {agentExecution.progress !== undefined && (
                  <div className="text-xs text-gray-500">
                    {Math.round(agentExecution.progress)}%
                  </div>
                )}
              </div>
            )}
            
            {/* Current Step */}
            {agentExecution?.currentStep && (
              <div className="text-xs text-gray-600 italic">
                {agentExecution.currentStep}
              </div>
            )}

            {/* Error Display */}
            {agentExecution?.error && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">{agentExecution.error}</span>
              </div>
            )}

            {/* Work Status */}
            {task.status === 'doing' && (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className={`text-xs ${getWorkStatusColor(task.workStatus)}`}>
                  {task.workStatus.replace('-', ' ')}
                </Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">{task.assignedAgent}</span>
              </div>
              {task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">{task.attachments.length}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-gray-500">
            {new Date(task.updatedAt).toLocaleDateString()}
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
