import React, { useState } from 'react';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { AgentCard } from './agent-card';
import { AgentKanban } from './agent-kanban';
import { Agent, AgentStatus } from './types';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';

interface AgentListProps {
  agents: Agent[];
  loading: boolean;
  onStart: (agentId: string) => Promise<void>;
  onStop: (agentId: string) => Promise<void>;
  onAccept: (agentId: string) => Promise<void>;
  onReject: (agentId: string) => Promise<void>;
  onPromoteToTodo: (agentId: string) => Promise<void>;
  onDemoteToIdeas: (agentId: string) => Promise<void>;
  onDelete: (agentId: string) => Promise<void>;
  onViewDetails: (agentId: string) => void;
  onAddMessage: (agentId: string) => void;
}

export const AgentList: React.FC<AgentListProps> = ({
  agents,
  loading,
  onStart,
  onStop,
  onAccept,
  onReject,
  onPromoteToTodo,
  onDemoteToIdeas,
  onDelete,
  onViewDetails,
  onAddMessage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Filter agents based on search and status
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = searchQuery === '' || 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status counts for filter badges
  const statusCounts = agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1;
    return acc;
  }, {} as Record<AgentStatus, number>);

  const runningCount = statusCounts.doing || 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AgentStatus | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ideas">Ideas ({statusCounts.ideas || 0})</SelectItem>
                <SelectItem value="todo">Todo ({statusCounts.todo || 0})</SelectItem>
                <SelectItem value="doing">Running ({statusCounts.doing || 0})</SelectItem>
                <SelectItem value="need_clarification">Needs Clarification ({statusCounts.need_clarification || 0})</SelectItem>
                <SelectItem value="review">Review ({statusCounts.review || 0})</SelectItem>
                <SelectItem value="accepted">Accepted ({statusCounts.accepted || 0})</SelectItem>
                <SelectItem value="rejected">Rejected ({statusCounts.rejected || 0})</SelectItem>
              </SelectContent>
            </Select>
            
            {/* View Mode Toggle */}
            <div className="flex border rounded-md p-1 bg-muted/30">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7 px-2"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="h-7 px-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Kanban View</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Status Summary - only show in list view */}
        {viewMode === 'list' && agents.length > 0 && (
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Badge variant="outline" className="gap-1">
              Total: {agents.length}
            </Badge>
            {runningCount > 0 && (
              <Badge variant="default" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Running: {runningCount}
              </Badge>
            )}
            {(statusCounts.review || 0) > 0 && (
              <Badge variant="outline" className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                Ready for Review: {statusCounts.review}
              </Badge>
            )}
            {(statusCounts.need_clarification || 0) > 0 && (
              <Badge variant="outline" className="gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                Need Clarification: {statusCounts.need_clarification}
              </Badge>
            )}
          </div>
        )}

        {/* Render view based on mode */}
        <div className="flex-1 min-h-0">
          {viewMode === 'kanban' ? (
            <AgentKanban
              agents={filteredAgents}
              statusFilter={statusFilter}
              onStart={onStart}
              onStop={onStop}
              onAccept={onAccept}
              onReject={onReject}
              onPromoteToTodo={onPromoteToTodo}
              onDemoteToIdeas={onDemoteToIdeas}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              onAddMessage={onAddMessage}
            />
          ) : (
            /* Agent Cards - List View */
            <div className="h-full overflow-y-auto">
              {filteredAgents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {agents.length === 0 ? (
                    <div>
                      <p className="text-lg font-medium mb-2">No agents yet</p>
                      <p className="text-sm">Create your first AI agent to get started</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">No agents match your filters</p>
                      <p className="text-sm">Try adjusting your search or status filter</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {filteredAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
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
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
