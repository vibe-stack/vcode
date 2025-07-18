import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import { MCPServerConfig, MCPTool, MCPServerInstance, MCPConfig } from '../../../types/mcp'
import { MCPClient } from './mcp-client'

export class RealMCPServerManager {
  private configPath: string
  private servers = new Map<string, MCPClient>()
  private serverInstances = new Map<string, MCPServerInstance>()
  private allTools = new Map<string, MCPTool & { serverId: string }>()

  constructor() {
    this.configPath = path.join(os.homedir(), '.vcode', 'settings.json')
    console.log('[MCP] RealMCPServerManager constructor called, configPath:', this.configPath)
    this.loadConfiguration().catch(console.error)
  }

  async loadConfiguration(): Promise<MCPConfig> {
    try {
      console.log('[MCP] Loading configuration from:', this.configPath)
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath)
      await fs.mkdir(configDir, { recursive: true })

      const configData = await fs.readFile(this.configPath, 'utf8')
      console.log('[MCP] Config file content:', configData.substring(0, 200) + '...')
      const settings = JSON.parse(configData)
      
      // Handle both formats: direct mcpServers or nested under mcp
      const mcpServers = settings.mcpServers || settings.mcp?.mcpServers || {}
      
      // Convert to our internal format
      const config: MCPConfig = {
        mcpServers: {}
      }

      for (const [id, serverConfig] of Object.entries(mcpServers)) {
        const server = serverConfig as any
        config.mcpServers[id] = {
          name: id,
          command: server.command,
          args: server.args || [],
          env: server.env || {},
          disabled: server.disabled || false,
          autoApprove: server.autoApprove || [],
          connectionType: server.type || 'stdio',
          url: server.url,
          timeout: server.timeout || 30,
          retryAttempts: server.retryAttempts || 3
        }
      }

      console.log('[MCP] Loaded MCP configuration:', config)
      console.log('[MCP] Found', Object.keys(config.mcpServers).length, 'servers in config')
      
      // Create server instances
      for (const [id, serverConfig] of Object.entries(config.mcpServers)) {
        console.log('[MCP] Processing server:', id, 'disabled:', serverConfig.disabled)
        if (!serverConfig.disabled) {
          // Create full config with id and name
          const fullConfig: MCPServerConfig = {
            id,
            name: id,
            ...serverConfig
          }
          this.createServerInstance(id, fullConfig)
        }
      }

      return config
    } catch (error) {
      console.error('Failed to load MCP configuration:', error)
      return { mcpServers: {} }
    }
  }

  private createServerInstance(id: string, config: MCPServerConfig): void {
    const instance: MCPServerInstance = {
      id,
      config,
      status: 'stopped',
      tools: [],
      lastError: null,
      startedAt: null,
      restartCount: 0
    }

    this.serverInstances.set(id, instance)

    // Only support stdio for now
    if (config.connectionType === 'stdio') {
      const client = new MCPClient(
        config,
        (tools) => this.onToolsChanged(id, tools),
        (status) => this.onStatusChanged(id, status)
      )
      
      this.servers.set(id, client)
      console.log(`[MCP] Created MCP server instance: ${id} with command: ${config.command} ${config.args?.join(' ')}`)
    } else {
      console.warn(`Unsupported connection type for ${id}: ${config.connectionType}`)
    }
  }

  private onToolsChanged(serverId: string, tools: MCPTool[]): void {
    const instance = this.serverInstances.get(serverId)
    if (instance) {
      instance.tools = tools
      
      // Update the global tools map
      // Remove old tools for this server
      const keysToDelete: string[] = []
      this.allTools.forEach((tool, toolKey) => {
        if (tool.serverId === serverId) {
          keysToDelete.push(toolKey)
        }
      })
      keysToDelete.forEach(key => this.allTools.delete(key))
      
      // Add new tools
      for (const tool of tools) {
        const toolKey = `${serverId}:${tool.name}`
        this.allTools.set(toolKey, { ...tool, serverId })
      }
      
      console.log(`Updated tools for ${serverId}:`, tools.map(t => t.name))
      
      // Emit event for UI update
      this.emitServerUpdate(serverId)
    }
  }

  private onStatusChanged(serverId: string, status: 'starting' | 'running' | 'stopped' | 'error'): void {
    const instance = this.serverInstances.get(serverId)
    if (instance) {
      instance.status = status
      
      if (status === 'running') {
        instance.startedAt = new Date()
        instance.lastError = null
      } else if (status === 'error') {
        instance.lastError = 'Server encountered an error'
      } else if (status === 'stopped') {
        instance.startedAt = null
      }
      
      console.log(`MCP server ${serverId} status changed to: ${status}`)
      this.emitServerUpdate(serverId)
    }
  }

  private emitServerUpdate(serverId: string): void {
    // Emit custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mcpServerUpdate', {
        detail: { serverId, instance: this.serverInstances.get(serverId) }
      }))
    }
  }

  async startServer(serverId: string): Promise<void> {
    const client = this.servers.get(serverId)
    const instance = this.serverInstances.get(serverId)
    
    if (!client || !instance) {
      throw new Error(`Server ${serverId} not found`)
    }

    if (instance.status === 'running') {
      console.log(`Server ${serverId} is already running`)
      return
    }

    try {
      console.log(`Starting MCP server: ${serverId}`)
      await client.start()
      instance.restartCount++
    } catch (error) {
      console.error(`Failed to start MCP server ${serverId}:`, error)
      instance.lastError = error instanceof Error ? error.message : 'Unknown error'
      instance.status = 'error'
      this.emitServerUpdate(serverId)
      throw error
    }
  }

  async stopServer(serverId: string): Promise<void> {
    const client = this.servers.get(serverId)
    const instance = this.serverInstances.get(serverId)
    
    if (!client || !instance) {
      throw new Error(`Server ${serverId} not found`)
    }

    console.log(`Stopping MCP server: ${serverId}`)
    await client.stop()
  }

  async restartServer(serverId: string): Promise<void> {
    await this.stopServer(serverId)
    // Wait a bit before restarting
    await new Promise(resolve => setTimeout(resolve, 1000))
    await this.startServer(serverId)
  }

  async startAllServers(): Promise<void> {
    const startPromises: Promise<void>[] = []
    
    this.serverInstances.forEach((instance, serverId) => {
      if (!instance.config.disabled && instance.status !== 'running') {
        startPromises.push(
          this.startServer(serverId).catch(error => {
            console.error(`Failed to start server ${serverId}:`, error)
          })
        )
      }
    })
    
    await Promise.all(startPromises)
  }

  async stopAllServers(): Promise<void> {
    const stopPromises: Promise<void>[] = []
    
    this.servers.forEach((_, serverId) => {
      stopPromises.push(
        this.stopServer(serverId).catch(error => {
          console.error(`Failed to stop server ${serverId}:`, error)
        })
      )
    })
    
    await Promise.all(stopPromises)
  }

  async callTool(serverId: string, toolName: string, arguments_: Record<string, any>): Promise<any> {
    const client = this.servers.get(serverId)
    if (!client) {
      throw new Error(`Server ${serverId} not found`)
    }

    if (!client.isRunning()) {
      throw new Error(`Server ${serverId} is not running`)
    }

    console.log(`Calling tool ${toolName} on server ${serverId} with args:`, arguments_)
    const result = await client.callTool(toolName, arguments_)
    console.log(`Tool ${toolName} result:`, result)
    return result
  }

  getAllTools(): Array<MCPTool & { serverId: string }> {
    console.log('[MCP] getAllTools called, allTools size:', this.allTools.size)
    console.log('[MCP] Server instances:', Array.from(this.serverInstances.keys()))
    console.log('[MCP] Server statuses:', Array.from(this.serverInstances.values()).map(s => ({ id: s.id, status: s.status, toolCount: s.tools.length })))
    return Array.from(this.allTools.values())
  }

  getServerTools(serverId: string): MCPTool[] {
    const client = this.servers.get(serverId)
    return client?.getTools() || []
  }

  getServerInstances(): MCPServerInstance[] {
    return Array.from(this.serverInstances.values())
  }

  getServerInstance(serverId: string): MCPServerInstance | undefined {
    return this.serverInstances.get(serverId)
  }

  isServerRunning(serverId: string): boolean {
    const client = this.servers.get(serverId)
    return client?.isRunning() || false
  }

  getServerStatus(serverId: string): 'starting' | 'running' | 'stopped' | 'error' {
    const instance = this.serverInstances.get(serverId)
    return instance?.status || 'stopped'
  }

  // Auto-start servers on initialization
  async initialize(): Promise<void> {
    console.log('[MCP] Initializing Real MCP Server Manager...')
    await this.loadConfiguration()
    
    console.log('[MCP] Server instances created:', this.serverInstances.size)
    console.log('[MCP] Servers available:', Array.from(this.servers.keys()))
    
    // Auto-start enabled servers
    setTimeout(() => {
      console.log('[MCP] Starting auto-start sequence...')
      this.startAllServers().catch(error => {
        console.error('[MCP] Failed to auto-start MCP servers:', error)
      })
    }, 1000) // Give a moment for everything to initialize
    
    // Force status check after servers should be initialized
    setTimeout(() => {
      console.log('[MCP] 🔍 FORCED STATUS CHECK - Post initialization...')
      this.serverInstances.forEach((instance, serverId) => {
        const client = this.servers.get(serverId)
        if (client) {
          console.log(`[MCP] 🔍 Server ${serverId}: status=${instance.status}, isRunning=${client.isRunning()}, toolCount=${client.getTools().length}`)
          
          // Force manual tool list refresh
          if (client.isRunning()) {
            console.log(`[MCP] 🔄 Forcing tool refresh for ${serverId}...`)
            client.listTools().then(tools => {
              console.log(`[MCP] 🔄 ${serverId} forced refresh result: ${tools.length} tools`)
              if (tools.length > 0) {
                console.log(`[MCP] 🔄 ${serverId} tools:`, tools.map(t => t.name))
              }
            }).catch(error => {
              console.error(`[MCP] ❌ Failed to force refresh ${serverId}:`, error)
            })
          }
        } else {
          console.log(`[MCP] ❌ No client found for server ${serverId}`)
        }
      })
    }, 5000) // Check after 5 seconds
  }
}