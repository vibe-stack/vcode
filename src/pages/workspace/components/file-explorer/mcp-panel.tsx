import { useState, useEffect } from 'react'
import { Play, Square, RotateCcw, Settings, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../../../../utils/tailwind'

import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip'
import { ScrollArea } from '../../../../components/ui/scroll-area'

import type { MCPServerInstance, MCPTool } from '../../../../types/mcp'
import { MCPConfigModal } from './mcp-config-modal'

interface MCPPanelProps {
  className?: string
}

export function MCPPanel({ className }: MCPPanelProps) {
  const [servers, setServers] = useState<MCPServerInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())
  const [selectedTool, setSelectedTool] = useState<{ serverId: string; toolName: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadServers()
    
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

  const handleRemoveServer = async (serverId: string) => {
    try {
      await window.mcpApi.removeServer(serverId)
      await loadServers()
    } catch (error) {
      console.error(`Failed to remove server ${serverId}:`, error)
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

  const handleToolClick = (serverId: string, toolName: string) => {
    if (selectedTool?.serverId === serverId && selectedTool?.toolName === toolName) {
      setSelectedTool(null)
    } else {
      setSelectedTool({ serverId, toolName })
    }
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

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="text-sm text-muted-foreground">Loading MCP servers...</div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">MCP Servers</h3>
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
                <p>Refresh servers</p>
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
                  onClick={() => alert('Add server feature coming soon!')}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add server</p>
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
                  onClick={() => alert('Configure MCP feature coming soon!')}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure MCP</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
        <div className="space-y-2">
          {servers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No MCP servers configured
            </div>
          ) : (
            servers.map((server) => (
              <Card key={server.config.id} className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} />
                      <CardTitle className="text-sm font-medium">{server.config.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {getStatusText(server.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {server.status === 'running' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStopServer(server.config.id)}
                          disabled={actionLoading === `stop-${server.config.id}`}
                          className="h-6 w-6 p-0"
                        >
                          <Square className={cn("h-3 w-3", actionLoading === `stop-${server.config.id}` && "opacity-50")} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartServer(server.config.id)}
                          disabled={actionLoading === `start-${server.config.id}`}
                          className="h-6 w-6 p-0"
                        >
                          <Play className={cn("h-3 w-3", actionLoading === `start-${server.config.id}` && "opacity-50")} />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestartServer(server.config.id)}
                        disabled={actionLoading === `restart-${server.config.id}`}
                        className="h-6 w-6 p-0"
                      >
                        <RotateCcw className={cn("h-3 w-3", actionLoading === `restart-${server.config.id}` && "animate-spin")} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveServer(server.config.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {server.lastError && (
                    <div className="text-xs text-red-500 mb-2">
                      Error: {server.lastError}
                    </div>
                  )}
                  
                  {server.tools.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Tools ({server.tools.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {server.tools.map((tool) => (
                          <Badge
                            key={tool.name}
                            variant={selectedTool?.serverId === server.config.id && selectedTool?.toolName === tool.name ? "default" : "secondary"}
                            className="text-xs cursor-pointer hover:bg-accent"
                            onClick={() => handleToolClick(server.config.id, tool.name)}
                          >
                            {tool.name}
                          </Badge>
                        ))}
                      </div>
                      
                      {selectedTool?.serverId === server.config.id && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <div className="font-medium">
                            {selectedTool.toolName}
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {server.tools.find(t => t.name === selectedTool.toolName)?.description || 'No description available'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>{server.config.connectionType}</span>
                    {server.startTime && (
                      <span>
                        Started {new Date(server.startTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}