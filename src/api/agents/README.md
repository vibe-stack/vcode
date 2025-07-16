# Agent System Backend

A robust backend system for managing autonomous AI agents in your IDE that can read, modify, and interact with your codebase while handling concurrent access, multi-project support, and maintaining proper state management.

## Architecture Overview

The agent system consists of several key components:

### Core Components

1. **Database (`database.ts`)** - SQLite-based persistence for agents, messages, locks, and progress
2. **Agent Manager (`manager.ts`)** - High-level orchestration and CRUD operations
3. **Execution Engine (`execution-engine.ts`)** - Handles agent execution lifecycle and status management
4. **File Lock Manager (`file-lock-manager.ts`)** - Prevents race conditions with intelligent locking
5. **Enhanced Tools (`tools.ts`)** - File system operations with locking and progress tracking
6. **API Integration (`index.ts`)** - Integration with AI SDK for LLM communication
7. **Endpoints (`endpoints.ts`)** - Frontend API interface

### Database Schema

```sql
agent_sessions (
  id, name, description, status, project_path, project_name, workspace_root,
  created_at, updated_at, started_at, completed_at, metadata
)

agent_messages (
  id, session_id, role, content, tool_calls, tool_results,
  timestamp, step_index
)

file_locks (
  id, session_id, file_path, lock_type, acquired_at, expires_at
)

agent_progress (
  id, session_id, step, status, details, timestamp
)
```

## Multi-Project Support

### Project Scoping
- **Agents are scoped to projects**: Each agent operates within the bounds of a specific project path
- **File access validation**: All file operations are validated to ensure they stay within project boundaries
- **Project isolation**: Agents cannot access files outside their designated project path
- **Cross-project awareness**: The system can manage agents across multiple projects simultaneously

### Project Management Features
- **Project listing**: Get all projects with agent activity
- **Project switching**: Seamlessly switch between different projects
- **Project summaries**: Get agent statistics per project
- **Inactive project cleanup**: Automatically clean up old, inactive projects

## Agent Status Flow

```
ideas → todo → doing → review → accepted/rejected
                ↓
         need_clarification
                ↑
         (back to todo after user input)
```

### Status Definitions

- **ideas**: User has written some ideas but not started execution
- **todo**: User has written a draft but not yet started execution  
- **need_clarification**: Agent cannot continue until something is resolved
- **doing**: Agent is currently running
- **review**: Agent has finished and requests a review of the results
- **accepted**: User has accepted the agent's results
- **rejected**: User has declined the agent's results

## File Locking Strategy

### Lock Types
- **Read locks**: Multiple agents can read the same file simultaneously
- **Write locks**: Only one agent can write to a file at a time

### Conflict Resolution
- When two agents try to modify the same file, the later one goes into `need_clarification` status
- Common files (package.json, etc.) use shorter timeouts to reduce blocking
- Smart handling for frequently accessed configuration files

### Lock Duration
- Default: 30 seconds for most operations
- Common config files: 5 seconds
- Automatic cleanup of expired locks

## Usage Examples

### Basic Agent Creation and Execution

```typescript
import { agentManager } from './api/agents';

// 1. Create an agent
const agent = await agentManager.createAgent({
  name: "Feature Implementation",
  description: "Implement user authentication system",
  projectPath: "/path/to/project",
  initialPrompt: "Please implement a user authentication system with login, register, and password reset functionality."
});

// 2. Start execution
const success = await agentManager.startAgent(agent.id, {
  maxSteps: 50,
  stepTimeoutMs: 30000,
  autoRetry: true,
  retryAttempts: 3
});

// 3. Monitor progress
agentManager.on('agentStatusChanged', ({ sessionId, status }) => {
  console.log(`Agent ${sessionId} status: ${status}`);
});
```

### Handling File Conflicts

