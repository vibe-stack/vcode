import { EventEmitter } from 'events'
import { spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

import type { 
  MCPServerConfig, 
  MCPServerInstance, 
  MCPConnection, 
  MCPTool, 
  MCPConfig,
  MCPToolCall,
  MCPToolResult,
  MCPServerEvent
} from '../types/mcp'

export class MCPServerManager extends EventEmitter {
  private servers: Map<string, MCPServerInstance> = new Map()
  private connections: Map<string, MCPConnection> = new Map()
  private config: MCPConfig | null = null
  private configPath: string

  constructor() {
    super()
    this.configPath = path.join(os.homedir(), '.vcode', 'settings.json')
    this.loadConfig()
  }

  async loadConfig(): Promise<MCPConfig> {
    try {
      const configDir = path.dirname(this.configPath)
      await fs.mkdir(configDir, { recursive: true })
      
      const configData = await fs.readFile(this.configPath, 'utf8')
      const settings = JSON.parse(configData)
      
      this.config = settings.mcp || { mcpServers: {} }
      
      // Initialize servers from config
      for (const [id, serverConfig] of Object.entries(this.config.mcpServers)) {
        const fullConfig: MCPServerConfig = {
          id,
          ...serverConfig
        }
        
        this.servers.set(id, {
          config: fullConfig,
          status: 'stopped',
          tools: []
        })
      }
      
      return this.config
    } catch (error) {
      console.warn('Failed to load MCP config, using defaults:', error)
      this.config = { mcpServers: {} }
      return this.config
    }
  }

  async saveConfig(): Promise<void> {
    try {
      let settings: any = {}
      
      try {
        const configData = await fs.readFile(this.configPath, 'utf8')
        settings = JSON.parse(configData)
      } catch (error) {
        // File doesn't exist, start with empty settings
      }
      
      settings.mcp = this.config
      
      await fs.writeFile(this.configPath, JSON.stringify(settings, null, 2))
    } catch (error) {
      console.error('Failed to save MCP config:', error)
      throw error
    }
  }

  async addServer(config: MCPServerConfig): Promise<void> {
    if (!this.config) {
      await this.loadConfig()
    }
    
    const { id, ...serverConfig } = config
    this.config!.mcpServers[id] = serverConfig
    
    this.servers.set(id, {
      config,
      status: 'stopped',
      tools: []
    })
    
    await this.saveConfig()
    this.emitServerEvent('server_added', id)
  }

  async removeServer(serverId: string): Promise<void> {
    await this.stopServer(serverId)
    
    if (this.config) {
      delete this.config.mcpServers[serverId]
      await this.saveConfig()
    }
    
    this.servers.delete(serverId)
    this.connections.delete(serverId)
    
    this.emitServerEvent('server_removed', serverId)
  }

  async updateServer(serverId: string, updates: Partial<MCPServerConfig>): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }
    
    const wasRunning = server.status === 'running'
    if (wasRunning) {
      await this.stopServer(serverId)
    }
    
    server.config = { ...server.config, ...updates }
    
    if (this.config) {
      const { id, ...serverConfig } = server.config
      this.config.mcpServers[id] = serverConfig
      await this.saveConfig()
    }
    
    if (wasRunning && !server.config.disabled) {
      await this.startServer(serverId)
    }
    
    this.emitServerEvent('server_updated', serverId)
  }

  async startServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }
    
    if (server.config.disabled) {
      throw new Error(`Server ${serverId} is disabled`)
    }
    
    if (server.status === 'running') {
      return
    }
    
    server.status = 'starting'
    this.emitServerEvent('server_starting', serverId)
    
    try {
      if (server.config.connectionType === 'stdio') {
        await this.startStdioServer(server)
      } else if (server.config.connectionType === 'sse' || server.config.connectionType === 'https') {
        await this.startHttpServer(server)
      }
      
      server.status = 'running'
      server.startTime = new Date()
      this.emitServerEvent('server_started', serverId)
      
      // Discover tools after successful start
      await this.discoverTools(serverId)
    } catch (error) {
      server.status = 'error'
      server.lastError = error instanceof Error ? error.message : 'Unknown error'
      this.emitServerEvent('server_error', serverId, { error: server.lastError })
      throw error
    }
  }

  async stopServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }
    
    if (server.status === 'stopped') {
      return
    }
    
    server.status = 'stopped'
    
    if (server.process) {
      server.process.kill()
      server.process = undefined
    }
    
    const connection = this.connections.get(serverId)
    if (connection) {
      connection.connected = false
      this.connections.delete(serverId)
    }
    
    server.tools = []
    this.emitServerEvent('server_stopped', serverId)
  }

  async restartServer(serverId: string): Promise<void> {
    await this.stopServer(serverId)
    await this.startServer(serverId)
  }

  private async startStdioServer(server: MCPServerInstance): Promise<void> {
    const process = spawn(server.config.command, server.config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...server.config.env }
    })
    
    process.on('error', (error) => {
      server.status = 'error'
      server.lastError = error.message
      this.emitServerEvent('server_error', server.config.id, { error: error.message })
    })
    
    process.on('exit', (code) => {
      if (server.status === 'running') {
        server.status = 'stopped'
        this.emitServerEvent('server_stopped', server.config.id)
      }
    })
    
    server.process = process
    
    const connection: MCPConnection = {
      id: `${server.config.id}-stdio`,
      serverId: server.config.id,
      type: 'stdio',
      connected: true,
      lastPing: new Date()
    }
    
    this.connections.set(server.config.id, connection)
  }

  private async startHttpServer(server: MCPServerInstance): Promise<void> {
    if (!server.config.url) {
      throw new Error('URL is required for HTTP/SSE connections')
    }
    
    // For HTTP/SSE, we don't spawn a process but create a connection
    const connection: MCPConnection = {
      id: `${server.config.id}-http`,
      serverId: server.config.id,
      type: server.config.connectionType as 'sse' | 'https',
      connected: true,
      lastPing: new Date()
    }
    
    this.connections.set(server.config.id, connection)
    
    // Test connection
    try {
      const response = await fetch(server.config.url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      connection.connected = false
      throw error
    }
  }

  async discoverTools(serverId: string): Promise<MCPTool[]> {
    const server = this.servers.get(serverId)
    if (!server || server.status !== 'running') {
      throw new Error(`Server ${serverId} is not running`)
    }
    
    try {
      // Mock tool discovery for now - this would be replaced with actual MCP protocol calls
      const tools: MCPTool[] = [
        {
          name: 'example-tool',
          description: `Example tool from ${server.config.name}`,
          schema: {
            type: 'object',
            properties: {
              input: { type: 'string', description: 'Input parameter' }
            }
          },
          serverId: server.config.id,
          serverName: server.config.name
        }
      ]
      
      server.tools = tools
      this.emitServerEvent('tools_discovered', serverId, { tools })
      
      return tools
    } catch (error) {
      console.error(`Failed to discover tools for server ${serverId}:`, error)
      throw error
    }
  }

  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const server = this.servers.get(toolCall.serverId)
    if (!server || server.status !== 'running') {
      throw new Error(`Server ${toolCall.serverId} is not running`)
    }
    
    const tool = server.tools.find(t => t.name === toolCall.toolName)
    if (!tool) {
      throw new Error(`Tool ${toolCall.toolName} not found in server ${toolCall.serverId}`)
    }
    
    try {
      // Mock tool execution - this would be replaced with actual MCP protocol calls
      const result = {
        id: toolCall.id,
        success: true,
        result: {
          message: `Tool ${toolCall.toolName} executed successfully`,
          arguments: toolCall.arguments
        },
        timestamp: new Date()
      }
      
      return result
    } catch (error) {
      return {
        id: toolCall.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  getServers(): MCPServerInstance[] {
    return Array.from(this.servers.values())
  }

  getServer(serverId: string): MCPServerInstance | undefined {
    return this.servers.get(serverId)
  }

  getServerTools(serverId: string): MCPTool[] {
    const server = this.servers.get(serverId)
    return server ? server.tools : []
  }

  getAllTools(): MCPTool[] {
    const tools: MCPTool[] = []
    for (const server of this.servers.values()) {
      tools.push(...server.tools)
    }
    return tools
  }

  private emitServerEvent(type: MCPServerEvent['type'], serverId: string, data?: any): void {
    const event: MCPServerEvent = {
      type,
      serverId,
      data,
      timestamp: new Date()
    }
    
    this.emit('server-event', event)
  }

  async startAllServers(): Promise<void> {
    const startPromises = Array.from(this.servers.values())
      .filter(server => !server.config.disabled)
      .map(server => this.startServer(server.config.id))
    
    await Promise.allSettled(startPromises)
  }

  async stopAllServers(): Promise<void> {
    const stopPromises = Array.from(this.servers.values())
      .filter(server => server.status === 'running')
      .map(server => this.stopServer(server.config.id))
    
    await Promise.allSettled(stopPromises)
  }
}