// Main entry point for the agent system
export { agentManager } from './manager';
export { agentExecutionEngine } from './execution-engine';
export { fileLockManager } from './file-lock-manager';
export { agentDB } from './database';
export { agentApi } from './index';

// Export types
export type { 
  AgentSession, 
  AgentStatus, 
  AgentMessage, 
  FileLock, 
  AgentProgress 
} from './database';

export type { 
  CreateAgentRequest, 
  AgentSummary 
} from './manager';

export type { 
  AgentExecutionContext, 
  AgentExecutionOptions, 
  AgentExecutionEvent 
} from './execution-engine';

export type { 
  LockResult, 
  FileOperation 
} from './file-lock-manager';

// Example usage documentation
/*
Example Usage:

1. Create an agent:
```typescript
import { agentManager } from './api/agents';

const agent = await agentManager.createAgent({
  name: "Feature Implementation",
  description: "Implement user authentication system",
  projectPath: "/path/to/project",
  initialPrompt: "Please implement a user authentication system with login, register, and password reset functionality."
});
```

2. Start agent execution:
```typescript
const success = await agentManager.startAgent(agent.id, {
  maxSteps: 50,
  stepTimeoutMs: 30000,
  autoRetry: true,
  retryAttempts: 3
});
```

3. Monitor agent progress:
```typescript
agentManager.on('agentStatusChanged', ({ sessionId, status, previousStatus }) => {
  console.log(`Agent ${sessionId} changed from ${previousStatus} to ${status}`);
});

agentManager.on('agentLockConflict', ({ sessionId, filePath, conflictingSession }) => {
  console.log(`Agent ${sessionId} cannot access ${filePath} due to conflict with ${conflictingSession}`);
});
```

4. Get agent status and messages:
```typescript
const messages = agentManager.getMessages(agent.id);
const progress = agentManager.getProgress(agent.id);
const isRunning = agentManager.isAgentRunning(agent.id);
```

5. Handle agent completion:
```typescript
agentManager.on('agentExecutionComplete', async ({ sessionId, success }) => {
  if (success) {
    // Agent completed successfully, review results
    await agentManager.updateAgentStatus(sessionId, 'review');
  } else {
    // Agent needs clarification
    await agentManager.addMessage(sessionId, 'user', 'Please clarify what went wrong');
  }
});
```

6. Accept or reject agent results:
```typescript
// After reviewing the agent's work
await agentManager.updateAgentStatus(agent.id, 'accepted'); // or 'rejected'
```

File Locking Strategy:
- Read locks: Multiple agents can read the same file simultaneously
- Write locks: Only one agent can write to a file at a time
- Common files (package.json, etc.) use shorter timeouts to reduce blocking
- When conflicts occur, the later agent goes into 'need_clarification' status
- Agents can check for conflicts before starting work

Status Flow:
ideas -> todo -> doing -> review -> accepted/rejected
                   ↓
              need_clarification
                   ↑
              (back to todo after user input)
*/
