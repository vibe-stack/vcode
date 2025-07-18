import { contextBridge, ipcRenderer } from 'electron'
import {
  MCP_LIST_SERVERS_CHANNEL,
  MCP_START_SERVER_CHANNEL,
  MCP_STOP_SERVER_CHANNEL,
  MCP_RESTART_SERVER_CHANNEL,
  MCP_GET_TOOLS_CHANNEL,
  MCP_CALL_TOOL_CHANNEL,
  MCP_SERVER_UPDATE_CHANNEL
} from './mcp-channels'

export const mcpContext = {
  // Server management
  listServers: () => ipcRenderer.invoke(MCP_LIST_SERVERS_CHANNEL),
  startServer: (serverId: string) => ipcRenderer.invoke(MCP_START_SERVER_CHANNEL, serverId),
  stopServer: (serverId: string) => ipcRenderer.invoke(MCP_STOP_SERVER_CHANNEL, serverId),
  restartServer: (serverId: string) => ipcRenderer.invoke(MCP_RESTART_SERVER_CHANNEL, serverId),
  
  // Tool management
  getAllTools: () => ipcRenderer.invoke(MCP_GET_TOOLS_CHANNEL),
  callTool: (serverId: string, toolName: string, arguments_: Record<string, any>) => 
    ipcRenderer.invoke(MCP_CALL_TOOL_CHANNEL, { serverId, toolName, arguments: arguments_ }),
  
  // Event listening
  onServerEvent: (callback: (event: any) => void) => {
    const handler = (_: any, data: any) => callback(data)
    ipcRenderer.on(MCP_SERVER_UPDATE_CHANNEL, handler)
    return () => ipcRenderer.removeListener(MCP_SERVER_UPDATE_CHANNEL, handler)
  }
}

export function exposeMCPContext() {
  contextBridge.exposeInMainWorld('mcpApi', mcpContext)
}