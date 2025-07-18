import { ipcMain, WebContents } from 'electron'
import {
  MCP_LIST_SERVERS_CHANNEL,
  MCP_START_SERVER_CHANNEL,
  MCP_STOP_SERVER_CHANNEL,
  MCP_RESTART_SERVER_CHANNEL,
  MCP_GET_TOOLS_CHANNEL,
  MCP_CALL_TOOL_CHANNEL,
  MCP_SERVER_UPDATE_CHANNEL
} from './mcp-channels'
import { RealMCPServerManager } from './mcp-server-manager-real'

let mcpManager: RealMCPServerManager | null = null

export function addMCPEventListeners() {
  console.log('[MCP] 🚀 Adding MCP event listeners...')
  // Initialize MCP manager
  if (!mcpManager) {
    console.log('[MCP] 🔧 Creating new RealMCPServerManager instance')
    mcpManager = new RealMCPServerManager()
    mcpManager.initialize().then(() => {
      console.log('[MCP] ✅ MCP Manager initialization completed')
      // Force a test to see tools immediately
      setTimeout(() => {
        console.log('[MCP] 🧪 Testing tool discovery after initialization...')
        const tools = mcpManager!.getAllTools()
        console.log('[MCP] 🧪 Available tools after init:', tools.length)
        const instances = mcpManager!.getServerInstances()
        console.log('[MCP] 🧪 Server instances after init:', instances.map(s => ({ id: s.id, status: s.status, toolCount: s.tools.length })))
        
        // Force manual tool refresh for all running servers
        instances.forEach(async (instance) => {
          if (instance.status === 'running') {
            console.log(`[MCP] 🔄 Forcing tool refresh for ${instance.id}...`)
            try {
              const client = mcpManager!.getServerTools(instance.id)
              console.log(`[MCP] 🔄 ${instance.id} tools after manual refresh:`, client.length)
            } catch (error) {
              console.error(`[MCP] ❌ Failed to refresh tools for ${instance.id}:`, error)
            }
          }
        })
      }, 5000)
    }).catch((error) => {
      console.error('[MCP] ❌ MCP Manager initialization failed:', error)
    })
  }

  // List all MCP servers
  ipcMain.handle(MCP_LIST_SERVERS_CHANNEL, async () => {
    if (!mcpManager) throw new Error('MCP manager not initialized')
    return mcpManager.getServerInstances()
  })

  // Start a specific server
  ipcMain.handle(MCP_START_SERVER_CHANNEL, async (event, serverId: string) => {
    if (!mcpManager) throw new Error('MCP manager not initialized')
    return mcpManager.startServer(serverId)
  })

  // Stop a specific server
  ipcMain.handle(MCP_STOP_SERVER_CHANNEL, async (event, serverId: string) => {
    if (!mcpManager) throw new Error('MCP manager not initialized')
    return mcpManager.stopServer(serverId)
  })

  // Restart a specific server
  ipcMain.handle(MCP_RESTART_SERVER_CHANNEL, async (event, serverId: string) => {
    if (!mcpManager) throw new Error('MCP manager not initialized')
    return mcpManager.restartServer(serverId)
  })

  // Get all available tools
  ipcMain.handle(MCP_GET_TOOLS_CHANNEL, async () => {
    console.log('[MCP] IPC: getAllTools called')
    if (!mcpManager) throw new Error('MCP manager not initialized')
    const tools = mcpManager.getAllTools()
    console.log('[MCP] IPC: returning', tools.length, 'tools')
    return tools
  })

  // Call a specific tool
  ipcMain.handle(MCP_CALL_TOOL_CHANNEL, async (
    event, 
    { serverId, toolName, arguments: args }: { serverId: string, toolName: string, arguments: Record<string, any> }
  ) => {
    if (!mcpManager) throw new Error('MCP manager not initialized')
    return mcpManager.callTool(serverId, toolName, args)
  })

  console.log('MCP IPC listeners registered')
}

// Function to broadcast server updates to all renderer processes
export function broadcastMCPServerUpdate(update: any) {
  // This will be called when servers change status
  // For now, we'll implement a simple broadcast mechanism
  // In a real implementation, you'd keep track of all webContents
}

// Function to get MCP manager instance (for use in other parts of main process)
export function getMCPManager(): RealMCPServerManager | null {
  return mcpManager
}