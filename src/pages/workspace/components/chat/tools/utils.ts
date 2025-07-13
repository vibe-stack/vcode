import { formatDataStreamPart } from '@ai-sdk/ui-utils';
import { DataStreamWriter, CoreMessage } from 'ai';
import { tools, ToolName } from './index';

// Approval constants
export const APPROVAL = {
  EXECUTE: 'execute',
  CANCEL: 'cancel',
} as const;

export type ApprovalType = typeof APPROVAL[keyof typeof APPROVAL];

// Tool execution functions type
export type ToolExecutionFunctions = {
  [K in ToolName]: (args: any) => Promise<any>;
};

/**
 * Processes tool invocations, executing tools when they are approved
 * This version handles CoreMessage[] from the backend
 */
export async function processToolCalls(
  messages: CoreMessage[],
  dataStream: DataStreamWriter,
  executeTools: ToolExecutionFunctions
): Promise<CoreMessage[]> {
  // For now, just pass through the messages as this processing will happen on frontend
  // Backend just needs to stream with tools enabled
  return messages;
}

/**
 * Get tools that require confirmation (tools without execute function)
 */
export function getToolsRequiringConfirmation(): ToolName[] {
  return Object.keys(tools).filter((toolName) => {
    const tool = tools[toolName as ToolName];
    return typeof tool.execute !== 'function';
  }) as ToolName[];
}
