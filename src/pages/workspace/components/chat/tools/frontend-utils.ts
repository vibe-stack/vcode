import { formatDataStreamPart, Message } from '@ai-sdk/ui-utils';
import { DataStreamWriter } from 'ai';
import { tools, ToolName } from './index';
import { frontendToolExecutors } from './executors';
import { getToolsRequiringConfirmation as getToolsRequiringConfirmationFromConfig } from './tool-config';

// Approval constants
export const APPROVAL = {
  EXECUTE: 'execute',
  CANCEL: 'cancel',
} as const;

export type ApprovalType = typeof APPROVAL[keyof typeof APPROVAL];

/**
 * Processes tool invocations on the frontend, executing tools when they are approved
 * This version handles Message[] from the useChat hook
 */
export async function processFrontendToolCalls(
  messages: Message[],
  dataStream: DataStreamWriter
): Promise<Message[]> {
  const lastMessage = messages[messages.length - 1];
  
  if (!lastMessage.parts) {
    return messages;
  }

  const processedParts = await Promise.all(
    lastMessage.parts.map(async (part) => {
      // Only process tool invocations
      if (part.type !== 'tool-invocation') {
        return part;
      }

      const { toolInvocation } = part;
      const toolName = toolInvocation.toolName as ToolName;

      // Only continue if this is a tool we can execute and it's in 'result' state
      if (!(toolName in frontendToolExecutors) || toolInvocation.state !== 'result') {
        return part;
      }

      let result: any;

      if (toolInvocation.result === APPROVAL.EXECUTE) {
        try {
          // Execute the tool on the frontend
          const executeFunction = frontendToolExecutors[toolName];
          result = await executeFunction(toolInvocation.args);
        } catch (error) {
          result = `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      } else if (toolInvocation.result === APPROVAL.CANCEL) {
        result = `Tool execution cancelled by user`;
      } else {
        // For any unhandled responses, return the original part
        return part;
      }

      // Forward updated tool result to the client
      dataStream.write(
        formatDataStreamPart('tool_result', {
          toolCallId: toolInvocation.toolCallId,
          result,
        })
      );

      // Return updated toolInvocation with the actual result
      return {
        ...part,
        toolInvocation: {
          ...toolInvocation,
          result,
        },
      };
    })
  );

  return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }];
}

/**
 * Get tools that require confirmation (tools without execute function)
 */
export function getToolsRequiringConfirmation(): ToolName[] {
  return getToolsRequiringConfirmationFromConfig();
}
