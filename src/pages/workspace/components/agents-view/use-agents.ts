import { useState, useEffect, useCallback, useRef } from 'react';
import { Agent, CreateAgentRequest, AgentStatus } from './types';
import { agentIpc } from './agent-ipc';
import { toast } from 'sonner';

export const useAgents = (currentProjectPath?: string) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Load agents for current project
  const loadAgents = useCallback(async (silent = false) => {
    console.log('loadAgents called with:', { currentProjectPath, silent });
    
    if (!currentProjectPath) {
      console.log('No project path, clearing agents');
      setAgents([]);
      setLoading(false);
      return;
    }
    
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      
      console.log('Calling agentIpc.listAgents...');
      const agentsData = await agentIpc.listAgents(currentProjectPath);
      console.log('Got agents data:', agentsData);
      
      if (mountedRef.current) {
        setAgents(agentsData);
        console.log('Set agents to state');
      }
    } catch (err) {
      console.error('Error in loadAgents:', err);
      if (mountedRef.current) {
        if (err instanceof Error && err.message.includes('Agent API not available')) {
          setError('Agent system not available. Please ensure you are running in the full Electron environment.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load agents');
        }
      }
    } finally {
      if (!silent && mountedRef.current) {
        console.log('Setting loading to false');
        setLoading(false);
      }
    }
  }, [currentProjectPath]);

  // Start polling for running agents
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Check if there are any running agents
        const runningAgents = await agentIpc.getRunningAgents();
        console.log('Polling check: running agents count:', runningAgents.length);
        
        if (runningAgents.length > 0) {
          // If there are running agents, refresh the agent list silently
          await loadAgents(true);
        } else {
          // No running agents, stop polling
          console.log('No running agents detected, stopping polling');
          stopPolling();
        }
      } catch (err) {
        // Silently fail for polling - don't update error state
        console.warn('Polling failed:', err);
      }
    }, 1000); // Poll every 1 second for more responsive updates
  }, [loadAgents]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

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
      // Start polling since we now have a running agent
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start agent');
      throw err;
    }
  }, [startPolling]);

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
      // Check if we need to stop polling after a short delay
      setTimeout(async () => {
        try {
          const runningAgents = await agentIpc.getRunningAgents();
          console.log('After stopping agent: running agents count:', runningAgents.length);
          if (runningAgents.length === 0) {
            console.log('No more running agents after stop, stopping polling');
            stopPolling();
          }
        } catch (err) {
          console.warn('Failed to check running agents after stop:', err);
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop agent');
      throw err;
    }
  }, [stopPolling]);

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

  // Demote agent from todo to ideas
  const demoteToIdeas = useCallback(async (agentId: string) => {
    try {
      await agentIpc.updateAgentStatus(agentId, 'ideas');
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'ideas' as AgentStatus, updatedAt: new Date().toISOString() }
          : agent
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to demote agent to ideas');
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

  // Set up real-time event listeners and polling
  useEffect(() => {
    mountedRef.current = true;
    const cleanupFunctions: (() => void)[] = [];

    // Helper function to update agent and show notifications
    const updateAgentStatus = (sessionId: string, status: string, showToast = true) => {
      setAgents(prev => {
        const updatedAgents = prev.map(agent => 
          agent.id === sessionId 
            ? { ...agent, status: status as AgentStatus, updatedAt: new Date().toISOString() }
            : agent
        );
        
        if (showToast) {
          const agent = updatedAgents.find(a => a.id === sessionId);
          const agentName = agent?.name || 'Agent';
          
          switch (status) {
            case 'doing':
              toast.success(`${agentName} started running`, {
                description: 'Agent execution has begun',
                duration: 3000,
              });
              break;
            case 'review':
              toast.info(`${agentName} completed and needs review`, {
                description: 'Click to review the results',
                duration: 5000,
              });
              break;
            case 'accepted':
              toast.success(`${agentName} results accepted`, {
                description: 'Agent task completed successfully',
                duration: 3000,
              });
              break;
            case 'rejected':
              toast.warning(`${agentName} results rejected`, {
                description: 'Agent task was rejected',
                duration: 3000,
              });
              break;
            case 'need_clarification':
              toast.warning(`${agentName} stopped`, {
                description: 'Agent execution was stopped',
                duration: 3000,
              });
              break;
          }
        }
        
        return updatedAgents;
      });
    };

    // Listen for general status changes
    const statusCleanup = agentIpc.onStatusChanged((data: any) => {
      console.log('Agent status changed:', data);
      updateAgentStatus(data.sessionId, data.status);
      
      // If agent finished (not doing anymore), check if we should stop polling
      if (data.status !== 'doing') {
        setTimeout(async () => {
          try {
            const runningAgents = await agentIpc.getRunningAgents();
            console.log('Running agents after status change:', runningAgents.length);
            if (runningAgents.length === 0) {
              console.log('No more running agents, stopping polling');
              stopPolling();
            }
          } catch (err) {
            console.warn('Failed to check running agents:', err);
          }
        }, 100);
      }
    });
    cleanupFunctions.push(statusCleanup);

    // Listen for execution completion (when agent finishes work)
    const executionCompleteCleanup = agentIpc.onExecutionComplete((data: any) => {
      console.log('Agent execution completed:', data);
      // Don't override status - let statusChanged events handle that
      // Force refresh to ensure we get the latest state
      setTimeout(() => loadAgents(true), 500);
    });
    cleanupFunctions.push(executionCompleteCleanup);

    // Listen for when agent needs clarification
    const needsClarificationCleanup = agentIpc.onNeedsClarification((data: any) => {
      console.log('Agent needs clarification:', data);
      updateAgentStatus(data.sessionId, 'need_clarification');
    });
    cleanupFunctions.push(needsClarificationCleanup);

    // Listen for execution aborted/stopped
    const executionAbortedCleanup = agentIpc.onExecutionAborted((data: any) => {
      console.log('Agent execution aborted:', data);
      updateAgentStatus(data.sessionId, 'need_clarification');
    });
    cleanupFunctions.push(executionAbortedCleanup);

    // Listen for step completion (to update progress)
    const stepCleanup = agentIpc.onStepCompleted((data: any) => {
      console.log('Agent step completed:', data);
      setAgents(prev => {
        const updatedAgents = prev.map(agent => {
          if (agent.id === data.sessionId && agent.progress) {
            return {
              ...agent,
              progress: {
                ...agent.progress,
                completedSteps: (agent.progress.completedSteps || 0) + 1,
                currentStep: data.step || agent.progress.currentStep
              },
              updatedAt: new Date().toISOString()
            };
          }
          return agent;
        });
        
        // Show progress toast notification
        const agent = updatedAgents.find(a => a.id === data.sessionId);
        // Temporarily disabled toasts to debug
        /*
        if (agent && data.step) {
          toast.info(`${agent.name} completed step`, {
            description: data.step,
            duration: 2000,
          });
        }
        */
        
        return updatedAgents;
      });
    });
    cleanupFunctions.push(stepCleanup);

    // Listen for step started (to update current step)
    const stepStartedCleanup = agentIpc.onStepStarted((data: any) => {
      console.log('Agent step started:', data);
      setAgents(prev => prev.map(agent => {
        if (agent.id === data.sessionId) {
          return {
            ...agent,
            progress: {
              ...agent.progress,
              currentStep: data.step || data.description
            },
            updatedAt: new Date().toISOString()
          };
        }
        return agent;
      }));
    });
    cleanupFunctions.push(stepStartedCleanup);

    // Check for running agents on mount and start polling if needed
    const checkRunningAgents = async () => {
      try {
        const runningAgents = await agentIpc.getRunningAgents();
        console.log('Initial check: running agents count:', runningAgents.length);
        if (runningAgents.length > 0) {
          console.log('Found running agents on mount, starting polling');
          startPolling();
        }
      } catch (err) {
        console.warn('Failed to check running agents on mount:', err);
      }
    };
    checkRunningAgents();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      cleanupFunctions.forEach((cleanup: () => void) => cleanup());
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Manual refresh that forces update and checks for running agents
  const forceRefresh = useCallback(async () => {
    // Temporarily disabled toast to debug
    // toast.info('Refreshing agents...', {
    //   duration: 1000,
    // });
    
    await loadAgents(false);
    try {
      const runningAgents = await agentIpc.getRunningAgents();
      console.log('Force refresh: running agents count:', runningAgents.length);
      if (runningAgents.length > 0 && !pollingIntervalRef.current) {
        console.log('Starting polling after force refresh');
        startPolling();
        // toast.success('Real-time updates enabled', {
        //   description: 'Found running agents, now polling for updates',
        //   duration: 2000,
        // });
      } else if (runningAgents.length === 0 && pollingIntervalRef.current) {
        console.log('Stopping polling after force refresh');
        stopPolling();
        // toast.info('Real-time updates disabled', {
        //   description: 'No running agents found',
        //   duration: 2000,
        // });
      }
    } catch (err) {
      console.warn('Failed to check running agents during force refresh:', err);
    }
  }, [loadAgents, startPolling, stopPolling]);

  // Load agents on mount and when project changes
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Monitor agent states and manage polling
  useEffect(() => {
    const runningAgents = agents.filter(agent => agent.status === 'doing');
    
    if (runningAgents.length > 0 && !pollingIntervalRef.current) {
      console.log('Starting polling due to running agents detected');
      startPolling();
    } else if (runningAgents.length === 0 && pollingIntervalRef.current) {
      console.log('Stopping polling due to no running agents');
      stopPolling();
    }
  }, [agents, startPolling, stopPolling]);

  return {
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
    reload: forceRefresh
  };
};
