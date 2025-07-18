import type { MCPServerInstance, MCPTool } from '../types/mcp'

class MCPIntegration {
  async listServers(): Promise<MCPServerInstance[]> {
    return window.mcpApi.listServers()
  }

  async startServer(serverId: string): Promise<void> {
    return window.mcpApi.startServer(serverId)
  }

  async stopServer(serverId: string): Promise<void> {
    return window.mcpApi.stopServer(serverId)
  }

  async restartServer(serverId: string): Promise<void> {
    return window.mcpApi.restartServer(serverId)
  }

  async getAllTools(): Promise<Array<MCPTool & { serverId: string }>> {
    return window.mcpApi.getAllTools()
  }

  async callTool(serverId: string, toolName: string, arguments_: Record<string, any>): Promise<any> {
    return window.mcpApi.callTool(serverId, toolName, arguments_)
  }

  onServerEvent(callback: (event: any) => void): () => void {
    return window.mcpApi.onServerEvent(callback)
  }
}

// Create singleton instance
export const mcpIntegration = new MCPIntegration()

// Window API is now exposed via IPC context bridge