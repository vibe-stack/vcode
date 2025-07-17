import { ipcMain, BrowserWindow } from 'electron'

import { MCPServerManager } from '../../../services/mcp-server-manager'
import type { MCPServerConfig, MCPToolCall } from '../../../types/mcp'

import {
  MCP_LIST_SERVERS_CHANNEL,
  MCP_START_SERVER_CHANNEL,
  MCP_STOP_SERVER_CHANNEL,
  MCP_RESTART_SERVER_CHANNEL,
  MCP_GET_SERVER_TOOLS_CHANNEL,
  MCP_CALL_TOOL_CHANNEL,
  MCP_LOAD_CONFIG_CHANNEL,
  MCP_SAVE_CONFIG_CHANNEL,
  MCP_ADD_SERVER_CHANNEL,
  MCP_REMOVE_SERVER_CHANNEL,
  MCP_UPDATE_SERVER_CHANNEL,
  MCP_SERVER_STATUS_CHANNEL,
  MCP_DISCOVER_TOOLS_CHANNEL,
  MCP_SERVER_EVENT_CHANNEL,
  MCP_TOOL_EVENT_CHANNEL
} from './mcp-channels'

let mcpServerManager: MCPServerManager | null = null

export function registerMCPListeners(mainWindow: BrowserWindow): void {
  if (!mcpServerManager) {
    mcpServerManager = new MCPServerManager()
    
    // Forward server events to renderer
    mcpServerManager.on('server-event', (event) => {
      mainWindow.webContents.send(MCP_SERVER_EVENT_CHANNEL, event)
    })
    
    // Start all servers on initialization
    mcpServerManager.startAllServers().catch(console.error)
  }

  // Server management
  ipcMain.handle(MCP_LIST_SERVERS_CHANNEL, async () => {
    try {
      return mcpServerManager!.getServers()
    } catch (error) {
      console.error('Failed to list MCP servers:', error)
      throw error
    }
  })

  ipcMain.handle(MCP_START_SERVER_CHANNEL, async (_, serverId: string) => {
    try {
      await mcpServerManager!.startServer(serverId)
    } catch (error) {
      console.error(`Failed to start MCP server ${serverId}:`, error)
      throw error
    }
  })

  ipcMain.handle(MCP_STOP_SERVER_CHANNEL, async (_, serverId: string) => {
    try {
      await mcpServerManager!.stopServer(serverId)
    } catch (error) {
      console.error(`Failed to stop MCP server ${serverId}:`, error)
      throw error
    }
  })

  ipcMain.handle(MCP_RESTART_SERVER_CHANNEL, async (_, serverId: string) => {
    try {
      await mcpServerManager!.restartServer(serverId)
    } catch (error) {
      console.error(`Failed to restart MCP server ${serverId}:`, error)
      throw error
    }
  })

  ipcMain.handle(MCP_SERVER_STATUS_CHANNEL, async (_, serverId: string) => {
    try {
      const server = mcpServerManager!.getServer(serverId)
      return server ? {
        id: server.config.id,
        name: server.config.name,
        status: server.status,
        lastError: server.lastError,
        startTime: server.startTime,
        uptime: server.startTime ? Date.now() - server.startTime.getTime() : 0,
        toolCount: server.tools.length
      } : null
    } catch (error) {
      console.error(`Failed to get server status for ${serverId}:`, error)
      throw error
    }
  })

  // Tool management
  ipcMain.handle(MCP_GET_SERVER_TOOLS_CHANNEL, async (_, serverId: string) => {
    try {
      return mcpServerManager!.getServerTools(serverId)
    } catch (error) {
      console.error(`Failed to get tools for server ${serverId}:`, error)
      throw error
    }
  })

  ipcMain.handle(MCP_DISCOVER_TOOLS_CHANNEL, async (_, serverId: string) => {
    try {
      return await mcpServerManager!.discoverTools(serverId)
    } catch (error) {
      console.error(`Failed to discover tools for server ${serverId}:`, error)
      throw error
    }
  })

  ipcMain.handle(MCP_CALL_TOOL_CHANNEL, async (_, toolCall: MCPToolCall) => {
    try {
      return await mcpServerManager!.callTool(toolCall)
    } catch (error) {
      console.error(`Failed to call tool ${toolCall.toolName}:`, error)
      throw error
    }
  })

  // Configuration management
  ipcMain.handle(MCP_LOAD_CONFIG_CHANNEL, async () => {
    try {
      return await mcpServerManager!.loadConfig()
    } catch (error) {
      console.error('Failed to load MCP config:', error)
      throw error
    }
  })

  ipcMain.handle(MCP_SAVE_CONFIG_CHANNEL, async (_, config) => {
    try {
      await mcpServerManager!.saveConfig()
    } catch (error) {
      console.error('Failed to save MCP config:', error)
      throw error
    }
  })

  ipcMain.handle(MCP_ADD_SERVER_CHANNEL, async (_, config: MCPServerConfig) => {
    try {
      await mcpServerManager!.addServer(config)
    } catch (error) {
      console.error('Failed to add MCP server:', error)
      throw error
    }
  })

  ipcMain.handle(MCP_REMOVE_SERVER_CHANNEL, async (_, serverId: string) => {
    try {
      await mcpServerManager!.removeServer(serverId)
    } catch (error) {
      console.error(`Failed to remove MCP server ${serverId}:`, error)
      throw error
    }
  })

  ipcMain.handle(MCP_UPDATE_SERVER_CHANNEL, async (_, serverId: string, updates: Partial<MCPServerConfig>) => {
    try {
      await mcpServerManager!.updateServer(serverId, updates)
    } catch (error) {
      console.error(`Failed to update MCP server ${serverId}:`, error)
      throw error
    }
  })
}

export function getMCPServerManager(): MCPServerManager | null {
  return mcpServerManager
}

export function shutdownMCPServers(): Promise<void> {
  if (mcpServerManager) {
    return mcpServerManager.stopAllServers()
  }
  return Promise.resolve()
}