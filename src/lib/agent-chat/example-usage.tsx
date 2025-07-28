import React from 'react';
import { AgentChatProvider, AgentChatConfig, AgentTool } from './index';

// Example: Simple calculator agent
const calculatorTools: AgentTool[] = [
  {
    name: 'add',
    description: 'Add two numbers',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' },
      },
      required: ['a', 'b']
    },
    execute: async (args) => {
      return args.a + args.b;
    },
    requiresConfirmation: false,
  },
  {
    name: 'multiply',
    description: 'Multiply two numbers',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' },
      },
      required: ['a', 'b']
    },
    execute: async (args) => {
      return args.a * args.b;
    },
    requiresConfirmation: false,
  },
];

const calculatorConfig: AgentChatConfig = {
  name: 'calculator',
  title: 'Math Assistant',
  apiEndpoint: '/api/general-agent',
  systemPrompt: 'You are a helpful math assistant. You can perform basic calculations using the provided tools.',
  tools: calculatorTools,
  snapshots: false, // Calculator doesn't need snapshots
  maxSteps: 10,
};

// Example usage:
export function CalculatorApp() {
  return (
    <AgentChatProvider config={calculatorConfig}>
      {/* Your calculator UI components here */}
      <div>
        {/* The UI components can use useAgentChatContext() to access chat functionality */}
      </div>
    </AgentChatProvider>
  );
}

// Example: File manager agent
const fileManagerTools: AgentTool[] = [
  {
    name: 'listFiles',
    description: 'List files in a directory',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
      },
      required: ['path']
    },
    execute: async (args) => {
      // In a real implementation, this would call an IPC method
      return `Files in ${args.path}: file1.txt, file2.js, folder1/`;
    },
    requiresConfirmation: false,
  },
  {
    name: 'deleteFile',
    description: 'Delete a file (requires confirmation)',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to delete' },
      },
      required: ['path']
    },
    execute: async (args) => {
      // In a real implementation, this would call an IPC method
      return `Deleted file: ${args.path}`;
    },
    requiresConfirmation: true, // Dangerous operation requires user confirmation
  },
];

const fileManagerConfig: AgentChatConfig = {
  name: 'fileManager', 
  title: 'File Assistant',
  apiEndpoint: '/api/general-agent',
  systemPrompt: 'You are a helpful file management assistant. You can list files and perform file operations. Always be careful with destructive operations.',
  tools: fileManagerTools,
  snapshots: false,
  maxSteps: 20,
};

export function FileManagerApp() {
  return (
    <AgentChatProvider config={fileManagerConfig}>
      {/* Your file manager UI components here */}
      <div>
        {/* The UI components can use useAgentChatContext() to access chat functionality */}
      </div>
    </AgentChatProvider>
  );
}

/*
Usage Notes:

1. Each agent needs its own IPC handler (e.g., window.calculatorAI, window.fileManagerAI)
2. The backend general-agent API will automatically route based on agentType
3. Tools can be defined with custom execute functions
4. System prompts are completely customizable per agent
5. Snapshots and persistence are optional features
6. Tools can require confirmation for dangerous operations

To add a new agent:
1. Define your tools as AgentTool[]
2. Create an AgentChatConfig
3. Wrap your UI in AgentChatProvider
4. Use useAgentChatContext() in your components
5. Set up the corresponding IPC handler in the main process
*/