import { EventEmitter } from 'events';
import { AgentStatusUpdate } from '@/helpers/ipc/agents/agent-context';

export interface AgentInstance {
  taskId: string;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'error';
  workStatus?: 'not-started' | 'in-progress' | 'paused' | 'blocked' | 'testing' | 'finalizing';
  progress?: number;
  currentStep?: string;
  error?: string;
  startTime?: Date;
  lastUpdateTime?: Date;
}

export class AgentManager extends EventEmitter {
  private agents: Map<string, AgentInstance> = new Map();

  constructor() {
    super();
  }

  async startAgent(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const agent: AgentInstance = {
        taskId,
        status: 'running',
        workStatus: 'not-started',
        progress: 0,
        currentStep: 'Starting',
        startTime: new Date(),
        lastUpdateTime: new Date()
      };

      this.agents.set(taskId, agent);
      this.emitStatusUpdate(agent);

      // TODO: Implement actual agent startup logic
      // This would involve:
      // 1. Creating a git worktree for the task
      // 2. Setting up the agent's working environment
      // 3. Starting the agent's execution loop
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async stopAgent(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const agent = this.agents.get(taskId);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      agent.status = 'stopped';
      agent.lastUpdateTime = new Date();
      this.emitStatusUpdate(agent);

      // TODO: Implement actual agent shutdown logic
      // This would involve:
      // 1. Gracefully stopping the agent's execution
      // 2. Cleaning up resources
      // 3. Optionally preserving work in progress
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async pauseAgent(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const agent = this.agents.get(taskId);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      agent.status = 'paused';
      agent.workStatus = 'paused';
      agent.lastUpdateTime = new Date();
      this.emitStatusUpdate(agent);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async resumeAgent(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const agent = this.agents.get(taskId);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      agent.status = 'running';
      agent.workStatus = 'in-progress';
      agent.lastUpdateTime = new Date();
      this.emitStatusUpdate(agent);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  getAgent(taskId: string): AgentInstance | undefined {
    return this.agents.get(taskId);
  }

  getAllAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  onStatusUpdate(callback: (update: AgentStatusUpdate) => void) {
    this.on('statusUpdate', callback);
  }

  updateAgentProgress(taskId: string, progress: number, currentStep?: string) {
    const agent = this.agents.get(taskId);
    if (agent) {
      agent.progress = progress;
      agent.currentStep = currentStep;
      agent.lastUpdateTime = new Date();
      this.emitStatusUpdate(agent);
    }
  }

  updateAgentWorkStatus(taskId: string, workStatus: AgentInstance['workStatus']) {
    const agent = this.agents.get(taskId);
    if (agent) {
      agent.workStatus = workStatus;
      agent.lastUpdateTime = new Date();
      this.emitStatusUpdate(agent);
    }
  }

  setAgentError(taskId: string, error: string) {
    const agent = this.agents.get(taskId);
    if (agent) {
      agent.status = 'error';
      agent.error = error;
      agent.lastUpdateTime = new Date();
      this.emitStatusUpdate(agent);
    }
  }

  private emitStatusUpdate(agent: AgentInstance) {
    const update: AgentStatusUpdate = {
      taskId: agent.taskId,
      status: agent.status,
      workStatus: agent.workStatus,
      progress: agent.progress,
      currentStep: agent.currentStep,
      error: agent.error
    };
    
    this.emit('statusUpdate', update);
  }
}
