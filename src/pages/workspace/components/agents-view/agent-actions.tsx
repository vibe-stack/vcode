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
  compact?: boolean;
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
  isLoading = false,
  compact = false
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
      case 'todo':
        return (
          <Button
            size="sm"
            onClick={e => { e.stopPropagation(); handleAction('start', () => onStart(agent.id)); }}
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
            onClick={e => { e.stopPropagation(); handleAction('stop', () => onStop(agent.id)); }}
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
              onClick={e => { e.stopPropagation(); handleAction('accept', () => onAccept(agent.id)); }}
              disabled={isLoading || actionLoading === 'accept'}
              className="gap-1.5"
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={e => { e.stopPropagation(); handleAction('reject', () => onReject(agent.id)); }}
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
            onClick={e => { e.stopPropagation(); onAddMessage(agent.id); }}
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
      {!compact && getPrimaryAction()}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canViewDetails && (
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onViewDetails(agent.id); }}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          )}
          
          {compact && getPrimaryAction() && (
            <DropdownMenuItem 
              onClick={e => {
                e.stopPropagation();
                // Handle compact primary actions through dropdown
                switch (agent.status) {
                  case 'todo':
                    handleAction('start', () => onStart(agent.id));
                    break;
                  case 'doing':
                    handleAction('stop', () => onStop(agent.id));
                    break;
                  case 'need_clarification':
                    onAddMessage(agent.id);
                    break;
                }
              }}
            >
              {agent.status === 'todo' && (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </>
              )}
              {agent.status === 'doing' && (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </>
              )}
              {agent.status === 'need_clarification' && (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Clarify
                </>
              )}
            </DropdownMenuItem>
          )}
          
          {compact && agent.status === 'review' && (
            <>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); handleAction('accept', () => onAccept(agent.id)); }}>
                <Check className="mr-2 h-4 w-4" />
                Accept
              </DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); handleAction('reject', () => onReject(agent.id)); }}>
                <X className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}
          
          {canAddMessage && (
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onAddMessage(agent.id); }}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Message
            </DropdownMenuItem>
          )}
          
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={e => { e.stopPropagation(); handleAction('delete', () => onDelete(agent.id)); }}
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
