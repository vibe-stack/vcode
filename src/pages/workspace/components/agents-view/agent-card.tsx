import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { AgentStatusBadge } from './agent-status-badge';
import { AgentActions } from './agent-actions';
import { AgentProgress } from './agent-progress';
import { Agent } from './types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/utils/tailwind';

interface AgentCardProps {
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

export const AgentCard: React.FC<AgentCardProps> = ({
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
  const lastUpdated = formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true });

  return (
    <Card onClick={() => onViewDetails(agent.id)} className={cn("transition-shadow hover:shadow-md bg-accent/20 cursor-pointer", compact ? "h-auto" : "h-auto")}>
      <CardHeader className={compact ? "pb-2" : "pb-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className={`font-medium truncate ${compact ? "text-sm" : "text-base"}`}>
              {agent.name}
            </CardTitle>
            <CardDescription className={`mt-1 ${compact ? "text-xs" : "text-sm"} line-clamp-2`}>
              {agent.description}
            </CardDescription>
          </div>
          {!compact && <AgentStatusBadge status={agent.status} />}
        </div>
      </CardHeader>

      <CardContent className={`${compact ? "pt-0 pb-3" : "pt-0 pb-4"}`}>
        <div className="flex items-center justify-between">
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
      </CardContent>
    </Card>
  );
};
