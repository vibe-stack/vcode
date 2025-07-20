import React, { useRef, useEffect } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { AgentCard } from './agent-card';
import { Agent, AgentStatus } from './types';

interface AgentKanbanProps {
  agents: Agent[];
  onStart: (agentId: string) => Promise<void>;
  onStop: (agentId: string) => Promise<void>;
  onAccept: (agentId: string) => Promise<void>;
  onReject: (agentId: string) => Promise<void>;
  onPromoteToTodo: (agentId: string) => Promise<void>;
  onDemoteToIdeas: (agentId: string) => Promise<void>;
  onDelete: (agentId: string) => Promise<void>;
  onViewDetails: (agentId: string) => void;
  onAddMessage: (agentId: string) => void;
  statusFilter?: AgentStatus | 'all';
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string }> = {
  ideas: { label: 'Ideas', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  todo: { label: 'Todo', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
  doing: { label: 'Running', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  need_clarification: { label: 'Needs Clarification', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
  review: { label: 'Review', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
};

export const AgentKanban: React.FC<AgentKanbanProps> = ({
  agents,
  onStart,
  onStop,
  onAccept,
  onReject,
  onPromoteToTodo,
  onDemoteToIdeas,
  onDelete,
  onViewDetails,
  onAddMessage,
  statusFilter = 'all'
}) => {
  const kanbanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kanbanElement = kanbanRef.current;
    if (!kanbanElement) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if the target is within a scrollable column content area
      const target = e.target as HTMLElement;
      const isOverScrollableContent = target.closest('[data-scrollable-column]');
      
      // If we're over a scrollable column and it can still scroll, let it handle the scroll
      if (isOverScrollableContent) {
        const scrollableElement = isOverScrollableContent as HTMLElement;
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
        
        // Check if the column can scroll in the direction we're trying to scroll
        const canScrollDown = e.deltaY > 0 && scrollTop < scrollHeight - clientHeight;
        const canScrollUp = e.deltaY < 0 && scrollTop > 0;
        
        // If the column can handle the scroll, let it
        if (canScrollDown || canScrollUp) {
          return;
        }
      }
      
      // Only handle horizontal scrolling if there's vertical scroll input
      if (e.deltaY !== 0) {
        e.preventDefault();
        kanbanElement.scrollLeft += e.deltaY;
      }
    };

    kanbanElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      kanbanElement.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Group agents by status
  const agentsByStatus = agents.reduce((acc, agent) => {
    if (!acc[agent.status]) {
      acc[agent.status] = [];
    }
    acc[agent.status].push(agent);
    return acc;
  }, {} as Record<AgentStatus, Agent[]>);

  const statusOrder: AgentStatus[] = ['ideas', 'todo', 'doing', 'need_clarification', 'review', 'accepted', 'rejected'];
  
  // Filter which columns to show based on status filter
  const columnsToShow = statusFilter === 'all' 
    ? statusOrder 
    : statusOrder.filter(status => status === statusFilter || (agentsByStatus[status] && agentsByStatus[status].length > 0));

  // Show empty state if no agents match the current filter
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No agents match your filters</p>
        <p className="text-sm">Try adjusting your search or status filter</p>
      </div>
    );
  }

  return (
    <div ref={kanbanRef} className="flex gap-4 overflow-x-auto pb-4 h-full">
      {columnsToShow.map((status) => {
        const statusAgents = agentsByStatus[status] || [];
        const config = STATUS_CONFIG[status];
        
        return (
          <div key={status} className="flex-shrink-0 w-80 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    {config.label}
                  </CardTitle>
                  <Badge variant="outline" className={`${config.color} border-transparent`}>
                    {statusAgents.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent 
                className="flex-1 space-y-3 overflow-y-auto min-h-0" 
                data-scrollable-column="true"
              >
                {statusAgents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No agents</p>
                  </div>
                ) : (
                  statusAgents.map((agent) => (
                    <div key={agent.id} className="transform transition-transform hover:scale-[1.02]">
                      <AgentCard
                        agent={agent}
                        onStart={onStart}
                        onStop={onStop}
                        onAccept={onAccept}
                        onReject={onReject}
                        onPromoteToTodo={onPromoteToTodo}
                        onDemoteToIdeas={onDemoteToIdeas}
                        onDelete={onDelete}
                        onViewDetails={onViewDetails}
                        onAddMessage={onAddMessage}
                        compact
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};
