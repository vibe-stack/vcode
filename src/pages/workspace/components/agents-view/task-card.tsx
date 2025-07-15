import React from 'react';
import { KanbanTask } from '@/stores/kanban/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Paperclip, User, Play, Pause, Check, X, Send } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '@/components/ui/context-menu';

interface TaskCardProps {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  onClick?: (task: KanbanTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onClick }) => {
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

  // Context menu actions (stub handlers)
  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement run action
  };
  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement pause action
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
        <ContextMenuItem onClick={handleRun} className='text-blue-50'>
          Run
          <Play className="ml-auto h-4 w-4 text-blue-600/70" />
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePause} className='text-yellow-50'>
          Pause
          <Pause className="ml-auto h-4 w-4 text-yellow-600/70" />
        </ContextMenuItem>
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
