import React from 'react';

export type AgentStatus = 'ideas' | 'todo' | 'need_clarification' | 'doing' | 'review' | 'accepted' | 'rejected';

export interface Agent {
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

export interface CreateAgentRequest {
  name: string;
  description: string;
  projectPath: string;
  projectName?: string;
  initialPrompt?: string;
}

export interface AgentProgress {
  id: string;
  sessionId: string;
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
  timestamp: string;
}

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  stepIndex: number;
}
