import { useState, useEffect } from 'react'
import { Package, Play, Square, Download, Settings, Search, Folder, ExternalLink } from 'lucide-react'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Switch } from '../../../../components/ui/switch'

import { VSCodeExtensionHost, type VSCodeExtension } from '../../../../services/vscode-extension-host'

interface VSCodeExtensionsPanelProps {
  extensionHost: VSCodeExtensionHost
  className?: string
}

export function VSCodeExtensionsPanel({ extensionHost, className }: VSCodeExtensionsPanelProps) {
  const [extensions, setExtensions] = useState<VSCodeExtension[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadExtensions()
    
    // Listen for extension events
    const handleExtensionActivated = () => loadExtensions()
    const handleExtensionDeactivated = () => loadExtensions()
    
    extensionHost.on('extensionActivated', handleExtensionActivated)
    extensionHost.on('extensionDeactivated', handleExtensionDeactivated)
    
    return () => {
      extensionHost.off('extensionActivated', handleExtensionActivated)
      extensionHost.off('extensionDeactivated', handleExtensionDeactivated)
    }
  }, [extensionHost])

  const loadExtensions = () => {
    setExtensions(extensionHost.getExtensions())
  }

  const handleToggleExtension = async (extension: VSCodeExtension) => {
    try {
      setLoading(true)
      if (extension.isActive) {
        await extensionHost.deactivateExtension(extension.id)
      } else {
        await extensionHost.activateExtension(extension.id)
      }
    } catch (error) {
      console.error('Failed to toggle extension:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadExtension = async () => {
    try {
      // In a real implementation, this would open a file dialog
      // For now, we'll use a simple prompt
      const extensionPath = prompt('Enter extension path:')
      if (extensionPath) {
        setLoading(true)
        await extensionHost.loadExtension(extensionPath)
        loadExtensions()
      }
    } catch (error) {
      console.error('Failed to load extension:', error)
      alert('Failed to load extension: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExtensions = extensions.filter(ext => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ext.manifest.name.toLowerCase().includes(query) ||
      ext.manifest.description?.toLowerCase().includes(query) ||
      ext.manifest.publisher?.toLowerCase().includes(query)
    )
  })

  const installedExtensions = filteredExtensions
  const activeExtensions = filteredExtensions.filter(ext => ext.isActive)
  const inactiveExtensions = filteredExtensions.filter(ext => !ext.isActive)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">VSCode Extensions</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleLoadExtension} disabled={loading}>
            <Folder className="h-4 w-4 mr-2" />
            Load Local
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Browse
          </Button>
        </div>
      </div>

      <Tabs defaultValue="installed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="installed">
            Installed ({installedExtensions.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeExtensions.length})
          </TabsTrigger>
          <TabsTrigger value="marketplace">
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredExtensions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No extensions found matching your search' : 'No extensions installed'}
                </div>
              ) : (
                filteredExtensions.map((extension) => (
                  <Card key={extension.id} className="border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <CardTitle className="text-sm">{extension.manifest.name}</CardTitle>
                            <Badge variant={extension.isActive ? "default" : "secondary"}>
                              {extension.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {extension.manifest.publisher} • v{extension.manifest.version}
                          </p>
                          {extension.manifest.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {extension.manifest.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={extension.isActive}
                            onCheckedChange={() => handleToggleExtension(extension)}
                            disabled={loading}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {extension.manifest.contributes && (
                          <div className="space-y-1">
                            {extension.manifest.contributes.commands && (
                              <div className="text-xs">
                                <span className="font-medium">Commands: </span>
                                <span className="text-muted-foreground">
                                  {extension.manifest.contributes.commands.length}
                                </span>
                              </div>
                            )}
                            {extension.manifest.contributes.languages && (
                              <div className="text-xs">
                                <span className="font-medium">Languages: </span>
                                <span className="text-muted-foreground">
                                  {extension.manifest.contributes.languages.map(l => l.id).join(', ')}
                                </span>
                              </div>
                            )}
                            {extension.manifest.contributes.themes && (
                              <div className="text-xs">
                                <span className="font-medium">Themes: </span>
                                <span className="text-muted-foreground">
                                  {extension.manifest.contributes.themes.length}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          {extension.extensionPath}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {activeExtensions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active extensions
                </div>
              ) : (
                activeExtensions.map((extension) => (
                  <Card key={extension.id} className="border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <CardTitle className="text-sm">{extension.manifest.name}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleExtension(extension)}
                          disabled={loading}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground">
                        {extension.manifest.description}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">VSCode Extension Marketplace</p>
            <p className="text-sm">Browse and install extensions from the VSCode marketplace</p>
            <div className="mt-4 space-y-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open VSCode Marketplace
              </Button>
              <p className="text-xs text-muted-foreground">
                Download .vsix files and install them locally
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}