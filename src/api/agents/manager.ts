import { agentDB, type AgentSession, type AgentStatus } from './database';
import { agentExecutionEngine, type AgentExecutionOptions } from './execution-engine';
import { fileLockManager } from './file-lock-manager';
import { fileSnapshotManager } from './file-snapshot-manager';
import { EventEmitter } from 'events';

export interface CreateAgentRequest {
  name: string;
  description: string;
  projectPath: string;
  projectName?: string; // Display name for the project
  workspaceRoot?: string; // Root workspace if project is part of a larger workspace
  initialPrompt?: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  projectPath: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
  progress?: {
    currentStep?: string;
    totalSteps?: number;
    completedSteps?: number;
  };
}

class AgentManager extends EventEmitter {
  private static instance: AgentManager;

  private constructor() {
    super();
    
    // Forward execution engine events
    agentExecutionEngine.on('statusChanged', (event) => this.emit('agentStatusChanged', event));
    agentExecutionEngine.on('stepStarted', (event) => this.emit('agentStepStarted', event));
    agentExecutionEngine.on('stepCompleted', (event) => this.emit('agentStepCompleted', event));
    agentExecutionEngine.on('stepFailed', (event) => this.emit('agentStepFailed', event));
    agentExecutionEngine.on('lockConflict', (event) => this.emit('agentLockConflict', event));
    agentExecutionEngine.on('needsClarification', (event) => this.emit('agentNeedsClarification', event));
    agentExecutionEngine.on('executionComplete', (event) => this.emit('agentExecutionComplete', event));
    agentExecutionEngine.on('executionAborted', (event) => this.emit('agentExecutionAborted', event));
  }

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  // Agent CRUD operations
  async createAgent(request: CreateAgentRequest): Promise<AgentSession> {
    const session = agentDB.createSession({
      name: request.name,
      description: request.description,
      status: 'ideas',
      projectPath: request.projectPath,
      projectName: request.projectName,
      workspaceRoot: request.workspaceRoot,
    });

    // Add initial message if provided
    if (request.initialPrompt) {
      agentDB.addMessage({
        sessionId: session.id,
        role: 'user',
        content: request.initialPrompt,
        stepIndex: 0,
      });
    }

    this.emit('agentCreated', { sessionId: session.id, session });
    return session;
  }

  getAgent(sessionId: string): AgentSession | null {
    return agentDB.getSession(sessionId);
  }

  listAgents(projectPath?: string, status?: AgentStatus): AgentSummary[] {
    const sessions = agentDB.listSessions(projectPath, status);
    
    return sessions.map(session => {
      const progress = agentDB.getProgress(session.id);
      const completedSteps = progress.filter(p => p.status === 'completed').length;
      const currentStep = progress.find(p => p.status === 'running')?.step;
      
      return {
        id: session.id,
        name: session.name,
        description: session.description,
        status: session.status,
        projectPath: session.projectPath,
        projectName: session.projectName,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        progress: {
          currentStep,
          totalSteps: progress.length,
          completedSteps,
        },
      };
    });
  }

  async updateAgentStatus(sessionId: string, status: AgentStatus, additionalData?: Partial<AgentSession>): Promise<void> {
    const session = agentDB.getSession(sessionId);
    if (!session) {
      throw new Error(`Agent session not found: ${sessionId}`);
    }

    // Handle status transitions
    switch (status) {
      case 'doing':
        if (!['todo', 'need_clarification'].includes(session.status)) {
          throw new Error(`Cannot start execution from status: ${session.status}`);
        }
        break;
        
      case 'accepted':
        if (session.status !== 'review') {
          throw new Error(`Cannot accept agent that is not in review status`);
        }
        // Accept all pending file snapshots for this session
        await this.acceptAllFileChanges(sessionId);
        break;
        
      case 'rejected':
        if (session.status !== 'review') {
          throw new Error(`Cannot reject agent that is not in review status`);
        }
        // Revert all pending file snapshots for this session
        await this.revertAllFileChanges(sessionId);
        break;
    }

    agentDB.updateSessionStatus(sessionId, status, additionalData);
    this.emit('agentStatusChanged', { sessionId, status, previousStatus: session.status });
  }

  // Execution control
  async startAgent(sessionId: string, options?: AgentExecutionOptions): Promise<boolean> {
    const session = agentDB.getSession(sessionId);
    if (!session) {
      throw new Error(`Agent session not found: ${sessionId}`);
    }

    return agentExecutionEngine.startExecution(sessionId, options);
  }

  async stopAgent(sessionId: string, reason?: string): Promise<void> {
    return agentExecutionEngine.abortExecution(sessionId, reason);
  }

  isAgentRunning(sessionId: string): boolean {
    return agentExecutionEngine.isExecuting(sessionId);
  }

  getRunningAgents(): string[] {
    return agentExecutionEngine.getActiveExecutions();
  }

  // Messages and communication
  async addMessage(sessionId: string, role: 'user' | 'system', content: string): Promise<void> {
    const session = agentDB.getSession(sessionId);
    if (!session) {
      throw new Error(`Agent session not found: ${sessionId}`);
    }

    const messages = agentDB.getMessages(sessionId);
    const stepIndex = messages.length > 0 ? Math.max(...messages.map(m => m.stepIndex)) + 1 : 0;

    agentDB.addMessage({
      sessionId,
      role,
      content,
      stepIndex,
    });

    this.emit('agentMessageAdded', { sessionId, role, content });

    // If agent was in need_clarification and user provided input, move to todo
    if (session.status === 'need_clarification' && role === 'user') {
      await this.updateAgentStatus(sessionId, 'todo');
    }
  }

