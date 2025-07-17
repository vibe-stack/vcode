import { useState, useEffect } from 'react'
import { Search, Download, Star, Tag, ExternalLink, Loader2 } from 'lucide-react'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Alert, AlertDescription } from '../../../../components/ui/alert'

import { MCPDiscoveryService, type DiscoveredServer } from '../../../../services/mcp-discovery'

interface MCPDiscoveryPanelProps {
  onServerInstall: (server: DiscoveredServer) => Promise<void>
  className?: string
}

export function MCPDiscoveryPanel({ onServerInstall, className }: MCPDiscoveryPanelProps) {
  const [discoveryService] = useState(() => new MCPDiscoveryService())
  const [servers, setServers] = useState<DiscoveredServer[]>([])
  const [filteredServers, setFilteredServers] = useState<DiscoveredServer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    loadServers()
  }, [])

  useEffect(() => {
    filterServers()
  }, [servers, searchQuery, selectedTag])

  const loadServers = async () => {
    try {
      setLoading(true)
      const result = await discoveryService.discoverServers()
      setServers(result.servers)
      setErrors(result.errors)
    } catch (error) {
      console.error('Failed to discover servers:', error)
      setErrors(['Failed to discover servers'])
    } finally {
      setLoading(false)
    }
  }

  const filterServers = () => {
    let filtered = servers

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query) ||
        server.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (selectedTag) {
      filtered = filtered.filter(server =>
        server.tags?.includes(selectedTag)
      )
    }

    setFilteredServers(filtered)
  }

  const handleInstall = async (server: DiscoveredServer) => {
    try {
      setInstalling(prev => new Set(prev).add(server.id))
      await onServerInstall(server)
    } catch (error) {
      console.error('Failed to install server:', error)
    } finally {
      setInstalling(prev => {
        const newSet = new Set(prev)
        newSet.delete(server.id)
        return newSet
      })
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'pypi':
        return '🐍'
      case 'npm':
        return '📦'
      case 'github':
        return '🐙'
      case 'local':
        return '💻'
      case 'config':
        return '⚙️'
      default:
        return '🔌'
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'pypi':
        return 'bg-blue-500'
      case 'npm':
        return 'bg-red-500'
      case 'github':
        return 'bg-gray-800'
      case 'local':
        return 'bg-green-500'
      case 'config':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const allTags = Array.from(new Set(servers.flatMap(s => s.tags || []))).sort()

  const serversBySource = servers.reduce((acc, server) => {
    if (!acc[server.source]) {
      acc[server.source] = []
    }
    acc[server.source].push(server)
    return acc
  }, {} as Record<string, DiscoveredServer[]>)

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-sm text-muted-foreground">Discovering MCP servers...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Discover MCP Servers</h3>
        <Button variant="outline" size="sm" onClick={loadServers}>
          Refresh
        </Button>
      </div>

      {errors.length > 0 && (
        <Alert>
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-sm">{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({servers.length})</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {selectedTag && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTag('')}
              >
                Clear filter
              </Button>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredServers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No servers found matching your criteria
                </div>
              ) : (
                filteredServers.map((server) => (
                  <Card key={server.id} className="border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getSourceIcon(server.source)}</span>
                            <CardTitle className="text-sm">{server.name}</CardTitle>
                            <Badge variant="secondary" className={`text-xs text-white ${getSourceColor(server.source)}`}>
                              {server.source}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {server.description}
                          </p>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleInstall(server)}
                          disabled={installing.has(server.id)}
                        >
                          {installing.has(server.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Install
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {server.tags && server.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {server.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-accent"
                                onClick={() => setSelectedTag(tag)}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span>Command: {server.command}</span>
                            <span>Type: {server.connectionType}</span>
                          </div>
                        </div>
                        
                        {server.requirements && server.requirements.length > 0 && (
                          <div className="text-xs text-orange-600">
                            <div className="font-medium">Requirements:</div>
                            <ul className="list-disc list-inside">
                              {server.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Popular Categories</h4>
              <div className="flex flex-wrap gap-2">
                {['filesystem', 'database', 'search', 'api', 'git', 'ai'].map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  >
                    {tag} ({servers.filter(s => s.tags?.includes(tag)).length})
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">All Tags</h4>
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'secondary'}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="space-y-4">
            {Object.entries(serversBySource).map(([source, sourceServers]) => (
              <Card key={source}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <span className="text-lg">{getSourceIcon(source)}</span>
                    <span>{source.toUpperCase()}</span>
                    <Badge variant="secondary">{sourceServers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {sourceServers.slice(0, 5).map((server) => (
                      <div key={server.id} className="flex items-center justify-between text-sm">
                        <span>{server.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleInstall(server)}
                          disabled={installing.has(server.id)}
                        >
                          {installing.has(server.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                    {sourceServers.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        And {sourceServers.length - 5} more...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}