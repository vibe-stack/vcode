import { AgentTool, PendingToolCall, ToolExecutor } from './types';

export class GeneralToolExecutor implements ToolExecutor {
  private pendingCalls = new Map<string, PendingToolCall>();
  private tools: AgentTool[] = [];

  constructor(tools: AgentTool[] = []) {
    this.tools = tools;
  }

  setTools(tools: AgentTool[]): void {
    this.tools = tools;
  }

  getToolsRequiringConfirmation(): string[] {
    return this.tools
      .filter(tool => tool.requiresConfirmation)
      .map(tool => tool.name);
  }

  async executeApprovedTool(toolCallId: string, messages: any[], sessionId: string): Promise<string> {
    const pendingCall = this.pendingCalls.get(toolCallId);
    if (!pendingCall) {
      throw new Error(`No pending tool call found for ID: ${toolCallId}`);
    }

    try {
      const tool = this.tools.find(t => t.name === pendingCall.toolName);
      if (!tool) {
        throw new Error(`Unknown tool: ${pendingCall.toolName}`);
      }

      // Find the message this tool call belongs to
      const lastMessage = messages[messages.length - 1];
      const messageId = lastMessage?.id || 'unknown';

      const result = await tool.execute(pendingCall.args, { 
        messages, 
        sessionId, 
        messageId,
        toolCallId 
      });

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