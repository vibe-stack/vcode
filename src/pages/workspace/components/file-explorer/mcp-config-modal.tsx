import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Edit3 } from 'lucide-react'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Switch } from '../../../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'

import type { MCPServerConfig, MCPConfig } from '../../../../types/mcp'

interface MCPConfigModalProps {
  trigger: React.ReactNode
  onConfigSaved?: () => void
}

export function MCPConfigModal({ trigger, onConfigSaved }: MCPConfigModalProps) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<MCPConfig>({ mcpServers: {} })
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [editingServer, setEditingServer] = useState<MCPServerConfig | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadConfig()
    }
  }, [open])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const loadedConfig = await window.mcpApi.loadConfig()
      setConfig(loadedConfig)
    } catch (error) {
      console.error('Failed to load MCP config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setLoading(true)
      await window.mcpApi.saveConfig(config)
      onConfigSaved?.()
      setOpen(false)
    } catch (error) {
      console.error('Failed to save MCP config:', error)
    } finally {
      setLoading(false)
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
      setLoading(true)
      
      if (config.mcpServers[editingServer.id]) {
        // Update existing server
        await window.mcpApi.updateServer(editingServer.id, editingServer)
      } else {
        // Add new server
        await window.mcpApi.addServer(editingServer)
      }
      
      await loadConfig()
      setEditingServer(null)
    } catch (error) {
      console.error('Failed to save server:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteServer = async (serverId: string) => {
    try {
      setLoading(true)
      await window.mcpApi.removeServer(serverId)
      await loadConfig()
      if (selectedServer === serverId) {
        setSelectedServer(null)
      }
    } catch (error) {
      console.error('Failed to delete server:', error)
    } finally {
      setLoading(false)
    }
  }

  const servers = Object.entries(config.mcpServers).map(([id, serverConfig]) => ({
    id,
    ...serverConfig
  }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>MCP Server Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="servers" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="servers">Servers</TabsTrigger>
              <TabsTrigger value="global">Global Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="servers" className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Server List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Servers</h3>
                    <Button onClick={addServer} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Server
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {servers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No servers configured
                        </div>
                      ) : (
                        servers.map((server) => (
                          <Card
                            key={server.id}
                            className={`cursor-pointer transition-colors ${
                              selectedServer === server.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setSelectedServer(server.id)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">{server.name}</CardTitle>
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
                                    className="h-6 w-6 p-0 text-red-500"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  {server.command} {server.args.join(' ')}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {server.connectionType}
                                  </Badge>
                                  {server.disabled && (
                                    <Badge variant="destructive" className="text-xs">
                                      Disabled
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
                
                {/* Server Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Server Details</h3>
                  
                  {selectedServer ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {config.mcpServers[selectedServer]?.name || 'Unknown Server'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Command</Label>
                          <div className="text-sm font-mono">
                            {config.mcpServers[selectedServer]?.command}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Arguments</Label>
                          <div className="text-sm font-mono">
                            {config.mcpServers[selectedServer]?.args.join(' ')}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Connection Type</Label>
                          <div className="text-sm">
                            {config.mcpServers[selectedServer]?.connectionType}
                          </div>
                        </div>
                        
                        {config.mcpServers[selectedServer]?.env && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Environment Variables</Label>
                            <div className="text-sm font-mono">
                              {Object.entries(config.mcpServers[selectedServer]?.env || {}).map(([key, value]) => (
                                <div key={key}>{key}={value}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {config.mcpServers[selectedServer]?.autoApprove && config.mcpServers[selectedServer]?.autoApprove.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Auto-approved Tools</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {config.mcpServers[selectedServer]?.autoApprove.map((tool) => (
                                <Badge key={tool} variant="secondary" className="text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a server to view details
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="global" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Global Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timeout">Default Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={config.timeout || 30000}
                      onChange={(e) => setConfig({
                        ...config,
                        timeout: parseInt(e.target.value) || 30000
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="retryAttempts">Default Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      value={config.retryAttempts || 3}
                      onChange={(e) => setConfig({
                        ...config,
                        retryAttempts: parseInt(e.target.value) || 3
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="logLevel">Log Level</Label>
                    <Select
                      value={config.logLevel || 'info'}
                      onValueChange={(value) => setConfig({
                        ...config,
                        logLevel: value as 'debug' | 'info' | 'warn' | 'error'
                      })}
                    >
                      <SelectTrigger>
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
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveConfig} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
        
        {/* Server Editor Dialog */}
        {editingServer && (
          <Dialog open={!!editingServer} onOpenChange={() => setEditingServer(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {config.mcpServers[editingServer.id] ? 'Edit Server' : 'Add Server'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="serverName">Server Name</Label>
                  <Input
                    id="serverName"
                    value={editingServer.name}
                    onChange={(e) => setEditingServer({
                      ...editingServer,
                      name: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="command">Command</Label>
                  <Input
                    id="command"
                    value={editingServer.command}
                    onChange={(e) => setEditingServer({
                      ...editingServer,
                      command: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="args">Arguments (one per line)</Label>
                  <Textarea
                    id="args"
                    value={editingServer.args.join('\n')}
                    onChange={(e) => setEditingServer({
                      ...editingServer,
                      args: e.target.value.split('\n').filter(Boolean)
                    })}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="connectionType">Connection Type</Label>
                  <Select
                    value={editingServer.connectionType}
                    onValueChange={(value) => setEditingServer({
                      ...editingServer,
                      connectionType: value as 'stdio' | 'sse' | 'https'
                    })}
                  >
                    <SelectTrigger>
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
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={editingServer.url || ''}
                      onChange={(e) => setEditingServer({
                        ...editingServer,
                        url: e.target.value
                      })}
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
                  <Label htmlFor="disabled">Enabled</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingServer(null)}>
                  Cancel
                </Button>
                <Button onClick={saveServer} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Server'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}