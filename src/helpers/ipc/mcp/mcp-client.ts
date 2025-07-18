import { spawn, ChildProcess } from 'child_process'
import { MCPServerConfig, MCPTool, MCPServerInstance } from '../../../types/mcp'

interface MCPMessage {
  jsonrpc: '2.0'
  id?: string | number
  method?: string
  params?: any
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

interface MCPCapabilities {
  experimental?: Record<string, any>
  logging?: Record<string, any>
  prompts?: {
    listChanged?: boolean
  }
  resources?: {
    subscribe?: boolean
    listChanged?: boolean
  }
  tools?: {
    listChanged?: boolean
  }
  sampling?: Record<string, any>
}

interface MCPInitializeResult {
  protocolVersion: string
  capabilities: MCPCapabilities
  serverInfo: {
    name: string
    version: string
  }
}

export class MCPClient {
  private process: ChildProcess | null = null
  private messageId = 0
  private pendingRequests = new Map<string | number, {
    resolve: (result: any) => void
    reject: (error: any) => void
    timeout: NodeJS.Timeout
  }>()
  private tools: MCPTool[] = []
  private isInitialized = false
  private buffer = ''

  constructor(
    private config: MCPServerConfig,
    private onToolsChanged?: (tools: MCPTool[]) => void,
    private onStatusChanged?: (status: 'starting' | 'running' | 'stopped' | 'error') => void
  ) {}

  async start(): Promise<void> {
    if (this.process) {
      throw new Error('MCP server is already running')
    }

    this.onStatusChanged?.('starting')

    try {
      // Spawn the MCP server process
      this.process = spawn(this.config.command, this.config.args || [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...this.config.env },
        shell: false
      })

      if (!this.process.stdin || !this.process.stdout || !this.process.stderr) {
        throw new Error('Failed to create stdio pipes for MCP server')
      }

      // Handle process events
      this.process.on('error', (error) => {
        console.error(`MCP server process error:`, error)
        this.onStatusChanged?.('error')
        this.cleanup()
      })

      this.process.on('exit', (code, signal) => {
        console.log(`MCP server exited with code ${code}, signal ${signal}`)
        this.onStatusChanged?.('stopped')
        this.cleanup()
      })

      // Handle stdout data (JSON-RPC messages)
      this.process.stdout.on('data', (data: Buffer) => {
        this.handleData(data.toString())
      })

      // Handle stderr for logging
      this.process.stderr.on('data', (data: Buffer) => {
        console.log(`MCP server stderr: ${data.toString().trim()}`)
      })

      // Wait a moment for server to fully start
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Initialize the MCP protocol
      console.log('[MCP Client] Initializing MCP protocol...')
      await this.initialize()
      console.log('[MCP Client] MCP protocol initialized successfully')
      
      // Wait a moment before listing tools
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Get available tools
      console.log('[MCP Client] Listing available tools...')
      const tools = await this.listTools()
      console.log('[MCP Client] Tool discovery completed, found', tools.length, 'tools')
      
      if (tools.length === 0) {
        console.warn('[MCP Client] No tools found, retrying in 1 second...')
        setTimeout(async () => {
          const retryTools = await this.listTools()
          console.log('[MCP Client] Retry found', retryTools.length, 'tools')
        }, 1000)
      }
      
      this.isInitialized = true
      this.onStatusChanged?.('running')
      
    } catch (error) {
      console.error('Failed to start MCP server:', error)
      this.onStatusChanged?.('error')
      this.cleanup()
      throw error
    }
  }

  async stop(): Promise<void> {
    if (!this.process) return

    // Send shutdown notification
    try {
      await this.sendNotification('notifications/shutdown')
    } catch (error) {
      console.warn('Failed to send shutdown notification:', error)
    }

    this.cleanup()
  }

  private cleanup(): void {
    // Clear all pending requests
    this.pendingRequests.forEach((request, id) => {
      clearTimeout(request.timeout)
      request.reject(new Error('MCP server stopped'))
    })
    this.pendingRequests.clear()

    if (this.process) {
      this.process.kill('SIGTERM')
      this.process = null
    }

    this.isInitialized = false
    this.tools = []
    this.buffer = ''
  }

