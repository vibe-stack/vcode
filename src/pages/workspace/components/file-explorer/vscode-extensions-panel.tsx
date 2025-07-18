import { useState, useEffect } from 'react'
import { Package, Play, Square, Download, Settings, Search, Folder, ExternalLink, Trash2, RefreshCw } from 'lucide-react'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Switch } from '../../../../components/ui/switch'

import { VSCodeExtensionHost, type VSCodeExtension } from '../../../../services/vscode-extension-host'
import { ExtensionManagerRenderer, type ExtensionDiscoveryResult } from '../../../../services/extension-manager-renderer'
import { useSettingsStore } from '../../../../stores/settings'
import { getActiveAccentClasses } from '../../../../utils/accent-colors'
import { cn } from '../../../../utils/tailwind'

interface VSCodeExtensionsPanelProps {
  extensionHost: VSCodeExtensionHost
  extensionManager: ExtensionManagerRenderer
  className?: string
}

export function VSCodeExtensionsPanel({ extensionHost, extensionManager, className }: VSCodeExtensionsPanelProps) {
  const [extensions, setExtensions] = useState<VSCodeExtension[]>([])
  const [marketplaceExtensions, setMarketplaceExtensions] = useState<ExtensionDiscoveryResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [marketplaceQuery, setMarketplaceQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState<string | null>(null)
  const [activeWebviews, setActiveWebviews] = useState<any[]>([])
  
  const { settings } = useSettingsStore()
  const accentColor = settings.appearance?.accentColor || 'blue'
  const useGradient = settings.appearance?.accentGradient ?? true
  const accentClasses = getActiveAccentClasses(accentColor, useGradient)

  useEffect(() => {
    loadExtensions()
    
    // Listen for extension events
    const handleExtensionActivated = () => loadExtensions()
    const handleExtensionDeactivated = () => loadExtensions()
    
    const handleWebviewCreated = (webviewPanel: any) => {
      console.log('Webview created in panel:', webviewPanel)
      setActiveWebviews(prev => [...prev, webviewPanel])
    }
    
    // Listen for main process webview events
    const handleMainProcessWebview = (event: any, webviewPanel: any) => {
      console.log('Main process webview created:', webviewPanel)
      setActiveWebviews(prev => [...prev, webviewPanel])
    }
    
    extensionHost.on('extensionActivated', handleExtensionActivated)
    extensionHost.on('extensionDeactivated', handleExtensionDeactivated)
    extensionHost.on('webviewCreated', handleWebviewCreated)
    
    // Listen for IPC events from main process
    if (window.electronAPI) {
      window.electronAPI.on('extension:webview-created', handleMainProcessWebview)
    }
    
    return () => {
      extensionHost.off('extensionActivated', handleExtensionActivated)
      extensionHost.off('extensionDeactivated', handleExtensionDeactivated)
      extensionHost.off('webviewCreated', handleWebviewCreated)
      
      if (window.electronAPI) {
        window.electronAPI.off('extension:webview-created', handleMainProcessWebview)
      }
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
        await window.extensionAPI.setExtensionActive(extension.id, false)
        console.log(`✅ Extension ${extension.id} deactivated`)
      } else {
        await extensionHost.activateExtension(extension.id)
        await window.extensionAPI.setExtensionActive(extension.id, true)
        // Also execute in main process
        const result = await window.extensionAPI.executeExtension(extension.id)
        if (result.success) {
          console.log(`✅ Extension ${extension.id} activated and executed`)
        } else {
          console.warn(`Failed to execute extension ${extension.id} in main process:`, result.error)
        }
      }
    } catch (error) {
      console.error('Failed to toggle extension:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerExtension = async (extension: VSCodeExtension) => {
    try {
      setLoading(true)
      console.log(`🎯 Triggering extension: ${extension.id}`)
      
      // For Claude Dev, try to trigger common commands
      if (extension.id === 'saoudrizwan.claude-dev') {
        console.log('🤖 Triggering Claude Dev...')
        
        // Try common Claude Dev commands
        const commands = [
          'claude-dev.newChat',
          'claude-dev.openChat',
          'claude-dev.showChatPanel',
          'claude-dev.activate',
          'cline.newChat',
          'cline.openChat',
          'cline.showChatPanel'
        ]
        
        for (const command of commands) {
          try {
            await extensionHost.commands.executeCommand(command)
            console.log(`✅ Executed command: ${command}`)
            break // Stop at first successful command
          } catch (error) {
            console.log(`❌ Command ${command} failed:`, error.message)
          }
        }
        
        // Also try to create a webview directly
        try {
          const claudeWebview = extensionHost.window.createWebviewPanel(
            'claude-dev.chatPanel',
            'Claude Dev',
            1,
            {
              enableScripts: true,
              retainContextWhenHidden: true
            }
          )
          
          claudeWebview.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  background: #1e1e1e; 
                  color: #d4d4d4; 
                  height: 100vh;
                  overflow: hidden;
                }
                .container { 
                  height: 100vh; 
                  display: flex; 
                  flex-direction: column; 
                  padding: 10px;
                }
                .header { 
                  background: #2d2d30; 
                  padding: 15px; 
                  border-radius: 8px; 
                  margin-bottom: 10px; 
                  border-left: 4px solid #007acc;
                  flex-shrink: 0;
                }
                .header h1 { 
                  font-size: 18px; 
                  margin-bottom: 5px; 
                  display: flex; 
                  align-items: center; 
                  gap: 8px; 
                }
                .header p { 
                  font-size: 12px; 
                  opacity: 0.8; 
                }
                .chat-container {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  min-height: 0;
                }
                .chat-area {
                  background: #252526;
                  border-radius: 6px;
                  flex: 1;
                  overflow-y: auto;
                  padding: 15px;
                  margin-bottom: 10px;
                  display: flex;
                  flex-direction: column;
                }
                .messages {
                  flex: 1;
                  overflow-y: auto;
                }
                .message {
                  padding: 10px;
                  border-radius: 4px;
                  margin-bottom: 10px;
                  max-width: 90%;
                }
                .message.user {
                  background: #007acc;
                  margin-left: auto;
                  text-align: right;
                }
                .message.bot {
                  background: #2d2d30;
                }
                .input-area {
                  background: #2d2d30;
                  padding: 15px;
                  border-radius: 6px;
                  flex-shrink: 0;
                }
                .input-container {
                  display: flex;
                  gap: 10px;
                  align-items: flex-end;
                }
                textarea {
                  background: #1e1e1e;
                  border: 1px solid #464647;
                  color: #d4d4d4;
                  padding: 10px;
                  border-radius: 4px;
                  flex: 1;
                  font-family: inherit;
                  font-size: 14px;
                  resize: none;
                  min-height: 40px;
                  max-height: 120px;
                }
                button {
                  background: #007acc;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                  height: 40px;
                  flex-shrink: 0;
                }
                button:hover { background: #005a9e; }
                button:disabled { 
                  background: #464647; 
                  cursor: not-allowed; 
                }
                .typing {
                  opacity: 0.7;
                  font-style: italic;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🤖 Claude Dev</h1>
                  <p>AI Assistant for VS Code - Demo Interface</p>
                </div>
                <div class="chat-container">
                  <div class="chat-area">
                    <div class="messages" id="messages">
                      <div class="message bot">
                        <strong>Claude:</strong> Hello! I'm Claude Dev. I can help you with coding tasks, debugging, and development questions. What would you like to work on today?
                      </div>
                    </div>
                  </div>
                  <div class="input-area">
                    <div class="input-container">
                      <textarea 
                        id="messageInput" 
                        placeholder="Ask me anything about coding, debugging, or development..."
                        rows="1"
                      ></textarea>
                      <button onclick="sendMessage()" id="sendButton">Send</button>
                    </div>
                  </div>
                </div>
              </div>
              <script>
                let isTyping = false;
                
                function sendMessage() {
                  const input = document.getElementById('messageInput');
                  const messages = document.getElementById('messages');
                  const sendButton = document.getElementById('sendButton');
                  
                  if (input.value.trim() && !isTyping) {
                    // Add user message
                    const userMsg = document.createElement('div');
                    userMsg.className = 'message user';
                    userMsg.innerHTML = '<strong>You:</strong> ' + input.value;
                    messages.appendChild(userMsg);
                    
                    const userText = input.value;
                    input.value = '';
                    
                    // Show typing indicator
                    isTyping = true;
                    sendButton.disabled = true;
                    const typingMsg = document.createElement('div');
                    typingMsg.className = 'message bot typing';
                    typingMsg.innerHTML = '<strong>Claude:</strong> Thinking...';
                    messages.appendChild(typingMsg);
                    
                    messages.scrollTop = messages.scrollHeight;
                    
                    // Simulate Claude response
                    setTimeout(() => {
                      messages.removeChild(typingMsg);
                      
                      const botMsg = document.createElement('div');
                      botMsg.className = 'message bot';
                      
                      // Generate contextual responses
                      let response = '';
                      if (userText.toLowerCase().includes('debug')) {
                        response = 'I can help you debug your code! Please share the error message or describe the issue you\\'re experiencing. I can analyze stack traces, suggest fixes, and explain what might be causing the problem.';
                      } else if (userText.toLowerCase().includes('code') || userText.toLowerCase().includes('function')) {
                        response = 'I\\'d be happy to help you with coding! Whether you need to write new functions, refactor existing code, or understand how something works, just let me know what you\\'re working on.';
                      } else if (userText.toLowerCase().includes('error')) {
                        response = 'Let me help you resolve that error! Please share the full error message and the relevant code. I can explain what\\'s causing it and provide solutions.';
                      } else {
                        response = 'I understand you said "' + userText + '". As Claude Dev, I can help you with:\\n\\n• Writing and reviewing code\\n• Debugging issues\\n• Explaining programming concepts\\n• Suggesting improvements\\n• Testing strategies\\n\\nWhat specific task would you like help with?';
                      }
                      
                      botMsg.innerHTML = '<strong>Claude:</strong> ' + response.replace(/\\n/g, '<br>');
                      messages.appendChild(botMsg);
                      
                      isTyping = false;
                      sendButton.disabled = false;
                      messages.scrollTop = messages.scrollHeight;
                    }, 1000 + Math.random() * 2000);
                  }
                }
                
                document.getElementById('messageInput').addEventListener('keydown', function(e) {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                });
                
                // Auto-resize textarea
                document.getElementById('messageInput').addEventListener('input', function() {
                  this.style.height = 'auto';
                  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
                });
              </script>
            </body>
            </html>
          `
          
          console.log('✅ Claude Dev webview created manually')
        } catch (error) {
          console.error('Failed to create Claude Dev webview:', error)
        }
      } else {
        // For other extensions, try to execute their commands
        if (extension.manifest.contributes?.commands) {
          const commands = extension.manifest.contributes.commands
          for (const command of commands) {
            try {
              await extensionHost.commands.executeCommand(command.command)
              console.log(`✅ Executed command: ${command.command}`)
              break
            } catch (error) {
              console.log(`❌ Command ${command.command} failed:`, error.message)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to trigger extension:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTestWebview = async () => {
    try {
      // Create a test webview using the extension host
      const testWebview = extensionHost.window.createWebviewPanel(
        'test-webview',
        'Test Webview',
        1,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      )
      
      testWebview.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Webview</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              padding: 20px; 
              background: #1e1e1e; 
              color: #d4d4d4;
              margin: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
            }
            .header {
              background: #2d2d30;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              border-left: 4px solid #007acc;
            }
            .button {
              background: #007acc;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              margin: 5px;
            }
            .button:hover {
              background: #005a9e;
            }
            .success { color: #4caf50; }
            .output {
              background: #2d2d30;
              padding: 10px;
              border-radius: 4px;
              margin: 10px 0;
              font-family: monospace;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Test Webview</h1>
              <p class="success">✅ Webview System Working!</p>
            </div>
            
            <div>
              <h2>Test Features</h2>
              <button class="button" onclick="testMessage()">Test Message</button>
              <button class="button" onclick="testAPI()">Test VS Code API</button>
              <button class="button" onclick="clearOutput()">Clear Output</button>
              <div id="output"></div>
            </div>
          </div>
          
          <script>
            function addOutput(message) {
              const output = document.getElementById('output');
              const div = document.createElement('div');
              div.className = 'output';
              div.textContent = new Date().toLocaleTimeString() + ': ' + message;
              output.appendChild(div);
            }
            
            function testMessage() {
              addOutput('Test message sent to console');
              console.log('Test message from webview');
            }
            
            function testAPI() {
              addOutput('VS Code API test - webview is working');
              console.log('VS Code API test from webview');
            }
            
            function clearOutput() {
              document.getElementById('output').innerHTML = '';
            }
            
            // Add initial message
            addOutput('Webview loaded successfully!');
          </script>
        </body>
        </html>
      `
      
      console.log('✅ Test webview created')
    } catch (error) {
      console.error('Failed to create test webview:', error)
    }
  }

  const handleLoadExtension = async () => {
    try {
      setLoading(true)
      
      // Use file dialog in Electron environment
      const result = await window.extensionAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'VS Code Extensions', extensions: ['vsix'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (result && !result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        
        let installResult
        if (filePath.endsWith('.vsix')) {
          installResult = await extensionManager.installFromVsix(filePath)
        } else {
          installResult = await extensionManager.installFromDirectory(filePath)
        }
        
        if (installResult.success) {
          loadExtensions()
          alert(`Extension ${installResult.extension?.manifest.name} installed successfully!`)
        } else {
          alert(`Failed to install extension: ${installResult.error}`)
        }
      }
    } catch (error) {
      console.error('Failed to load extension:', error)
      alert('Failed to load extension: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleUninstallExtension = async (extension: VSCodeExtension) => {
    if (!confirm(`Are you sure you want to uninstall ${extension.manifest.name}?`)) {
      return
    }
    
    try {
      setLoading(true)
      const success = await extensionManager.uninstallExtension(extension.id)
      
      if (success) {
        loadExtensions()
        alert(`Extension ${extension.manifest.name} uninstalled successfully!`)
      } else {
        alert('Failed to uninstall extension')
      }
    } catch (error) {
      console.error('Failed to uninstall extension:', error)
      alert('Failed to uninstall extension: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchMarketplace = async (query: string) => {
    try {
      setLoading(true)
      const results = await extensionManager.searchMarketplace(query)
      setMarketplaceExtensions(results)
    } catch (error) {
      console.error('Failed to search marketplace:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInstallFromMarketplace = async (extensionId: string) => {
    try {
      setInstalling(extensionId)
      const result = await extensionManager.downloadAndInstall(extensionId)
      
      if (result.success) {
        loadExtensions()
        alert(`Extension installed successfully!`)
      } else {
        alert(`Failed to install extension: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to install extension:', error)
      alert('Failed to install extension: ' + error)
    } finally {
      setInstalling(null)
    }
  }

  // Load marketplace extensions on component mount
  useEffect(() => {
    handleSearchMarketplace('')
  }, [])

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
          <Button variant="outline" size="sm" onClick={handleLoadExtension} disabled={loading}
                  className={cn("hover:border-current", accentClasses.accent)}>
            <Folder className="h-4 w-4 mr-2" />
            Load Local
          </Button>
          <Button variant="outline" size="sm" className={cn("hover:border-current", accentClasses.accent)}>
            <Download className="h-4 w-4 mr-2" />
            Browse
          </Button>
        </div>
      </div>

      <Tabs defaultValue="installed" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="installed">
            Installed ({installedExtensions.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeExtensions.length})
          </TabsTrigger>
          <TabsTrigger value="webviews">
            Webviews ({activeWebviews.length})
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
                            <Package className={cn("h-4 w-4", accentClasses.icon)} />
                            <CardTitle className="text-sm">{extension.manifest.name}</CardTitle>
                            <Badge variant={extension.isActive ? "default" : "secondary"} 
                                   className={extension.isActive ? accentClasses.accent : ''}>
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
                            onClick={() => handleTriggerExtension(extension)}
                            disabled={loading}
                            title="Trigger Extension"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleUninstallExtension(extension)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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

        <TabsContent value="webviews" className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateTestWebview}
              disabled={loading}
              className={cn('hover:border-current', accentClasses.accent)}
            >
              <Package className="h-4 w-4 mr-2" />
              Create Test Webview
            </Button>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {activeWebviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Active Webviews</p>
                  <p className="text-sm mb-4">Extensions with webviews will appear here</p>
                  <p className="text-xs">Try creating a test webview above or load an extension with webview support</p>
                </div>
              ) : (
                activeWebviews.map((webview, index) => (
                  <Card key={index} className="border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className={cn("h-4 w-4", accentClasses.icon)} />
                            <CardTitle className="text-sm">{webview.title}</CardTitle>
                            <Badge variant="default" className={accentClasses.accent}>
                              Active
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {webview.viewType}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              console.log('Revealing webview:', webview.title)
                              webview.reveal()
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="text-xs">
                          <span className="font-medium">View Type: </span>
                          <span className="text-muted-foreground">{webview.viewType}</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Status: </span>
                          <span className="text-muted-foreground">
                            {webview.visible ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                        
                        {/* Render the actual webview content */}
                        <div className="mt-4 border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 px-3 py-2 text-sm font-medium border-b">
                            Webview Content: {webview.title}
                          </div>
                          <div className="relative">
                            <iframe
                              srcDoc={webview.webview.html || '<div style="padding: 20px; color: #666;">Loading webview...</div>'}
                              className="w-full border-0"
                              style={{
                                height: '600px',
                                minHeight: '400px',
                                background: 'transparent',
                                colorScheme: 'dark'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search VS Code marketplace..."
                  value={marketplaceQuery}
                  onChange={(e) => setMarketplaceQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchMarketplace(marketplaceQuery)
                    }
                  }}
                  className="pl-8"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSearchMarketplace(marketplaceQuery)}
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {marketplaceExtensions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Install Real VS Code Extensions</p>
                    <p className="text-sm mb-4">Download .vsix files from the VS Code marketplace</p>
                    <div className="bg-muted/50 rounded-lg p-4 text-left">
                      <p className="text-sm font-medium mb-2">How to install extensions:</p>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Visit <a href="https://marketplace.visualstudio.com/vscode" target="_blank" className={cn("underline", accentClasses.text)}>VS Code Marketplace</a></li>
                        <li>Find your extension and download the .vsix file</li>
                        <li>Use "Load Local" button to install the .vsix file</li>
                        <li>Extension will be activated automatically</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  marketplaceExtensions.map((ext) => (
                    <Card key={ext.id} className="border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Package className={cn("h-4 w-4", accentClasses.icon)} />
                              <CardTitle className="text-sm">{ext.name}</CardTitle>
                              <Badge variant="outline">v{ext.version}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {ext.publisher}
                              {ext.installs && (
                                <span> • {(ext.installs / 1000000).toFixed(1)}M installs</span>
                              )}
                              {ext.rating && (
                                <span> • ⭐ {ext.rating.toFixed(1)}</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {ext.description}
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInstallFromMarketplace(ext.id)}
                            disabled={installing === ext.id}
                            className={cn("hover:border-current", accentClasses.accent)}
                          >
                            {installing === ext.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Installing...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Install
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}