import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../../../components/ui/dropdown-menu';
import { 
  Play, 
  Square, 
  Check, 
  X, 
  MoreHorizontal, 
  MessageSquare,
  Trash2,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Agent, AgentStatus } from './types';

interface AgentActionsProps {
  agent: Agent;
  onStart: (agentId: string) => Promise<void>;
  onStop: (agentId: string) => Promise<void>;
  onAccept: (agentId: string) => Promise<void>;
  onReject: (agentId: string) => Promise<void>;
  onPromoteToTodo: (agentId: string) => Promise<void>;
  onDelete: (agentId: string) => Promise<void>;
  onViewDetails: (agentId: string) => void;
  onAddMessage: (agentId: string) => void;
  isLoading?: boolean;
}

export const AgentActions: React.FC<AgentActionsProps> = ({
  agent,
  onStart,
  onStop,
  onAccept,
  onReject,
  onPromoteToTodo,
  onDelete,
  onViewDetails,
  onAddMessage,
  isLoading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setActionLoading(action);
    try {
      await fn();
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getPrimaryAction = () => {
    switch (agent.status) {
      case 'ideas':
        return (
          <Button
            size="sm"
            onClick={() => handleAction('promote', () => onPromoteToTodo(agent.id))}
            disabled={isLoading || actionLoading === 'promote'}
            className="gap-1.5"
          >
            <ArrowRight className="h-3 w-3" />
            Promote to Todo
          </Button>
        );
      
      case 'todo':
        return (
          <Button
            size="sm"
            onClick={() => handleAction('start', () => onStart(agent.id))}
            disabled={isLoading || actionLoading === 'start'}
            className="gap-1.5"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
        );
      
      case 'doing':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('stop', () => onStop(agent.id))}
            disabled={isLoading || actionLoading === 'stop'}
            className="gap-1.5"
          >
            <Square className="h-3 w-3" />
            Stop
          </Button>
        );
      
      case 'review':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => handleAction('accept', () => onAccept(agent.id))}
              disabled={isLoading || actionLoading === 'accept'}
              className="gap-1.5"
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('reject', () => onReject(agent.id))}
              disabled={isLoading || actionLoading === 'reject'}
              className="gap-1.5"
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
          </div>
        );
      
      case 'need_clarification':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddMessage(agent.id)}
            className="gap-1.5"
          >
            <MessageSquare className="h-3 w-3" />
            Clarify
          </Button>
        );
      
      default:
        return null;
    }
  };

  const canDelete = !['doing'].includes(agent.status);
  const canViewDetails = true;
  const canAddMessage = ['need_clarification', 'ideas', 'todo'].includes(agent.status);

  return (
    <div className="flex items-center gap-2">
      {getPrimaryAction()}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canViewDetails && (
            <DropdownMenuItem onClick={() => onViewDetails(agent.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          )}
          
          {canAddMessage && (
            <DropdownMenuItem onClick={() => onAddMessage(agent.id)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Message
            </DropdownMenuItem>
          )}
          
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleAction('delete', () => onDelete(agent.id))}
                className="text-destructive"
                disabled={actionLoading === 'delete'}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
