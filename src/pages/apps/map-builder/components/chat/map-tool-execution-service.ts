import { MapBuilderTools } from './map-builder-tools';
import { useMapSnapshotStore } from './map-snapshot-store';
import { useMapBuilderStore } from '../../store';

interface PendingToolCall {
  id: string;
  toolName: string;
  args: any;
  timestamp: Date;
}

class MapBuilderToolExecutionService {
  private pendingCalls = new Map<string, PendingToolCall>();

  // Get tools that require confirmation
  getToolsRequiringConfirmation(): string[] {
    // Only modification tools require confirmation
    return [];
  }

  async executeApprovedTool(toolCallId: string, messages: any[], sessionId: string): Promise<string> {
    const pendingCall = this.pendingCalls.get(toolCallId);
    if (!pendingCall) {
      throw new Error(`No pending tool call found for ID: ${toolCallId}`);
    }

    try {
      // Get current state
      const currentState = useMapBuilderStore.getState().objects;
      
      // Find the message this tool call belongs to
      const lastMessage = messages[messages.length - 1];
      const messageId = lastMessage?.id || 'unknown';
      
      // Store initial state for this message if not already stored
      const snapshotStore = useMapSnapshotStore.getState();
      const existingInitialState = snapshotStore.getMessageInitialState(messageId);
      if (!existingInitialState) {
        // This is the first tool in this message, capture the current state as initial
        console.log(`📸 Capturing initial state for message ${messageId} (${currentState.length} objects)`);
        snapshotStore.setMessageInitialState(messageId, currentState);
      } else {
        console.log(`✅ Using existing initial state for message ${messageId} (${existingInitialState.length} objects)`);
      }
      
      // Use the stored initial state as the "before state" for all tools in this message
      const initialState = snapshotStore.getMessageInitialState(messageId) || currentState;
      
      let result: any;
      
      switch (pendingCall.toolName) {
        case 'addCube':
          result = await MapBuilderTools.addCube(pendingCall.args);
          break;
        case 'addSphere':
          result = await MapBuilderTools.addSphere(pendingCall.args);
          break;
        case 'addCylinder':
          result = await MapBuilderTools.addCylinder(pendingCall.args);
          break;
        case 'addPlane':
          result = await MapBuilderTools.addPlane(pendingCall.args);
          break;
        case 'addDoor':
          result = await MapBuilderTools.addDoor(pendingCall.args);
          break;
        case 'removeObject':
          result = await MapBuilderTools.removeObject(pendingCall.args.id);
          break;
        case 'getObjects':
          result = await MapBuilderTools.getObjects();
          break;
        case 'getObject':
          result = await MapBuilderTools.getObject(pendingCall.args.id);
          break;
        case 'getFullScene':
          result = await MapBuilderTools.getFullScene();
          break;
        default:
          throw new Error(`Unknown tool: ${pendingCall.toolName}`);
      }      
      
      // Take snapshot after executing (only for modification tools)
      if (['addCube', 'addSphere', 'addCylinder', 'addPlane', 'addDoor', 'removeObject'].includes(pendingCall.toolName)) {
        const afterState = useMapBuilderStore.getState().objects;
        
        snapshotStore.createSnapshot(
          sessionId,
          messageId,
          `${pendingCall.toolName} executed`,
          initialState, // Use initial state instead of current state
          afterState
        );
      }

      // Clean up
      this.pendingCalls.delete(toolCallId);
      
      return typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    } catch (error) {
      this.pendingCalls.delete(toolCallId);
      throw error;
    }
  }

  async cancelTool(toolCallId: string): Promise<string> {
    const pendingCall = this.pendingCalls.get(toolCallId);
    if (pendingCall) {
      this.pendingCalls.delete(toolCallId);
      return `Tool execution cancelled: ${pendingCall.toolName}`;
    }
    return 'Tool call not found or already executed';
  }

  addPendingCall(toolCallId: string, toolName: string, args: any): void {
    this.pendingCalls.set(toolCallId, {
      id: toolCallId,
      toolName,
      args,
      timestamp: new Date()
    });
  }

  getPendingCall(toolCallId: string): PendingToolCall | undefined {
    return this.pendingCalls.get(toolCallId);
  }

  getAllPendingCalls(): PendingToolCall[] {
    return Array.from(this.pendingCalls.values());
  }
}

export const mapBuilderToolExecutionService = new MapBuilderToolExecutionService();
