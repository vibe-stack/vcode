import { useState, useEffect } from 'react'
import { RotateCcw, Settings, Plus, Trash2, Edit3, ChevronDown, ChevronRight, Server, Zap, X, ExternalLink, FileText, Wrench, Folder, Database, Search } from 'lucide-react'
import { cn } from '../../../../utils/tailwind'

import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Switch } from '../../../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'

import type { MCPServerInstance, MCPTool, MCPServerConfig, MCPConfig } from '../../../../types/mcp'

interface ToolsPanelProps {
  className?: string
}

export function ToolsPanel({ className }: ToolsPanelProps) {
  const [servers, setServers] = useState<MCPServerInstance[]>([])
  const [config, setConfig] = useState<MCPConfig>({ mcpServers: {} })
  const [loading, setLoading] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editingServer, setEditingServer] = useState<MCPServerConfig | null>(null)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [toolEnabled, setToolEnabled] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadServers()
    loadConfig()
    
    // Listen for server events
    const unsubscribe = window.mcpApi.onServerEvent((event) => {
      console.log('MCP Server event:', event)
      loadServers() // Refresh servers on any event
    })

    return unsubscribe
  }, [])

  const loadServers = async () => {
    try {
      setLoading(true)
      const serverList = await window.mcpApi.listServers()
      setServers(serverList)
    } catch (error) {
      console.error('Failed to load MCP servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConfig = async () => {
    try {
      const loadedConfig = await window.mcpApi.loadConfig()
      setConfig(loadedConfig)
    } catch (error) {
      console.error('Failed to load MCP config:', error)
    }
  }

  const saveConfig = async () => {
    try {
      setActionLoading('save-config')
      await window.mcpApi.saveConfig(config)
      await loadServers()
      setConfigOpen(false)
    } catch (error) {
      console.error('Failed to save MCP config:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartServer = async (serverId: string) => {
    try {
      setActionLoading(`start-${serverId}`)
      await window.mcpApi.startServer(serverId)
      await loadServers()
    } catch (error) {
      console.error(`Failed to start server ${serverId}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStopServer = async (serverId: string) => {
    try {
      setActionLoading(`stop-${serverId}`)
      await window.mcpApi.stopServer(serverId)
      await loadServers()
    } catch (error) {
      console.error(`Failed to stop server ${serverId}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestartServer = async (serverId: string) => {
    try {
      setActionLoading(`restart-${serverId}`)
      await window.mcpApi.restartServer(serverId)
      await loadServers()
    } catch (error) {
      console.error(`Failed to restart server ${serverId}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const addServer = () => {
    const newServer: MCPServerConfig = {
      id: `server-${Date.now()}`,
      name: 'New Server',
      command: 'uvx',
      args: ['example-server'],
      connectionType: 'stdio',
      disabled: false,
      autoApprove: []
    }
    setEditingServer(newServer)
  }

  const editServer = (serverId: string) => {
    const serverConfig = config.mcpServers[serverId]
    if (serverConfig) {
      setEditingServer({
        id: serverId,
        ...serverConfig
      })
    }
  }

  const saveServer = async () => {
    if (!editingServer) return

    try {
      setActionLoading('save-server')
      
      if (config.mcpServers[editingServer.id]) {
        // Update existing server
        await window.mcpApi.updateServer(editingServer.id, editingServer)
      } else {
        // Add new server
        await window.mcpApi.addServer(editingServer)
      }
      
      await loadConfig()
      await loadServers()
      setEditingServer(null)
    } catch (error) {
      console.error('Failed to save server:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteServer = async (serverId: string) => {
    try {
      setActionLoading(`delete-${serverId}`)
      await window.mcpApi.removeServer(serverId)
      await loadConfig()
      await loadServers()
    } catch (error) {
      console.error(`Failed to delete server ${serverId}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleServerExpanded = (serverId: string) => {
    setExpandedServers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serverId)) {
        newSet.delete(serverId)
      } else {
        newSet.add(serverId)
      }
      return newSet
    })
  }

  const toggleToolExpanded = (toolId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toolId)) {
        newSet.delete(toolId)
      } else {
        newSet.add(toolId)
      }
      return newSet
    })
  }

  const handleToolToggle = (serverId: string, toolName: string, enabled: boolean) => {
    const toolId = `${serverId}-${toolName}`
    setToolEnabled(prev => ({
      ...prev,
      [toolId]: enabled
    }))
  }

  const openConfigInEditor = async () => {
    try {
      // Try to open the MCP config file in the editor
      const configPath = '.kiro/settings/mcp.json'
      await window.electronAPI?.openFile?.(configPath)
    } catch (error) {
      console.error('Failed to open config file:', error)
    }
  }

  const getToolIcon = (toolName: string) => {
    const name = toolName.toLowerCase()
    if (name.includes('file') || name.includes('read') || name.includes('write')) {
      return FileText
    } else if (name.includes('directory') || name.includes('folder')) {
      return Folder
    } else if (name.includes('search')) {
      return Search
    } else if (name.includes('database') || name.includes('db')) {
      return Database
    } else {
      return Wrench
    }
  }

  const groupToolsByType = (tools: MCPTool[]) => {
    const groups: Record<string, MCPTool[]> = {}
    
    tools.forEach(tool => {
      const name = tool.name.toLowerCase()
      let category = 'Other Tools'
      
      if (name.includes('file') || name.includes('read') || name.includes('write')) {
        category = 'File Tools'
      } else if (name.includes('directory') || name.includes('folder')) {
        category = 'Directory Tools'
      } else if (name.includes('search')) {
        category = 'Search Tools'
      } else if (name.includes('database') || name.includes('db')) {
        category = 'Database Tools'
      } else if (name.includes('system') || name.includes('project') || name.includes('info')) {
        category = 'System Tools'
      }
      
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(tool)
    })
    
    return groups
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'starting':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      case 'stopped':
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'Running'
      case 'starting':
        return 'Starting'
      case 'error':
        return 'Error'
      case 'stopped':
      default:
        return 'Stopped'
    }
  }

  const JsonSyntaxHighlighter = ({ json }: { json: any }) => {
    const jsonString = JSON.stringify(json, null, 2)
    
    // Split by lines and process each line
    const lines = jsonString.split('\n')
    
    return (
      <div className="whitespace-pre-wrap break-words max-w-full">
        {lines.map((line, index) => {
          // Color different parts of JSON
          let coloredLine = line
          
          // Property names (keys)
          coloredLine = coloredLine.replace(/"([^"]+)":/g, '<span class="text-green-400">"$1":</span>')
          
          // String values
          coloredLine = coloredLine.replace(/: "([^"]*)"/g, ': <span class="text-yellow-400">"$1"</span>')
          
          // Boolean/null values
          coloredLine = coloredLine.replace(/: (true|false|null)/g, ': <span class="text-purple-400">$1</span>')
          
          // Numbers
          coloredLine = coloredLine.replace(/: (\d+)/g, ': <span class="text-red-400">$1</span>')
          
          // Brackets and braces
          coloredLine = coloredLine.replace(/([{}[\]])/g, '<span class="text-blue-400">$1</span>')
          
          return (
            <div key={index} dangerouslySetInnerHTML={{ __html: coloredLine }} className="max-w-full overflow-hidden" />
          )
        })}
      </div>
    )
  }

  const configuredServers = Object.entries(config.mcpServers).map(([id, serverConfig]) => ({
    id,
    ...serverConfig
  }))

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="text-sm text-muted-foreground">Loading tools...</div>
      </div>
    )
  }

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Configuration Overlay */}
      {configOpen && (
        <div className="absolute inset-0 bg-background z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h3 className="text-sm font-medium">Configure Tools</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfigOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Configuration Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="servers" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-3 mt-3">
                <TabsTrigger value="servers">MCP Servers</TabsTrigger>
                <TabsTrigger value="global">Global Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="servers" className="flex-1 overflow-hidden mx-3">
                <div className="space-y-4 h-full">
                  {/* Server List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">MCP Servers</h4>
                      <Button onClick={addServer} size="sm" className="h-7">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Server
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1">
                        {configuredServers.length === 0 ? (
                          <div className="text-center py-4 text-xs text-muted-foreground">
                            No servers configured
                          </div>
                        ) : (
                          configuredServers.map((server) => (
                            <div
                              key={server.id}
                              className={cn(
                                "flex items-center justify-between p-2 rounded cursor-pointer border transition-colors",
                                selectedServer === server.id ? "bg-accent border-accent-foreground/20" : "hover:bg-accent/50"
                              )}
                              onClick={() => setSelectedServer(server.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-medium truncate">{server.name}</div>
                                  {server.disabled && (
                                    <Badge variant="destructive" className="text-xs">
                                      Disabled
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate">
                                  {server.command} {server.args.join(' ')}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    editServer(server.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteServer(server.id)
                                  }}
                                  disabled={actionLoading === `delete-${server.id}`}
                                  className="h-6 w-6 p-0 text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Server Details */}
                  {selectedServer && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Server Details</h4>
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Name</div>
                          <div className="text-sm">{config.mcpServers[selectedServer]?.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Command</div>
                          <div className="text-sm font-mono">{config.mcpServers[selectedServer]?.command}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Arguments</div>
                          <div className="text-sm font-mono">{config.mcpServers[selectedServer]?.args.join(' ')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Connection Type</div>
                          <div className="text-sm">{config.mcpServers[selectedServer]?.connectionType}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="global" className="flex-1 overflow-hidden mx-3">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Global Settings</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="timeout" className="text-xs">Default Timeout (ms)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={config.timeout || 30000}
                        onChange={(e) => setConfig({
                          ...config,
                          timeout: parseInt(e.target.value) || 30000
                        })}
                        className="h-7 text-xs"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="retryAttempts" className="text-xs">Default Retry Attempts</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        value={config.retryAttempts || 3}
                        onChange={(e) => setConfig({
                          ...config,
                          retryAttempts: parseInt(e.target.value) || 3
                        })}
                        className="h-7 text-xs"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="logLevel" className="text-xs">Log Level</Label>
                      <Select
                        value={config.logLevel || 'info'}
                        onValueChange={(value) => setConfig({
                          ...config,
                          logLevel: value as 'debug' | 'info' | 'warn' | 'error'
                        })}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end space-x-2 p-3 border-t">
            <Button variant="outline" onClick={() => setConfigOpen(false)} className="h-7 text-xs">
              Cancel
            </Button>
            <Button onClick={saveConfig} disabled={actionLoading === 'save-config'} className="h-7 text-xs">
              {actionLoading === 'save-config' ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      )}

      {/* Main Tools Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h3 className="text-sm font-medium">AI Tools Manager</h3>
            <Badge variant="secondary" className="text-xs h-4">
              {7 + servers.reduce((total, server) => total + server.tools.length, 0)} tools
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setActionLoading('refresh')
                      await loadServers()
                      setActionLoading(null)
                    }}
                    disabled={actionLoading === 'refresh'}
                    className="h-6 w-6 p-0"
                  >
                    <RotateCcw className={cn("h-3 w-3", actionLoading === 'refresh' && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={openConfigInEditor}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open config in editor</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setConfigOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Tools List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {/* System Tools Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleServerExpanded('system-tools')}
                  className="h-4 w-4 p-0"
                >
                  {expandedServers.has('system-tools') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
                <Zap className="h-4 w-4" />
                <h4 className="text-sm font-medium">System Tools</h4>
                <Badge variant="secondary" className="text-xs h-4">
                  7
                </Badge>
              </div>
              
              {expandedServers.has('system-tools') && (
                <div className="ml-6 space-y-2">
                  {/* System tools - hardcoded for now */}
                  {[
                    { name: 'Get Project Info', description: 'Get information about the current project' },
                    { name: 'Read File', description: 'Read the contents of a file from the filesystem' },
                    { name: 'Write File', description: 'Write content to a file in the filesystem' },
                    { name: 'List Directory', description: 'List the contents of a directory' },
                    { name: 'Create Directory', description: 'Create a new directory' },
                    { name: 'Delete File', description: 'Delete a file from the filesystem' },
                    { name: 'Search Files', description: 'Search for files by name or content' }
                  ].map((tool) => {
                    const toolId = `system-${tool.name}`
                    const isEnabled = toolEnabled[toolId] ?? true
                    const isExpanded = expandedTools.has(toolId)
                    const ToolIcon = getToolIcon(tool.name)
                    
                    return (
                      <div key={tool.name} className="space-y-2">
                        <div className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-2">
                            <ToolIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-medium truncate flex-1">{tool.name}</h5>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleToolExpanded(toolId)}
                                    className="h-4 w-4 p-0"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => handleToolToggle('system', tool.name, checked)}
                                    className="scale-90"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="ml-6 p-2 rounded-lg bg-muted/20 space-y-2">
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">Tool Schema</div>
                              <div className="max-h-48 overflow-y-auto overflow-x-auto w-full border rounded">
                                <div className="text-xs bg-background/50 p-2">
                                  <div className="font-mono whitespace-pre-wrap">
                                    <span className="text-blue-400">{"{"}</span>{"\n"}
                                    <span className="text-green-400">{"  \"type\""}</span>: <span className="text-yellow-400">{"\"object\""}</span>,{"\n"}
                                    <span className="text-green-400">{"  \"properties\""}</span>: <span className="text-blue-400">{"{"}</span>{"\n"}
                                    <span className="text-green-400">{"    \"path\""}</span>: <span className="text-blue-400">{"{"}</span>{"\n"}
                                    <span className="text-green-400">{"      \"type\""}</span>: <span className="text-yellow-400">{"\"string\""}</span>,{"\n"}
                                    <span className="text-green-400">{"      \"description\""}</span>: <span className="text-yellow-400">{"\"File or directory path\""}</span>{"\n"}
                                    <span className="text-blue-400">{"    }"}</span>,{"\n"}
                                    <span className="text-green-400">{"    \"content\""}</span>: <span className="text-blue-400">{"{"}</span>{"\n"}
                                    <span className="text-green-400">{"      \"type\""}</span>: <span className="text-yellow-400">{"\"string\""}</span>,{"\n"}
                                    <span className="text-green-400">{"      \"description\""}</span>: <span className="text-yellow-400">{"\"Content to write (for write operations)\""}</span>{"\n"}
                                    <span className="text-blue-400">{"    }"}</span>{"\n"}
                                    <span className="text-blue-400">{"  }"}</span>,{"\n"}
                                    <span className="text-green-400">{"  \"required\""}</span>: <span className="text-blue-400">{"["}</span><span className="text-yellow-400">{"\"path\""}</span><span className="text-blue-400">{"]"}</span>{"\n"}
                                    <span className="text-blue-400">{"}"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* MCP Servers Section */}
            {servers.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Server className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No MCP servers configured</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigOpen(true)}
                  className="mt-2 h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Server
                </Button>
              </div>
            ) : (
              servers.map((server) => {
                const isServerExpanded = expandedServers.has(server.config.id)
                
                return (
                  <div key={server.config.id} className="space-y-2">
                    {/* MCP Server Header */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleServerExpanded(server.config.id)}
                        className="h-4 w-4 p-0"
                      >
                        {isServerExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                      <Server className="h-4 w-4" />
                      <span className="text-sm font-medium truncate flex-1">{server.config.name}</span>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(server.status)}`} />
                      <Badge variant="secondary" className="text-xs h-4">
                        {server.tools.length}
                      </Badge>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openConfigInEditor}
                          className="h-4 w-4 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setActionLoading('refresh')
                            await loadServers()
                            setActionLoading(null)
                          }}
                          disabled={actionLoading === 'refresh'}
                          className="h-4 w-4 p-0"
                        >
                          <RotateCcw className={cn("h-3 w-3", actionLoading === 'refresh' && "animate-spin")} />
                        </Button>
                      </div>
                    </div>
                    
                    {/* MCP Server Tools */}
                    {isServerExpanded && (
                      <div className="ml-6 space-y-2">
                        {server.tools.map((tool) => {
                          const toolId = `${server.config.id}-${tool.name}`
                          const isEnabled = toolEnabled[toolId] ?? true
                          const isExpanded = expandedTools.has(toolId)
                          const ToolIcon = getToolIcon(tool.name)
                          
                          return (
                            <div key={tool.name} className="space-y-2">
                              <div className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-2">
                                  <ToolIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-sm font-medium truncate flex-1">{tool.name}</h5>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {tool.description && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleToolExpanded(toolId)}
                                            className="h-4 w-4 p-0"
                                          >
                                            {isExpanded ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </Button>
                                        )}
                                        <Switch
                                          checked={isEnabled}
                                          onCheckedChange={(checked) => handleToolToggle(server.config.id, tool.name, checked)}
                                          className="scale-90"
                                        />
                                      </div>
                                    </div>
                                    {tool.description && (
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tool.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <div className="ml-6 p-2 rounded-lg bg-muted/20 space-y-2">
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">Tool Schema</div>
                                    <div className="max-h-48 overflow-y-auto overflow-x-auto w-full border rounded">
                                      <div className="text-xs bg-background/50 p-2">
                                        <pre className="font-mono whitespace-pre-wrap">
                                          <JsonSyntaxHighlighter json={tool.inputSchema || {}} />
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>


      {/* Server Editor Dialog */}
      {editingServer && (
        <div className="absolute inset-0 bg-background z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="text-sm font-medium">
              {config.mcpServers[editingServer.id] ? 'Edit Server' : 'Add Server'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingServer(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              <div>
                <Label htmlFor="serverName" className="text-xs">Server Name</Label>
                <Input
                  id="serverName"
                  value={editingServer.name}
                  onChange={(e) => setEditingServer({
                    ...editingServer,
                    name: e.target.value
                  })}
                  className="h-7 text-xs"
                />
              </div>
            
              <div>
                <Label htmlFor="command" className="text-xs">Command</Label>
                <Input
                  id="command"
                  value={editingServer.command}
                  onChange={(e) => setEditingServer({
                    ...editingServer,
                    command: e.target.value
                  })}
                  className="h-7 text-xs"
                />
              </div>
            
              <div>
                <Label htmlFor="args" className="text-xs">Arguments (one per line)</Label>
                <Textarea
                  id="args"
                  value={editingServer.args.join('\n')}
                  onChange={(e) => setEditingServer({
                    ...editingServer,
                    args: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={3}
                  className="text-xs"
                />
              </div>
            
              <div>
                <Label htmlFor="connectionType" className="text-xs">Connection Type</Label>
                <Select
                  value={editingServer.connectionType}
                  onValueChange={(value) => setEditingServer({
                    ...editingServer,
                    connectionType: value as 'stdio' | 'sse' | 'https'
                  })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stdio">stdio</SelectItem>
                    <SelectItem value="sse">SSE</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              {(editingServer.connectionType === 'sse' || editingServer.connectionType === 'https') && (
                <div>
                  <Label htmlFor="url" className="text-xs">URL</Label>
                  <Input
                    id="url"
                    value={editingServer.url || ''}
                    onChange={(e) => setEditingServer({
                      ...editingServer,
                      url: e.target.value
                    })}
                    className="h-7 text-xs"
                  />
                </div>
              )}
            
              <div className="flex items-center space-x-2">
                <Switch
                  id="disabled"
                  checked={!editingServer.disabled}
                  onCheckedChange={(checked) => setEditingServer({
                    ...editingServer,
                    disabled: !checked
                  })}
                />
                <Label htmlFor="disabled" className="text-xs">Enabled</Label>
              </div>
            </div>
          </ScrollArea>
          
          <div className="flex justify-end space-x-2 p-3 border-t">
            <Button variant="outline" onClick={() => setEditingServer(null)} className="h-7 text-xs">
              Cancel
            </Button>
            <Button onClick={saveServer} disabled={actionLoading === 'save-server'} className="h-7 text-xs">
              {actionLoading === 'save-server' ? 'Saving...' : 'Save Server'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}