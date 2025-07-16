import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { AgentStatusBadge } from './agent-status-badge';
import { AgentActions } from './agent-actions';
import { AgentProgress } from './agent-progress';
import { Agent } from './types';
import { formatDistanceToNow } from 'date-fns';

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
  isLoading = false
}) => {
  const lastUpdated = formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true });

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate">
              {agent.name}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {agent.description}
            </CardDescription>
          </div>
          <AgentStatusBadge status={agent.status} />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <AgentProgress agent={agent} />
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdated}
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
          />
        </div>
      </CardContent>
    </Card>
  );
};
