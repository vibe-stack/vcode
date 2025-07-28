import { Message } from '@ai-sdk/react';

export interface AgentTool {
  name: string;
  description: string;
  parameters: any;
  execute: (args: any, context?: any) => Promise<any>;
  requiresConfirmation?: boolean;
}

export interface AgentChatConfig {
  name: string;
  title: string;
  apiEndpoint: string;
  systemPrompt?: string;
  models?: string[];
  tools?: AgentTool[];
  snapshots?: boolean;
  maxSteps?: number;
  customFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface EnhancedChatMessage extends Message {
  timestamp: Date;
  createdAt?: Date;
}

export interface PendingToolCall {
  id: string;
  toolName: string;
  args: any;
  timestamp: Date;
}

export interface ToolExecutor {
  getToolsRequiringConfirmation(): string[];
  executeApprovedTool(toolCallId: string, messages: any[], sessionId: string): Promise<string>;
  cancelTool(toolCallId: string): Promise<string>;
  addPendingCall(toolCallId: string, toolName: string, args: any): void;
  getPendingCall(toolCallId: string): PendingToolCall | undefined;
  getAllPendingCalls(): PendingToolCall[];
}

export interface ChatPersistence {
  saveCurrentSession(messages: EnhancedChatMessage[]): Promise<string>;
  updateSession(sessionId: string, messages: EnhancedChatMessage[]): Promise<void>;
  loadSession(sessionId: string): Promise<EnhancedChatMessage[]>;
  getRecentSessions(limit: number): Promise<any[]>;
  clearCurrentProjectSessions(): Promise<void>;
  cleanupOldSessions(): void;
}