  getMessages(sessionId: string, limit?: number) {
    return agentDB.getMessages(sessionId, limit);
  }

  getProgress(sessionId: string) {
    return agentDB.getProgress(sessionId);
  }

  // File conflict management
  async checkFileConflicts(sessionId: string, filePaths: string[]): Promise<{
    conflicts: string[];
    canProceed: boolean;
    suggestions?: string[];
  }> {
    const conflicts = fileLockManager.getFileConflicts(sessionId, filePaths);
    
    const suggestions: string[] = [];
    if (conflicts.length > 0) {
      suggestions.push('Wait for other agents to complete');
      suggestions.push('Modify scope to avoid conflicting files');
      suggestions.push('Coordinate with other agent owners');
    }

    return {
      conflicts,
      canProceed: conflicts.length === 0,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  // Project-level operations
  async getProjectAgentSummary(projectPath: string): Promise<{
    total: number;
    byStatus: Record<AgentStatus, number>;
    running: number;
    recentActivity: AgentSummary[];
  }> {
    const summary = agentDB.getProjectSummary(projectPath);
    const runningAgents = this.getRunningAgents();
    const projectRunningCount = runningAgents.filter(agentId => {
      const session = agentDB.getSession(agentId);
      return session?.projectPath === projectPath;
    }).length;

    const recentActivity = summary.recentActivity.map(session => {
      const progress = agentDB.getProgress(session.id);
      const completedSteps = progress.filter(p => p.status === 'completed').length;
      const currentStep = progress.find(p => p.status === 'running')?.step;
      
      return {
        id: session.id,
        name: session.name,
        description: session.description,
        status: session.status,
        projectPath: session.projectPath,
        projectName: session.projectName,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        progress: {
          currentStep,
          totalSteps: progress.length,
          completedSteps,
        },
      };
    });

    return {
      total: summary.totalAgents,
      byStatus: summary.byStatus,
      running: projectRunningCount,
      recentActivity,
    };
  }

  // Multi-project operations
  getAllProjects(): Array<{ 
    projectPath: string; 
    projectName?: string; 
    agentCount: number; 
    lastActivity: string;
    runningAgents: number;
  }> {
    const projects = agentDB.getAllProjects();
    const runningAgents = this.getRunningAgents();
    
    return projects.map(project => {
      const projectRunningCount = runningAgents.filter(agentId => {
        const session = agentDB.getSession(agentId);
        return session?.projectPath === project.projectPath;
      }).length;
      
      return {
        ...project,
        runningAgents: projectRunningCount,
      };
    });
  }

  async switchProject(newProjectPath: string): Promise<{
    agents: AgentSummary[];
    summary: any;
    conflicts: string[];
  }> {
    // Stop any running agents from the current project if needed
    const runningAgents = this.getRunningAgents();
    const currentProjectAgents = runningAgents.filter(agentId => {
      const session = agentDB.getSession(agentId);
      return session && session.projectPath !== newProjectPath;
    });

    // Optionally pause/stop agents from other projects
    // (You might want to make this configurable)
    
    // Get agents and summary for the new project
    const agents = this.listAgents(newProjectPath);
    const summary = await this.getProjectAgentSummary(newProjectPath);
    
    // Check for any immediate conflicts
    const conflicts: string[] = [];
    // This could check for file locks or other project-specific issues
    
    return {
      agents,
      summary,
      conflicts,
    };
  }

  async cleanupInactiveProjects(daysInactive: number = 30): Promise<string[]> {
    return agentDB.cleanupInactiveProjects(daysInactive);
  }

  // Cleanup operations
  async deleteAgent(sessionId: string): Promise<void> {
    const session = agentDB.getSession(sessionId);
    if (!session) {
      throw new Error(`Agent session not found: ${sessionId}`);
    }

    // Stop if running
    if (this.isAgentRunning(sessionId)) {
      await this.stopAgent(sessionId, 'Agent deleted');
    }

    // Release any held locks
    fileLockManager.releaseAllSessionLocks(sessionId);

    // TODO: Clean up any git worktrees or other resources

    // Delete from database (cascades to messages, locks, progress)
    agentDB.deleteSession(sessionId);
    
    this.emit('agentDeleted', { sessionId });
  }

  // File change management methods
  private async acceptAllFileChanges(sessionId: string): Promise<void> {
    try {
      console.log(`🎯 Starting to accept all file changes for session ${sessionId}`);
      await fileSnapshotManager.acceptAllSnapshots(sessionId);
      console.log(`✅ Successfully accepted all file changes for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to accept file changes for session ${sessionId}:`, error);
      throw new Error(`Failed to accept file changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async revertAllFileChanges(sessionId: string): Promise<void> {
    try {
      console.log(`🎯 Starting to revert all file changes for session ${sessionId}`);
      await fileSnapshotManager.revertAllSnapshots(sessionId);
      console.log(`✅ Successfully reverted all file changes for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to revert file changes for session ${sessionId}:`, error);
      throw new Error(`Failed to revert file changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Debug method to inspect file snapshots for a session
  getFileSnapshots(sessionId: string) {
    return fileSnapshotManager.getSessionSnapshots(sessionId);
  }
}

export const agentManager = AgentManager.getInstance();
