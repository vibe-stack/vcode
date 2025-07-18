export interface MCPServerConfig {
  id: string
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  disabled?: boolean
  autoApprove?: string[]
  connectionType: 'stdio' | 'sse' | 'https'
  url?: string // For SSE/HTTPS connections
  timeout?: number
  retryAttempts?: number
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface MCPServerInstance {
  id: string
  config: MCPServerConfig
  status: 'stopped' | 'starting' | 'running' | 'error'
  process?: any
  connection?: MCPConnection
  tools: MCPTool[]
  lastError?: string | null
  startedAt?: Date | null
  restartCount: number
}

export interface MCPConnection {
  id: string
  serverId: string
  type: 'stdio' | 'sse' | 'https'
  connected: boolean
  lastPing?: Date
  lastError?: string
}

export interface MCPConfig {
  mcpServers: Record<string, Omit<MCPServerConfig, 'id'>>
  globalAutoApprove?: string[]
  timeout?: number
  retryAttempts?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export interface MCPToolCall {
  serverId: string
  toolName: string
  arguments: any
  id: string
  timestamp: Date
}

export interface MCPToolResult {
  id: string
  success: boolean
  result?: any
  error?: string
  timestamp: Date
}

export interface MCPServerEvent {
  type: 'server_started' | 'server_stopped' | 'server_error' | 'tool_discovered' | 'tool_removed'
  serverId: string
  data?: any
  timestamp: Date
}