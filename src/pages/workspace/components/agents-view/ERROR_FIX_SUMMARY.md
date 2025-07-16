# Agent API Error Fix

## Problem
The frontend was crashing with `TypeError: Cannot read properties of undefined (reading 'onStatusChanged')` because `window.agentApi` was undefined. This happened because the contextBridge hasn't been set up in the main process yet.

## Solution
Added proper error handling to gracefully handle when the agent API is not available:

### Changes Made

#### 1. `agent-ipc.ts`
- Made `window.agentApi` optional in TypeScript declaration (`agentApi?`)
- Added `isAgentApiAvailable()` helper function
- Added error handling for all methods:
  - Returns empty arrays/false/null for query methods when API unavailable
  - Throws descriptive errors for critical operations (create, addMessage)
  - Returns no-op cleanup functions for event listeners
  - Shows console warning for event listener registration

#### 2. `use-agents.ts`
- Enhanced error handling in `loadAgents()` and `createAgent()`
- Shows specific message when Agent API is not available
- Guides users that full Electron environment is required

#### 3. `index.tsx`
- Enhanced error display to show additional context for API unavailability
- Explains that the feature requires backend integration

## Current Behavior
- ✅ No more crashes when agent API is unavailable
- ✅ Shows helpful error messages explaining the situation
- ✅ Gracefully handles missing functionality
- ✅ Still works with existing project store integration
- ✅ Ready for when the backend IPC is properly wired up

## Next Steps
1. Wire up IPC handlers in main process
2. Call `exposeAgentContext()` during app initialization
3. Connect agent endpoints to IPC handlers

The frontend is now robust and ready for backend integration!
