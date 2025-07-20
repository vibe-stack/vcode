import React, { useState } from "react";
import { CreateAgentForm } from './create-agent-form';
import { AgentList } from './agent-list';
import { AgentDetailsSheet } from './agent-details-sheet';
import { Agent } from './types';
import { Bot, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { useProjectStore } from '@/stores/project';
import { useAgents } from "./use-agents";

export const AgentsView = () => {
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
    
    const { currentProject, projectName } = useProjectStore();
    
    const {
        agents,
        loading,
        error,
        isPolling,
        createAgent,
        startAgent,
        stopAgent,
        acceptAgent,
        rejectAgent,
        promoteToTodo,
        demoteToIdeas,
        deleteAgent,
        reload
    } = useAgents(currentProject || undefined);

    const handleCreateAgent = async (request: any) => {
        await createAgent(request);
    };

    const handleViewDetails = (agentId: string) => {
        const agent = agents.find((a: Agent) => a.id === agentId);
        if (agent) {
            setSelectedAgent(agent);
            setDetailsSheetOpen(true);
        }
    };

    const handleAddMessage = (agentId: string) => {
        // For now, just open details modal to add message
        handleViewDetails(agentId);
    };

    const closeDetailsSheet = () => {
        setDetailsSheetOpen(false);
        setSelectedAgent(null);
    };

    return (
        <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5" />
                    <div>
                        <h1 className="text-lg font-semibold">Grok Agents</h1>
                        {isPolling && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Real-time updates active
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => reload()}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    
                    <CreateAgentForm
                        onCreateAgent={handleCreateAgent}
                        isLoading={loading}
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {error}
                            {error.includes('Agent API not available') && (
                                <div className="mt-2 text-sm">
                                    <p>The agent system requires the full Electron environment.</p>
                                    <p>This feature will be available when the backend is fully integrated.</p>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* No Project Selected */}
            {!currentProject && (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
                        <p className="text-muted-foreground">
                            Please select a project to manage AI agents.
                        </p>
                    </div>
                </div>
            )}

            {/* Agent List */}
            {currentProject && (
                <div className="flex-1 overflow-auto p-4">
                    <AgentList
                        agents={agents}
                        loading={loading}
                        onStart={startAgent}
                        onStop={stopAgent}
                        onAccept={acceptAgent}
                        onReject={rejectAgent}
                        onPromoteToTodo={promoteToTodo}
                        onDemoteToIdeas={demoteToIdeas}
                        onDelete={deleteAgent}
                        onViewDetails={handleViewDetails}
                        onAddMessage={handleAddMessage}
                    />
                </div>
            )}

            {/* Agent Details Sheet */}
            <AgentDetailsSheet
                agent={selectedAgent}
                open={detailsSheetOpen}
                onClose={closeDetailsSheet}
            />
        </div>
    );
};