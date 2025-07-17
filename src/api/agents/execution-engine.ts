import { agentDB, type AgentSession, type AgentStatus, type AgentProgress } from './database';
import { fileLockManager, type LockResult } from './file-lock-manager';
import { EventEmitter } from 'events';
import { CoreMessage } from 'ai';

export interface AgentExecutionContext {
  sessionId: string;
  session: AgentSession;
  currentStep: number;
  activeLocks: string[];
  abortController: AbortController;
}

export interface AgentExecutionOptions {
  maxSteps?: number;
  stepTimeoutMs?: number;
  autoRetry?: boolean;
  retryAttempts?: number;
}

export type AgentExecutionEvent = 
  | { type: 'statusChanged'; sessionId: string; status: AgentStatus; previousStatus: AgentStatus }
  | { type: 'stepStarted'; sessionId: string; step: number; description: string }
  | { type: 'stepCompleted'; sessionId: string; step: number; result: any }
  | { type: 'stepFailed'; sessionId: string; step: number; error: string }
  | { type: 'lockConflict'; sessionId: string; filePath: string; conflictingSession: string }
  | { type: 'needsClarification'; sessionId: string; reason: string; details: any }
  | { type: 'executionComplete'; sessionId: string; success: boolean }
  | { type: 'executionAborted'; sessionId: string; reason: string };

class AgentExecutionEngine extends EventEmitter {
  private static instance: AgentExecutionEngine;
  private activeExecutions = new Map<string, AgentExecutionContext>();
  private executionQueue: string[] = [];
  private maxConcurrentExecutions = 3;

  private constructor() {
    super();
    
    // Listen to file lock events
    fileLockManager.on('lockConflict', this.handleLockConflict.bind(this));
    fileLockManager.on('lockAcquired', this.handleLockAcquired.bind(this));
  }

  static getInstance(): AgentExecutionEngine {
    if (!AgentExecutionEngine.instance) {
      AgentExecutionEngine.instance = new AgentExecutionEngine();
    }
    return AgentExecutionEngine.instance;
  }

  async startExecution(sessionId: string, options: AgentExecutionOptions = {}): Promise<boolean> {
    const session = agentDB.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Check if session is in a state that can be executed
    if (!['todo', 'need_clarification'].includes(session.status)) {
      throw new Error(`Cannot start execution for session in status: ${session.status}`);
    }

    // Check if already executing
    if (this.activeExecutions.has(sessionId)) {
      throw new Error(`Session ${sessionId} is already executing`);
    }

    // Update status to doing
    this.updateSessionStatus(sessionId, 'doing', { startedAt: new Date().toISOString() });

    // Create execution context
    const context: AgentExecutionContext = {
      sessionId,
      session,
      currentStep: 0,
      activeLocks: [],
      abortController: new AbortController(),
    };

    this.activeExecutions.set(sessionId, context);

    try {
      // Add progress tracking
      this.addProgress(sessionId, 'Execution started', 'running');

      // Start the execution
      const success = await this.executeAgent(context, options);
      
      // Don't automatically change status here - let the agent API handle status changes
      // through tool calls (finishWork, requireClarification, etc.)
      if (success) {
        this.addProgress(sessionId, 'Agent stream completed successfully', 'completed');
        this.emit('executionComplete', { type: 'executionComplete', sessionId, success: true });
      } else {
        // Only set to need_clarification if the agent didn't already set a status
        const currentSession = agentDB.getSession(sessionId);
        if (currentSession?.status === 'doing') {
          this.updateSessionStatus(sessionId, 'need_clarification');
          this.addProgress(sessionId, 'Execution failed - needs clarification', 'failed');
        }
        this.emit('executionComplete', { type: 'executionComplete', sessionId, success: false });
      }

      return success;
    } catch (error) {
      this.handleExecutionError(sessionId, error);
      return false;
    } finally {
      // Clean up
      this.cleanupExecution(sessionId);
    }
  }

  async abortExecution(sessionId: string, reason: string = 'Manual abort'): Promise<void> {
    const context = this.activeExecutions.get(sessionId);
    if (!context) {
      return; // Not executing
    }

    context.abortController.abort();
    this.updateSessionStatus(sessionId, 'need_clarification');
    this.addProgress(sessionId, `Execution aborted: ${reason}`, 'failed');
    this.emit('executionAborted', { type: 'executionAborted', sessionId, reason });
    
    this.cleanupExecution(sessionId);
  }

