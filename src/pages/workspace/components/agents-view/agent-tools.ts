import { tool } from 'ai';
import { z } from 'zod';

export const agentTaskCompleteSchema = z.object({
  status: z.enum(['review', 'need_clarification']).describe('Where the task should go next - "review" if work is complete, "need_clarification" if more info is needed'),
  message: z.string().describe('A message explaining the completion status or what clarification is needed'),
  summary: z.string().optional().describe('Optional summary of work completed (for review status)')
});

export const agentTaskCompleteTool = tool({
  description: 'Complete an agent task and specify the next status (review or need clarification)',
  parameters: agentTaskCompleteSchema,
  execute: async ({ status, message, summary }) => {
    // This will be handled by the kanban store when processing tool calls
    return {
      type: 'task_completion',
      status,
      message,
      summary,
      timestamp: new Date().toISOString()
    };
  },
});

export const agentRequestClarificationSchema = z.object({
  questions: z.array(z.string()).describe('Specific questions that need clarification'),
  context: z.string().optional().describe('Additional context about why clarification is needed')
});

export const agentRequestClarificationTool = tool({
  description: 'Request clarification from the user when the agent cannot proceed without more information',
  parameters: agentRequestClarificationSchema,
  execute: async ({ questions, context }) => {
    return {
      type: 'clarification_request',
      questions,
      context,
      timestamp: new Date().toISOString()
    };
  },
});
