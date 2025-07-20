import { Message } from '@ai-sdk/ui-utils';
import { frontendToolExecutors, FrontendToolExecutors, ToolExecutionResult } from './executors';
import { getToolsRequiringConfirmation } from './tool-config';
import { ToolName } from './index';
import { useChatSnapshotStore } from '@/stores/chat-snapshots';

export interface ToolExecutionService {
  executeApprovedTool(toolCallId: string, messages: Message[], sessionId: string): Promise<string>;
  cancelTool(toolCallId: string): Promise<string>;
  getToolsRequiringConfirmation(): ToolName[];
}

class ToolExecutionServiceImpl implements ToolExecutionService {
  async executeApprovedTool(toolCallId: string, messages: Message[], sessionId: string): Promise<string> {
    // Find the message and tool call
    const message = messages.find(msg => 
      msg.parts?.some(part => 
        part.type === 'tool-invocation' && 
        part.toolInvocation.toolCallId === toolCallId
      )
    );
    
    if (!message) {
      throw new Error(`Tool call ${toolCallId} not found`);
    }

    const toolCall = message.parts?.find(
      part => part.type === 'tool-invocation' &&
        part.toolInvocation.toolCallId === toolCallId
    );

    if (!toolCall || toolCall.type !== 'tool-invocation') {
      throw new Error(`Invalid tool call ${toolCallId}`);
    }

    const { toolInvocation } = toolCall;
    const toolName = toolInvocation.toolName as ToolName;

    // Check if we have an executor for this tool
    if (!(toolName in frontendToolExecutors)) {
      throw new Error(`No executor found for tool: ${toolName}`);
    }

    try {
      // Execute the tool
      const executor = frontendToolExecutors[toolName as keyof FrontendToolExecutors];
      const result = await executor(toolInvocation.args) as ToolExecutionResult;
      
      // Handle file change snapshots
      if (result.metadata?.fileChanges) {
        const snapshotStore = useChatSnapshotStore.getState();
        
        for (const change of result.metadata.fileChanges) {
          snapshotStore.addSnapshot(sessionId, {
            messageId: message.id,
            filePath: change.filePath,
            prevState: change.prevState,
            nextState: change.nextState,
            status: 'pending',
            operation: change.operation,
          });
        }
      }
      
      // Return only the message to the LLM
      return result.message;
    } catch (error) {
      const errorMessage = `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      throw new Error(errorMessage);
    }
  }

  async cancelTool(toolCallId: string): Promise<string> {
    return 'Tool execution cancelled by user';
  }

  getToolsRequiringConfirmation(): ToolName[] {
    return getToolsRequiringConfirmation();
  }
}

// Export singleton instance
export const toolExecutionService = new ToolExecutionServiceImpl();