```typescript
// Check for potential conflicts before starting
const conflicts = await agentManager.checkFileConflicts(agentId, [
  '/path/to/file1.ts',
  '/path/to/file2.ts'
]);

if (!conflicts.canProceed) {
  console.log('Conflicts detected:', conflicts.conflicts);
  console.log('Suggestions:', conflicts.suggestions);
}
```

### Real-time Updates

```typescript
// Setup event listeners for real-time updates
const cleanup = agentEndpoints.setupEventListeners({
  onStatusChanged: (event) => {
    // Update UI
    updateAgentStatus(event.sessionId, event.status);
  },
  onLockConflict: (event) => {
    // Show conflict notification
    showConflictDialog(event);
  },
  onExecutionComplete: (event) => {
    // Handle completion
    if (event.success) {
      moveToReview(event.sessionId);
    } else {
      requestClarification(event.sessionId);
    }
  }
});

// Cleanup when component unmounts
cleanup();
```

### Message Management

```typescript
// Get conversation history
const messages = agentManager.getMessages(agentId);

// Add user clarification
await agentManager.addMessage(agentId, 'user', 
  'Please focus on implementing just the login functionality first');

// Get execution progress
const progress = agentManager.getProgress(agentId);
```

### Multi-Project Usage Examples

```typescript
// Create an agent for a specific project
const agent = await agentManager.createAgent({
  name: "Feature Implementation",
  description: "Implement user authentication system",
  projectPath: "/path/to/my-react-app",
  projectName: "My React App", // Optional display name
  workspaceRoot: "/path/to/workspace", // Optional if part of larger workspace
  initialPrompt: "Please implement user authentication..."
});

// Get all projects with agent activity
const projects = agentManager.getAllProjects();
console.log(projects);
// Output: [
//   {
//     projectPath: "/path/to/my-react-app",
//     projectName: "My React App",
//     agentCount: 3,
//     lastActivity: "2024-01-15T10:30:00Z",
//     runningAgents: 1
//   },
//   // ... more projects
// ]

// Switch to a different project
const projectData = await agentManager.switchProject("/path/to/another-project");
console.log(`Switched to project with ${projectData.agents.length} agents`);

// Get project-specific summary
const summary = await agentManager.getProjectAgentSummary("/path/to/my-react-app");
console.log(`Project has ${summary.total} agents, ${summary.running} running`);

// Clean up old, inactive projects (no activity for 30 days)
const cleanedProjects = await agentManager.cleanupInactiveProjects(30);
console.log(`Cleaned up ${cleanedProjects.length} inactive projects`);
```

### Project Boundaries and Security

```typescript
// Agents are automatically scoped to their project path
// This will work (within project):
await readFile('./src/components/Button.tsx');  // ✅ Allowed
await readFile('/project/src/utils/helpers.ts'); // ✅ Allowed

// This will fail (outside project):
await readFile('../other-project/config.js');   // ❌ Blocked
await readFile('/etc/passwd');                   // ❌ Blocked
await readFile('C:\\Windows\\System32\\...');    // ❌ Blocked

// File path validation happens automatically in all tools
```

## Integration with Electron IPC

### Main Process Setup

```typescript
import { ipcMain } from 'electron';
import { agentEndpoints } from './api/agents/endpoints';

// Register all agent endpoints
Object.entries(agentEndpoints).forEach(([name, handler]) => {
  ipcMain.handle(`agent:${name}`, async (event, ...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`Agent API error in ${name}:`, error);
      throw error;
    }
  });
});

// Setup real-time event broadcasting
agentEndpoints.setupEventListeners({
  onStatusChanged: (event) => {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('agent:statusChanged', event);
    });
  },
  onLockConflict: (event) => {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('agent:lockConflict', event);
    });
  }
});
```

### Renderer Process Usage

```typescript
import { ipcRenderer } from 'electron';

// Create agent
const agent = await ipcRenderer.invoke('agent:createAgent', {
  name: 'My Agent',
  description: 'Does something useful',
  projectPath: '/current/project',
  initialPrompt: 'Please help me...'
});

// Listen for status changes
ipcRenderer.on('agent:statusChanged', (event, data) => {
  console.log('Agent status changed:', data);
});

// Start agent
await ipcRenderer.invoke('agent:startAgent', agent.id);
```