  private handleData(data: string): void {
    this.buffer += data
    
    // Process complete JSON-RPC messages
    let lines = this.buffer.split('\n')
    this.buffer = lines.pop() || '' // Keep the incomplete line in buffer
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed) {
        // Skip non-JSON lines (startup messages, etc.)
        if (!trimmed.startsWith('{')) {
          console.log(`[MCP Client] Skipping non-JSON line: ${trimmed}`)
          continue
        }
        
        try {
          const message: MCPMessage = JSON.parse(trimmed)
          this.handleMessage(message)
        } catch (error) {
          console.error('[MCP Client] Failed to parse MCP message:', trimmed, error)
        }
      }
    }
  }

  private handleMessage(message: MCPMessage): void {
    // Handle response to a request
    if (message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id)
      if (pending) {
        clearTimeout(pending.timeout)
        this.pendingRequests.delete(message.id)
        
        if (message.error) {
          pending.reject(new Error(`MCP Error: ${message.error.message}`))
        } else {
          pending.resolve(message.result)
        }
        return
      }
    }

    // Handle notifications from server
    if (message.method) {
      this.handleNotification(message.method, message.params)
    }
  }

  private handleNotification(method: string, params?: any): void {
    switch (method) {
      case 'notifications/tools/list_changed':
        // Tools list changed, refresh it
        this.listTools().catch(console.error)
        break
      
      case 'logging/message':
        // Server sent a log message
        console.log(`MCP server log [${params?.level}]:`, params?.data)
        break
      
      default:
        console.log(`Received MCP notification: ${method}`, params)
    }
  }

  private async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.process?.stdin) {
      throw new Error('MCP server is not running')
    }

    const id = ++this.messageId
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error(`MCP request timeout: ${method}`))
      }, this.config.timeout * 1000 || 30000)

      this.pendingRequests.set(id, { resolve, reject, timeout })

      const messageStr = JSON.stringify(message) + '\n'
      this.process!.stdin!.write(messageStr)
    })
  }

  private async sendNotification(method: string, params?: any): Promise<void> {
    if (!this.process?.stdin) {
      throw new Error('MCP server is not running')
    }

    const message: MCPMessage = {
      jsonrpc: '2.0',
      method,
      params
    }

    const messageStr = JSON.stringify(message) + '\n'
    this.process.stdin.write(messageStr)
  }

  private async initialize(): Promise<MCPInitializeResult> {
    console.log('[MCP Client] Sending initialize request...')
    const result = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        experimental: {},
        sampling: {}
      },
      clientInfo: {
        name: 'vcode-ide',
        version: '0.0.1'
      }
    })
    console.log('[MCP Client] Initialize response:', JSON.stringify(result, null, 2))

    // Send initialized notification
    console.log('[MCP Client] Sending initialized notification...')
    await this.sendNotification('notifications/initialized')
    console.log('[MCP Client] Initialized notification sent')

    return result
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.isInitialized) {
      return this.tools
    }

    try {
      const result = await this.sendRequest('tools/list')
      console.log('[MCP Client] Raw tools response:', JSON.stringify(result, null, 2))
      this.tools = result.tools || []
      console.log('[MCP Client] Parsed tools:', this.tools.length, 'tools:', this.tools.map(t => ({ name: t.name, description: t.description, hasInputSchema: !!t.inputSchema })))
      this.onToolsChanged?.(this.tools)
      return this.tools
    } catch (error) {
      console.error('Failed to list MCP tools:', error)
      return this.tools
    }
  }

  async callTool(name: string, arguments_: Record<string, any>): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('MCP server is not initialized')
    }

    const result = await this.sendRequest('tools/call', {
      name,
      arguments: arguments_
    })

    return result
  }

  getTools(): MCPTool[] {
    return this.tools
  }

  isRunning(): boolean {
    return this.process !== null && this.isInitialized
  }

  getStatus(): 'starting' | 'running' | 'stopped' | 'error' {
    if (!this.process) return 'stopped'
    if (!this.isInitialized) return 'starting'
    return 'running'
  }
}