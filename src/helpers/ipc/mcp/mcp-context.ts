import { contextBridge, ipcRenderer } from 'electron'

import type { MCPServerConfig, MCPConfig, MCPToolCall } from '../../../types/mcp'

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

export function exposeMCPContext(): void {
  contextBridge.exposeInMainWorld('mcpApi', {
    // Server management
    listServers: () => ipcRenderer.invoke(MCP_LIST_SERVERS_CHANNEL),
    startServer: (serverId: string) => ipcRenderer.invoke(MCP_START_SERVER_CHANNEL, serverId),
    stopServer: (serverId: string) => ipcRenderer.invoke(MCP_STOP_SERVER_CHANNEL, serverId),
    restartServer: (serverId: string) => ipcRenderer.invoke(MCP_RESTART_SERVER_CHANNEL, serverId),
    getServerStatus: (serverId: string) => ipcRenderer.invoke(MCP_SERVER_STATUS_CHANNEL, serverId),

    // Tool management
    getServerTools: (serverId: string) => ipcRenderer.invoke(MCP_GET_SERVER_TOOLS_CHANNEL, serverId),
    discoverTools: (serverId: string) => ipcRenderer.invoke(MCP_DISCOVER_TOOLS_CHANNEL, serverId),
    callTool: (toolCall: MCPToolCall) => ipcRenderer.invoke(MCP_CALL_TOOL_CHANNEL, toolCall),

    // Configuration management
    loadConfig: () => ipcRenderer.invoke(MCP_LOAD_CONFIG_CHANNEL),
    saveConfig: (config: MCPConfig) => ipcRenderer.invoke(MCP_SAVE_CONFIG_CHANNEL, config),
    addServer: (config: MCPServerConfig) => ipcRenderer.invoke(MCP_ADD_SERVER_CHANNEL, config),
    removeServer: (serverId: string) => ipcRenderer.invoke(MCP_REMOVE_SERVER_CHANNEL, serverId),
    updateServer: (serverId: string, config: Partial<MCPServerConfig>) => 
      ipcRenderer.invoke(MCP_UPDATE_SERVER_CHANNEL, serverId, config),

    // Event subscriptions
    onServerEvent: (callback: (event: any) => void) => {
      ipcRenderer.on(MCP_SERVER_EVENT_CHANNEL, (_, event) => callback(event))
      return () => ipcRenderer.removeAllListeners(MCP_SERVER_EVENT_CHANNEL)
    },
    onToolEvent: (callback: (event: any) => void) => {
      ipcRenderer.on(MCP_TOOL_EVENT_CHANNEL, (_, event) => callback(event))
      return () => ipcRenderer.removeAllListeners(MCP_TOOL_EVENT_CHANNEL)
    }
  })
}

declare global {
  interface Window {
    mcpApi: {
      listServers: () => Promise<any[]>
      startServer: (serverId: string) => Promise<void>
      stopServer: (serverId: string) => Promise<void>
      restartServer: (serverId: string) => Promise<void>
      getServerStatus: (serverId: string) => Promise<any>
      getServerTools: (serverId: string) => Promise<any[]>
      discoverTools: (serverId: string) => Promise<any[]>
      callTool: (toolCall: MCPToolCall) => Promise<any>
      loadConfig: () => Promise<MCPConfig>
      saveConfig: (config: MCPConfig) => Promise<void>
      addServer: (config: MCPServerConfig) => Promise<void>
      removeServer: (serverId: string) => Promise<void>
      updateServer: (serverId: string, config: Partial<MCPServerConfig>) => Promise<void>
      onServerEvent: (callback: (event: any) => void) => () => void
      onToolEvent: (callback: (event: any) => void) => () => void
    }
  }
}