  private async executeAgent(context: AgentExecutionContext, options: AgentExecutionOptions): Promise<boolean> {
    const { sessionId } = context;
    const maxSteps = options.maxSteps || 50;

    // Get existing messages for this session
    const existingMessages = agentDB.getMessages(sessionId);
    
    // Convert database messages to CoreMessage format
    const messages: CoreMessage[] = existingMessages
      .filter(msg => msg.role !== 'tool') // Filter out tool result messages
      .map(msg => ({
        role: msg.role as any,
        content: msg.content,
      }));

    try {
      // Import the agent API to continue execution
      const { agentApi } = await import('./index');
      
      this.addProgress(sessionId, 'Starting AI agent execution', 'running');
      
      // Execute the agent with session context
      const response = await agentApi({ messages, sessionId });
      
      // The agentApi handles all the message storage and progress tracking
      this.addProgress(sessionId, 'AI agent execution completed', 'completed');
      
      return true;
      
    } catch (error) {
      console.error('Agent execution error:', error);
      this.addProgress(sessionId, 'Agent execution failed', 'failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  private handleLockConflict(event: any): void {
    const { sessionId, filePath, conflictingSession } = event;
    
    const context = this.activeExecutions.get(sessionId);
    if (!context) return;

    // Move session to need_clarification status
    this.updateSessionStatus(sessionId, 'need_clarification');
    this.addProgress(sessionId, `File lock conflict on ${filePath}`, 'failed', 
      `Cannot access file ${filePath} - locked by session ${conflictingSession}`);
    
    this.emit('lockConflict', { 
      type: 'lockConflict', 
      sessionId, 
      filePath, 
      conflictingSession 
    });

    // Abort current execution
    this.abortExecution(sessionId, `File lock conflict on ${filePath}`);
  }

  private handleLockAcquired(event: any): void {
    const { sessionId, lockId } = event;
    
    const context = this.activeExecutions.get(sessionId);
    if (context && lockId) {
      context.activeLocks.push(lockId);
    }
  }

  private updateSessionStatus(sessionId: string, status: AgentStatus, additionalData?: any): void {
    const previousSession = agentDB.getSession(sessionId);
    if (!previousSession) return;

    agentDB.updateSessionStatus(sessionId, status, additionalData);
    
    this.emit('statusChanged', { 
      type: 'statusChanged', 
      sessionId, 
      status, 
      previousStatus: previousSession.status 
    });
  }

  private addProgress(sessionId: string, step: string, status: AgentProgress['status'], details?: string): void {
    agentDB.addProgress({ sessionId, step, status, details });
  }

  private handleExecutionError(sessionId: string, error: any): void {
    console.error(`Agent execution error for session ${sessionId}:`, error);
    
    this.updateSessionStatus(sessionId, 'need_clarification');
    this.addProgress(sessionId, 'Execution failed', 'failed', error.message || 'Unknown error');
    
    this.emit('executionComplete', { type: 'executionComplete', sessionId, success: false });
  }

  private cleanupExecution(sessionId: string): void {
    const context = this.activeExecutions.get(sessionId);
    if (!context) return;

    // Release all locks held by this session
    fileLockManager.releaseAllSessionLocks(sessionId);

    // Remove from active executions
    this.activeExecutions.delete(sessionId);

    // Process queue if there are waiting executions
    this.processExecutionQueue();
  }

  private processExecutionQueue(): void {
    if (this.activeExecutions.size >= this.maxConcurrentExecutions) {
      return; // At capacity
    }

    const nextSessionId = this.executionQueue.shift();
    if (nextSessionId) {
      // Start next execution
      this.startExecution(nextSessionId).catch(console.error);
    }
  }

  // Public methods for managing executions
  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }

  isExecuting(sessionId: string): boolean {
    return this.activeExecutions.has(sessionId);
  }

  getExecutionContext(sessionId: string): AgentExecutionContext | undefined {
    return this.activeExecutions.get(sessionId);
  }

  // Queue management
  queueExecution(sessionId: string): void {
    if (!this.executionQueue.includes(sessionId) && !this.activeExecutions.has(sessionId)) {
      this.executionQueue.push(sessionId);
      this.processExecutionQueue();
    }
  }

  getQueuePosition(sessionId: string): number {
    return this.executionQueue.indexOf(sessionId);
  }
}

export const agentExecutionEngine = AgentExecutionEngine.getInstance();
