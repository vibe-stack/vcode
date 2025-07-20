import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { AgentStatusBadge } from './agent-status-badge';
import { AgentActions } from './agent-actions';
import { AgentProgress } from './agent-progress';
import { Agent } from './types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/utils/tailwind';
import { 
  Loader2, 
  Lightbulb, 
  Clock, 
  HelpCircle, 
  Eye, 
  Check,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onStart: (agentId: string) => Promise<void>;
  onStop: (agentId: string) => Promise<void>;
  onAccept: (agentId: string) => Promise<void>;
  onReject: (agentId: string) => Promise<void>;
  onPromoteToTodo: (agentId: string) => Promise<void>;
  onDemoteToIdeas: (agentId: string) => Promise<void>;
  onDelete: (agentId: string) => Promise<void>;
  onViewDetails: (agentId: string) => void;
  onAddMessage: (agentId: string) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onStart,
  onStop,
  onAccept,
  onReject,
  onPromoteToTodo,
  onDemoteToIdeas,
  onDelete,
  onViewDetails,
  onAddMessage,
  isLoading = false,
  compact = false
}) => {
  const lastUpdated = formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true });

  // Get status icon based on agent status
  const getStatusIcon = () => {
    switch (agent.status) {
      case 'ideas':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'todo':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'need_clarification':
        return <HelpCircle className="h-4 w-4 text-orange-500" />;
      case 'doing':
        return <Loader2 className="h-4 w-4 text-green-500 animate-spin" />;
      case 'review':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'accepted':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Get status movement arrow button
  const getStatusMovementButton = () => {
    if (agent.status === 'ideas') {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPromoteToTodo(agent.id);
          }}
          disabled={isLoading}
          className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          Todo
          <ArrowRight className="h-3 w-3" />
        </Button>
      );
    } else if (agent.status === 'todo') {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDemoteToIdeas(agent.id);
          }}
          disabled={isLoading}
          className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Ideas
        </Button>
      );
    }
    return null;
  };

  return (
    <Card onClick={() => onViewDetails(agent.id)} className={cn("transition-shadow hover:shadow-md bg-accent/20 cursor-pointer", compact ? "h-auto" : "h-auto")}>
      <CardHeader className={compact ? "pb-2" : "pb-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className={`font-medium truncate ${compact ? "text-sm" : "text-base"}`}>
              {isLoading && <Loader2 className="inline h-4 w-4 animate-spin mr-2 text-emerald-400" />}
              {agent.name}
            </CardTitle>
          </div>
          {!compact && <AgentStatusBadge status={agent.status} />}
        </div>
      </CardHeader>

      <CardContent className={`${compact ? "pt-0 pb-3" : "pt-0 pb-4"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {`${lastUpdated}`}
          </span>
          
          <AgentActions
            agent={agent}
            onStart={onStart}
            onStop={onStop}
            onAccept={onAccept}
            onReject={onReject}
            onPromoteToTodo={onPromoteToTodo}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
            onAddMessage={onAddMessage}
            isLoading={isLoading}
            compact={compact}
          />
        </div>
        
        {/* Status indicator and movement button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
          </div>
          
          {getStatusMovementButton()}
        </div>
      </CardContent>
    </Card>
  );
};
