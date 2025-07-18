import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Wrench,
  Zap,
  RefreshCw,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'file' | 'mcp' | 'system';
  status?: 'running' | 'stopped' | 'starting' | 'error';
  serverId?: string;
}

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToolToggle: (toolId: string, enabled: boolean) => void;
  onRefreshMCP: () => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  isOpen,
  onClose,
  onToolToggle,
  onRefreshMCP
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [mcpServers, setMcpServers] = useState<Array<{
    id: string;
    status: string;
    toolCount: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTools = async () => {
    setLoading(true);
    try {
      // Get MCP servers status
      const servers = await window.mcpApi?.listServers() || [];
      setMcpServers(servers);

      // Get MCP tools
      const mcpTools = await window.mcpApi?.getAllTools() || [];
      
      // Static file system tools
      const staticTools: Tool[] = [
        {
          id: 'readFile',
          name: 'Read File',
          description: 'Read the contents of a file from the filesystem',
          enabled: true,
          category: 'file'
        },
        {
          id: 'writeFile', 
          name: 'Write File',
          description: 'Write content to a file in the filesystem',
          enabled: true,
          category: 'file'
        },
        {
          id: 'listDirectory',
          name: 'List Directory',
          description: 'List the contents of a directory',
          enabled: true,
          category: 'file'
        },
        {
          id: 'createDirectory',
          name: 'Create Directory', 
          description: 'Create a new directory',
          enabled: true,
          category: 'file'
        },
        {
          id: 'deleteFile',
          name: 'Delete File',
          description: 'Delete a file from the filesystem',
          enabled: true,
          category: 'file'
        },
        {
          id: 'searchFiles',
          name: 'Search Files',
          description: 'Search for files by name or content',
          enabled: true,
          category: 'file'
        },
        {
          id: 'getProjectInfo',
          name: 'Get Project Info',
          description: 'Get information about the current project',
          enabled: true,
          category: 'system'
        }
      ];

      // Convert MCP tools
      const mcpToolItems: Tool[] = mcpTools.map((tool: any) => ({
        id: `mcp_${tool.serverId}_${tool.name}`,
        name: tool.name,
        description: tool.description || 'MCP tool',
        enabled: true,
        category: 'mcp' as const,
        serverId: tool.serverId,
        status: servers.find(s => s.id === tool.serverId)?.status || 'stopped'
      }));

      setTools([...staticTools, ...mcpToolItems]);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTools();
    }
  }, [isOpen]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'starting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'stopped':
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mcp':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'file':
      default:
        return <Wrench className="h-4 w-4 text-gray-500" />;
    }
  };

  // Group tools by server for MCP tools, and by category for others
  const groupedTools = tools.reduce((acc, tool) => {
    if (tool.category === 'mcp' && tool.serverId) {
      const serverKey = `mcp-${tool.serverId}`;
      if (!acc[serverKey]) {
        acc[serverKey] = [];
      }
      acc[serverKey].push(tool);
    } else {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
    }
    return acc;
  }, {} as Record<string, Tool[]>);

  // Get server info for display
  const getServerInfo = (serverId: string) => {
    return mcpServers.find(s => s.id === serverId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">AI Tools Manager</h2>
            <Badge variant="outline" className="ml-2">
              {tools.length} tools
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setActionLoading('refresh');
                try {
                  onRefreshMCP();
                  await loadTools();
                } finally {
                  setActionLoading(null);
                }
              }}
              disabled={loading || actionLoading === 'refresh'}
            >
              <RefreshCw className={cn("h-4 w-4", (loading || actionLoading === 'refresh') && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>


        {/* Tools by Category and MCP Server */}
        <div className="space-y-6">
          {Object.entries(groupedTools)
            .sort(([keyA], [keyB]) => {
              // Sort order: system, file, then MCP servers
              const orderA = keyA === 'system' ? 0 : keyA === 'file' ? 1 : 2;
              const orderB = keyB === 'system' ? 0 : keyB === 'file' ? 1 : 2;
              if (orderA !== orderB) return orderA - orderB;
              return keyA.localeCompare(keyB);
            })
            .map(([groupKey, groupTools]) => {
            const isMCPServer = groupKey.startsWith('mcp-');
            const serverId = isMCPServer ? groupKey.replace('mcp-', '') : null;
            const serverInfo = serverId ? getServerInfo(serverId) : null;
            
            return (
              <div key={groupKey}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    {isMCPServer ? (
                      <>
                        <Zap className="h-4 w-4 text-purple-500" />
                        {serverId}
                        {serverInfo && getStatusIcon(serverInfo.status)}
                        <Badge variant="outline" className="text-xs">
                          MCP Server
                        </Badge>
                      </>
                    ) : (
                      <>
                        {getCategoryIcon(groupKey)}
                        {groupKey.charAt(0).toUpperCase() + groupKey.slice(1)} Tools
                      </>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {groupTools.length}
                    </Badge>
                  </h3>
                  
                  {isMCPServer && serverInfo && (
                    <div className="flex items-center gap-1">
                      {serverInfo.status === 'running' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setActionLoading(`stop-${serverId}`);
                            try {
                              // Call stop server API if available
                              await loadTools();
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === `stop-${serverId}`}
                          className="h-6 w-6 p-0"
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setActionLoading(`start-${serverId}`);
                            try {
                              // Call start server API if available
                              await loadTools();
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === `start-${serverId}`}
                          className="h-6 w-6 p-0"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setActionLoading(`restart-${serverId}`);
                          try {
                            // Call restart server API if available
                            await loadTools();
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                        disabled={actionLoading === `restart-${serverId}`}
                        className="h-6 w-6 p-0"
                      >
                        <RotateCcw className={cn("h-3 w-3", actionLoading === `restart-${serverId}` && "animate-spin")} />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {groupTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(tool.category)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{tool.name}</div>
                          <div className="text-xs text-gray-400 line-clamp-2">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={tool.enabled}
                        onCheckedChange={(checked) => onToolToggle(tool.id, checked)}
                        disabled={tool.category === 'mcp' && tool.status !== 'running'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {tools.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No tools found</p>
            <p className="text-xs">Try refreshing or check your MCP configuration</p>
          </div>
        )}
      </div>
    </div>
  );
};