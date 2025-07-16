import { useState, useEffect, useCallback } from 'react';
import { Agent, CreateAgentRequest, AgentStatus } from './types';
import { agentIpc } from './agent-ipc';

export const useAgents = (currentProjectPath?: string) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load agents for current project
  const loadAgents = useCallback(async () => {
    if (!currentProjectPath) {
      setAgents([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const agentsData = await agentIpc.listAgents(currentProjectPath);
      setAgents(agentsData);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Agent API not available')) {
        setError('Agent system not available. Please ensure you are running in the full Electron environment.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      }
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProjectPath]);

  // Create new agent
  const createAgent = useCallback(async (request: CreateAgentRequest) => {
    try {
      const newAgent = await agentIpc.createAgent(request);
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Agent API not available')) {
        setError('Agent system not available. Please ensure you are running in the full Electron environment.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create agent');
      }
      throw err;
    }
  }, []);

  // Start agent
  const startAgent = useCallback(async (agentId: string) => {
    try {
      await agentIpc.startAgent(agentId);
      // Update agent status optimistically
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'doing' as AgentStatus, updatedAt: new Date().toISOString() }
          : agent
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start agent');
      throw err;
    }
  }, []);

  // Stop agent
  const stopAgent = useCallback(async (agentId: string) => {
    try {
      await agentIpc.stopAgent(agentId);
      // Update agent status optimistically
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'need_clarification' as AgentStatus, updatedAt: new Date().toISOString() }
          : agent
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop agent');
      throw err;
    }
  }, []);

  // Accept agent results
  const acceptAgent = useCallback(async (agentId: string) => {
    try {
      await agentIpc.updateAgentStatus(agentId, 'accepted');
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'accepted' as AgentStatus, updatedAt: new Date().toISOString() }
          : agent
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept agent');
      throw err;
    }
  }, []);

  // Reject agent results
  const rejectAgent = useCallback(async (agentId: string) => {
    try {
      await agentIpc.updateAgentStatus(agentId, 'rejected');
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'rejected' as AgentStatus, updatedAt: new Date().toISOString() }
          : agent
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject agent');
      throw err;
    }
  }, []);

  // Promote agent from ideas to todo
  const promoteToTodo = useCallback(async (agentId: string) => {
    try {
      await agentIpc.updateAgentStatus(agentId, 'todo');
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'todo' as AgentStatus, updatedAt: new Date().toISOString() }
          : agent
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote agent to todo');
      throw err;
    }
  }, []);

  // Delete agent
  const deleteAgent = useCallback(async (agentId: string) => {
    try {
      await agentIpc.deleteAgent(agentId);
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
      throw err;
    }
  }, []);

  // Set up real-time event listeners
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Listen for status changes
    const statusCleanup = agentIpc.onStatusChanged((data: any) => {
      setAgents(prev => prev.map(agent => 
        agent.id === data.sessionId 
          ? { ...agent, status: data.status, updatedAt: new Date().toISOString() }
          : agent
      ));
    });
    cleanupFunctions.push(statusCleanup);

    // Listen for step completion (to update progress)
    const stepCleanup = agentIpc.onStepCompleted((data: any) => {
      setAgents(prev => prev.map(agent => {
        if (agent.id === data.sessionId && agent.progress) {
          return {
            ...agent,
            progress: {
              ...agent.progress,
              completedSteps: (agent.progress.completedSteps || 0) + 1
            },
            updatedAt: new Date().toISOString()
          };
        }
        return agent;
      }));
    });
    cleanupFunctions.push(stepCleanup);

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach((cleanup: () => void) => cleanup());
    };
  }, []);

  // Load agents on mount and when project changes
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  return {
    agents,
    loading,
    error,
    createAgent,
    startAgent,
    stopAgent,
    acceptAgent,
    rejectAgent,
    promoteToTodo,
    deleteAgent,
    reload: loadAgents
  };
};