## Error Handling

The system includes comprehensive error handling:

- **Lock conflicts**: Automatic status transition to `need_clarification`
- **File access errors**: Proper error reporting with context
- **AI API failures**: Graceful degradation and retry logic
- **Database errors**: Transaction rollback and consistency checks

## Performance Considerations

- **SQLite WAL mode**: Enabled for better concurrent access
- **Lock cleanup**: Automatic expired lock removal
- **Message storage**: Efficient indexing for fast retrieval
- **Event system**: Non-blocking event emission
- **Resource cleanup**: Proper cleanup on agent completion/deletion

## Future Enhancements

1. **Git Integration**: Automatic worktree management for agent isolation
2. **Dependency Analysis**: Smart conflict detection based on code dependencies  
3. **Resource Limits**: CPU/memory constraints for agent execution
4. **Agent Collaboration**: Structured communication between agents
5. **Rollback System**: Automatic undo capability for agent changes
6. **Performance Metrics**: Detailed execution analytics and optimization
7. **Project Templates**: Pre-configured agent setups for common project types
8. **Workspace Management**: Support for VS Code-style multi-root workspaces
9. **Project Migration**: Tools for moving agents between projects
10. **Remote Project Support**: Agents working on remote/networked projects

## Security Considerations

- **Project boundary enforcement**: File system access is strictly limited to project boundaries
- **Path validation**: All file paths are validated and resolved to prevent directory traversal
- **Sandboxed execution**: Tool execution is sandboxed within the agent context
- **API key security**: API keys are managed through secure settings
- **Database security**: Database access is properly sanitized and uses prepared statements
- **Resource isolation**: Agents cannot interfere with system files or other projects

This backend foundation provides everything needed to build a sophisticated agent system with proper concurrency control, state management, and extensibility for future enhancements.

## IDE Integration Scenarios

### Single Project Open (Most Common)
When a user has one project open in the IDE:
- All agents are scoped to that project automatically
- File operations are validated against the project root
- UI can show project-specific agent summaries
- No cross-project conflicts possible

### Project Switching
When a user switches between projects:
```typescript
// User opens a new project
const newProjectData = await agentEndpoints.switchProject('/path/to/new-project');

// Update UI with agents for this project
updateAgentList(newProjectData.agents);

// Show any warnings about running agents in other projects
if (newProjectData.conflicts.length > 0) {
  showProjectSwitchWarnings(newProjectData.conflicts);
}
```

### Background Agent Management
The system can handle agents across multiple projects:
- Agents from Project A continue running when user switches to Project B
- File locks prevent cross-project interference
- Event system notifies UI about activity in background projects
- User can see status of all projects via `getAllProjects()`

### Recommended UI Patterns

**Project Selector with Agent Counts**:
```typescript
const projects = await agentEndpoints.getAllProjects();
// Show: "My React App (3 agents, 1 running)"
//       "API Server (1 agent, 0 running)"
//       "Documentation (0 agents)"
```

**Cross-Project Activity Monitor**:
```typescript
// Listen for activity in any project
agentEndpoints.setupEventListeners({
  onStatusChanged: (event) => {
    const session = agentEndpoints.getAgent(event.sessionId);
    if (session.projectPath !== currentProjectPath) {
      showBackgroundActivityNotification(session.projectName, event.status);
    }
  }
});
```

**Project-Scoped Agent Views**:
```typescript
// Only show agents for current project by default
const currentAgents = await agentEndpoints.listAgents(currentProjectPath);

// But allow users to see all projects if needed
const allAgents = await agentEndpoints.listAgents(); // No filter = all projects
```

This backend foundation provides everything needed to build a sophisticated agent system with proper multi-project support, concurrency control, state management, and extensibility for future enhancements.
