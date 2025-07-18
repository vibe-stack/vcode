import { useState, useEffect } from 'react'
import { Palette, Package, Globe, Download, Settings, Search, Eye, Install } from 'lucide-react'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'

import { ThemeManager, type ThemeDefinition } from '../../../../services/theme-manager'
import { IconThemeManager, type IconTheme } from '../../../../services/icon-theme-manager'
import { LanguagePackManager, type LanguagePack } from '../../../../services/language-pack-manager'

interface ThemeManagerPanelProps {
  className?: string
}

export function ThemeManagerPanel({ className }: ThemeManagerPanelProps) {
  const [themeManager] = useState(() => new ThemeManager())
  const [iconThemeManager] = useState(() => new IconThemeManager())
  const [languagePackManager] = useState(() => new LanguagePackManager())
  
  const [colorThemes, setColorThemes] = useState<ThemeDefinition[]>([])
  const [iconThemes, setIconThemes] = useState<IconTheme[]>([])
  const [languagePacks, setLanguagePacks] = useState<LanguagePack[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeColorTheme, setActiveColorTheme] = useState<string>('')
  const [activeIconTheme, setActiveIconTheme] = useState<string>('')

  useEffect(() => {
    loadThemes()
    loadIconThemes()
    loadLanguagePacks()
  }, [])

  const loadThemes = async () => {
    try {
      setLoading(true)
      const themes = themeManager.getThemes()
      const discoveredThemes = await themeManager.discoverThemes()
      setColorThemes([...themes, ...discoveredThemes])
      
      const activeTheme = themeManager.getActiveTheme()
      setActiveColorTheme(activeTheme?.id || '')
    } catch (error) {
      console.error('Failed to load themes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadIconThemes = async () => {
    try {
      const themes = iconThemeManager.getThemes()
      const discoveredThemes = await iconThemeManager.discoverIconThemes()
      setIconThemes([...themes, ...discoveredThemes])
      
      const activeTheme = iconThemeManager.getActiveTheme()
      setActiveIconTheme(activeTheme?.id || '')
    } catch (error) {
      console.error('Failed to load icon themes:', error)
    }
  }

  const loadLanguagePacks = async () => {
    try {
      const packs = languagePackManager.getLanguagePacks()
      const discoveredPacks = await languagePackManager.discoverLanguagePacks()
      setLanguagePacks([...packs, ...discoveredPacks])
    } catch (error) {
      console.error('Failed to load language packs:', error)
    }
  }

  const handleApplyColorTheme = (themeId: string) => {
    try {
      themeManager.applyTheme(themeId)
      setActiveColorTheme(themeId)
    } catch (error) {
      console.error('Failed to apply theme:', error)
    }
  }

  const handleApplyIconTheme = (themeId: string) => {
    try {
      iconThemeManager.applyIconTheme(themeId)
      setActiveIconTheme(themeId)
    } catch (error) {
      console.error('Failed to apply icon theme:', error)
    }
  }

  const handleInstallTheme = async (file: File) => {
    try {
      setLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const text = new TextDecoder().decode(arrayBuffer)
      const themeData = JSON.parse(text)
      
      await themeManager.installTheme(themeData, file.name)
      await loadThemes()
    } catch (error) {
      console.error('Failed to install theme:', error)
      alert('Failed to install theme: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleInstallTheme(file)
    }
  }

  const filteredColorThemes = colorThemes.filter(theme =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredIconThemes = iconThemes.filter(theme =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLanguagePacks = languagePacks.filter(pack =>
    pack.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pack.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Themes & Extensions</h3>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="theme-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('theme-upload')?.click()}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
          <Button variant="outline" size="sm" onClick={loadThemes}>
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="color-themes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="color-themes">
            <Palette className="h-4 w-4 mr-2" />
            Color Themes
          </TabsTrigger>
          <TabsTrigger value="icon-themes">
            <Package className="h-4 w-4 mr-2" />
            Icon Themes
          </TabsTrigger>
          <TabsTrigger value="language-packs">
            <Globe className="h-4 w-4 mr-2" />
            Languages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="color-themes" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search color themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={activeColorTheme} onValueChange={handleApplyColorTheme}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {filteredColorThemes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredColorThemes.map((theme) => (
                <Card
                  key={theme.id}
                  className={`cursor-pointer transition-all ${
                    activeColorTheme === theme.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleApplyColorTheme(theme.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{theme.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {theme.source}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {theme.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: theme.colors['editor.background'] || '#1e1e1e'
                        }}
                      />
                      <div
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: theme.colors['editor.foreground'] || '#cccccc'
                        }}
                      />
                      <div
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: theme.colors['editor.selectionBackground'] || '#264f78'
                        }}
                      />
                    </div>
                    {activeColorTheme === theme.id && (
                      <Badge variant="default" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="icon-themes" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icon themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={activeIconTheme} onValueChange={handleApplyIconTheme}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select icon theme" />
              </SelectTrigger>
              <SelectContent>
                {filteredIconThemes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredIconThemes.map((theme) => (
                <Card
                  key={theme.id}
                  className={`cursor-pointer transition-all ${
                    activeIconTheme === theme.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleApplyIconTheme(theme.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{theme.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {theme.source}
                        </Badge>
                        {activeIconTheme === theme.id && (
                          <Badge variant="default" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-2 text-sm">
                      <span>{theme.folder}</span>
                      <span>{theme.file}</span>
                      <span>📄</span>
                      <span>🟨</span>
                      <span>🔷</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="language-packs" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search language packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredLanguagePacks.map((pack) => (
                <Card key={pack.id} className="border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{pack.displayName}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {pack.source}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{pack.version}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-2">
                      {pack.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-medium">Extensions:</span>
                      <div className="flex flex-wrap gap-1">
                        {pack.extensions.map((ext) => (
                          <Badge key={ext} variant="outline" className="text-xs">
                            {ext}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}